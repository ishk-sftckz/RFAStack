---
title: Perlindungan Resource
description: Tentukan tempat pemeriksaan sesi dan izin akses agar data privat tetap terlindungi, dari jalur mana pun operasinya dipanggil.
---

# Perlindungan Resource

Aplikasi full-stack harus memastikan siapa yang boleh membaca data privat dan siapa yang boleh mengubahnya. Pemeriksaan ini perlu masuk ke rancangan aplikasi sejak awal, supaya setiap jalur akses mendapat perlindungan yang sama.

Bagi pemeriksaannya menjadi beberapa lapisan. Gunakan Proxy untuk pemeriksaan awal dan redirect ke login, query auth untuk memverifikasi sesi, serta Data Access Layer (DAL) untuk memeriksa akses ke data dan operasi. Masing-masing punya pekerjaan yang berbeda.

Pemeriksaan autentikasi dan otorisasi harus ada di operasi fitur yang membaca atau mengubah resource. Pemeriksaan di halaman saja tidak cukup: Server Action bisa menerima request tanpa melewati halaman tersebut. [Keamanan data Next.js](https://nextjs.org/docs/app/guides/data-security#authentication-and-authorization)

## Bagi tugas setiap lapisan pemeriksaan {#give-each-protection-layer-a-clear-responsibility}

Autentikasi menjawab siapa yang mengirim request. Otorisasi menentukan apa yang boleh ia akses atau ubah. Sudah login bukan berarti boleh melihat semua pesanan. [Panduan otorisasi OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

Pada pembatalan pesanan, pemeriksaannya terbagi seperti ini:

| Lapisan | Yang diperiksa |
| --- | --- |
| Proxy | Apakah pengunjung lolos pemeriksaan sesi awal, atau perlu diarahkan ke login? |
| Fitur auth | Apakah sesinya valid, dan pengguna mana yang sedang login? |
| Fitur membership | Akun dan peran apa yang boleh dipakai pengguna? |
| Fitur orders | Apakah pengguna boleh mengakses pesanan ini, dan apakah pesanannya masih bisa dibatalkan? |
| UI | Kontrol apa yang perlu ditampilkan, dan bagaimana hasilnya disampaikan? |

Informasi yang tersedia di setiap lapisan berbeda. Proxy bisa memutuskan redirect, sedangkan fitur orders bisa memeriksa pemilik pesanan dan status pengirimannya.

Simpan setiap pemeriksaan di tempat yang mengurusnya. Fitur orders tetap harus memeriksa akses dan aturan pembatalan meskipun request tidak melewati pemeriksaan route lebih dulu.

## Gunakan Proxy untuk redirect awal {#use-proxy-for-early-redirects}

Sejak Next.js 16, Middleware berganti nama menjadi Proxy. Konfigurasi `matcher` menentukan path request yang melewatinya. [Referensi Proxy Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

Letakkan `proxy.ts` di dalam `src`, sejajar dengan `app`, agar ditemukan oleh Next.js. File ini mengurus pencocokan request dan redirect. Helper cookie Better Auth boleh dipakai untuk pemeriksaan tersebut. Namun, jangan tarik `auth.provider.ts`, query membership, atau operasi resource ke sini; pekerjaan fitur itu bukan bagian dari pemeriksaan awal.

Untuk area aplikasi yang membutuhkan login, kami menyarankan Proxy agar redirect pengunjung yang belum login bisa diatur di satu tempat. Lapisan ini opsional menurut Next.js. Pemeriksaannya sebaiknya ringan karena Proxy juga bisa berjalan saat route di-prefetch. [Panduan autentikasi Next.js](https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional)

Pemeriksaan khusus resource tetap di operasi fitur. Kalau kepemilikan pesanan diperiksa di Proxy, aturannya akan bergantung pada URL. Pemeriksaan itu juga harus diulang saat operasi yang sama dibuka lewat transport lain.

Contoh berikut mengarahkan pengunjung tanpa cookie sesi Better Auth ke login sebelum `/orders` atau route turunannya dirender:

```ts
// src/proxy.ts
import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/orders/:path*'],
}
```

Contoh ini memakai konfigurasi cookie bawaan Better Auth. Kalau nama atau prefix cookie diubah, sesuaikan juga `getSessionCookie()`. Adanya cookie hanya menentukan apakah redirect dijalankan. Cookie palsu atau kedaluwarsa masih bisa lolos, jadi operasi fitur tetap harus memeriksa apakah sesinya valid. [Integrasi Proxy Better Auth](https://better-auth.com/docs/integrations/next#auth-protection)

Tulis path matcher sebagai nilai literal agar bisa dianalisis Next.js saat build. Matcher di atas tidak mencakup halaman login, endpoint auth, dan aset framework. Saat menambah halaman yang membutuhkan login, masukkan URL-nya ke matcher. Route group seperti `(authenticated)` tidak menambah segmen URL. Endpoint API menangani kegagalan autentikasi lewat respons API-nya sendiri.

Uji cookie yang tidak ada, kosong, palsu, dan kedaluwarsa. Pastikan nama cookie biasa maupun secure dikenali. Cookie yang tidak valid tetap harus ditolak saat operasi fitur memverifikasi sesi. Halaman login juga harus tetap bisa dibuka ketika browser masih menyimpan cookie lama.

Untuk dokumen statis privat, periksa akses di tempat file itu disajikan. Query aplikasi tidak bisa melindungi file yang masih dapat diunduh langsung lewat URL publik. [Panduan OWASP tentang resource statis](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#enforce-authorization-checks-on-static-resources)

## Periksa akses data di operasi server fitur {#put-data-protection-in-the-feature-s-server-operations}

Data Access Layer (DAL) mengatur akses ke data aplikasi. Next.js menyarankan lapisan ini berjalan di server, memeriksa otorisasi, dan mengembalikan DTO dengan field seperlunya yang aman bagi penerima. Contoh Next.js juga menempatkan autentikasi di dalam operasi data, sehingga Server Action cukup memanggilnya. [Panduan DAL Next.js](https://nextjs.org/docs/app/guides/data-security#data-access-layer)

Gunakan [struktur fitur yang sudah ada](./folder-structure#keep-operation-modules-at-the-feature-root) untuk membagi pekerjaan ini:

| Lokasi | Tanggung jawab |
| --- | --- |
| `features/auth/auth.queries.ts` | Memeriksa sesi dan mengembalikan pengguna yang sedang login. |
| `features/membership/membership.queries.ts` | Mencari keanggotaan pengguna dan akun bisnis yang boleh diaksesnya. |
| `features/orders/order.queries.ts` | Memeriksa izin membaca pesanan dan memilih field hasil yang boleh diterima. |
| `features/orders/cancel-order.use-case.ts` | Memeriksa izin dan aturan bisnis sebelum membatalkan pesanan. |
| `features/orders/order.repository.ts` | Menampung kode persistensi jika memang perlu repository terpisah. |

Tidak perlu membuat folder `dal/` global. Aturan akses resource tetap di fitur terkait, verifikasi sesi dipakai bersama lewat auth, dan pemeriksaan akses akun lewat membership.

Jika operasi dijalankan atas nama pengguna yang sedang login, tentukan akunnya di dalam query atau use case publik yang dilindungi. Dengan begitu, halaman lain yang memanggil operasi itu otomatis mendapat pemeriksaan yang sama.

## Query yang dilindungi harus memastikan siapa penggunanya {#make-a-protected-read-establish-its-caller}

Bayangkan query daftar pesanan yang langsung percaya pada ID akun dari argumen. Setiap kode yang memanggilnya harus memastikan sendiri asal ID itu. Satu halaman mungkin mengambilnya dari sesi yang valid, sementara handler lain meneruskan parameter URL begitu saja.

Lebih baik query menentukan akun yang boleh diakses sendiri:

```ts
// src/features/orders/order.queries.ts
import 'server-only'

import { requireAccount } from '@/features/membership/membership.queries'
import { database } from '@/platform/database/client'
import { orderSummarySchema } from './model/order.schema'

export async function listOrders() {
  const account = await requireAccount()

  const rows = await database.order.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      totalInCents: true,
      createdAt: true,
    },
  })

  return rows.map((row) =>
    orderSummarySchema.parse({
      id: row.id,
      status: row.status,
      totalInCents: row.totalInCents,
      createdAt: row.createdAt.toISOString(),
    }),
  )
}
```

Contoh ini menggunakan [schema ringkasan pesanan dan klien database bergaya Prisma](./data-fetching-and-mutation#read-during-rendering-through-a-server-component) dari panduan pengambilan data. `requireAccount()` harus menolak sesi yang tidak valid dan hanya mengembalikan akun yang boleh dipakai pengguna.

Query lalu mengambil pesanan dari akun itu dan memilih field hasilnya. Halaman tinggal memanggil query dan menampilkan data:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default async function OrdersPage() {
  const orders = await listOrders()

  return <OrderList orders={orders} />
}
```

Untuk detail pesanan, ID pesanan tetap dikirim sebagai input. Validasi ID-nya, lalu cari pesanan dalam akun yang sudah diizinkan. Format ID yang benar hanya membuktikan input-nya valid. Filter akun pada query yang memastikan akses ke pesanan tersebut.

Sebagian query juga menerima ID akun untuk menunjukkan akun yang diminta, seperti pada [contoh query browser](./data-fetching-and-mutation#add-tanstack-query-for-caching-and-background-updates). Tetap cocokkan ID itu dengan akun pengguna yang terautentikasi. Menaruh ID akun di URL atau cache key tidak memberi izin untuk membacanya.

## Periksa izin mutasi terhadap data terbaru {#authorize-mutations-against-the-current-resource}

Request pembatalan membawa ID pesanan. Use case harus memverifikasi pengguna, mencari pesanan dalam akun yang boleh diaksesnya, lalu memeriksa status terkini sebelum melakukan update.

UI boleh memakai aturan pembatalan yang sama untuk menentukan apakah tombol ditampilkan. Namun, use case harus memeriksanya lagi menggunakan data tersimpan. Status pesanan bisa saja berubah sejak halaman dibuka.

Kalau database mendukungnya, sertakan syarat kepemilikan dan status pada operasi update. [Contoh pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) memakai akun dan status yang sudah diperiksa sebagai kondisi update. Jadi, pesanan tidak dibatalkan berdasarkan status lama ketika ada perubahan bersamaan.

Seluruh pemeriksaannya ada dalam use case berikut:

```ts
// src/features/orders/cancel-order.use-case.ts
import 'server-only'

import { requireAccount } from '@/features/membership/membership.queries'
import { database } from '@/platform/database/client'
import { canCancelOrder } from './model/order-cancellation'
import { cancelOrderInputSchema, orderStatusSchema } from './model/order.schema'
import type { CancelOrderInput } from './model/order.schema'

export async function cancelOrderUseCase(input: CancelOrderInput) {
  const account = await requireAccount()
  const { orderId } = cancelOrderInputSchema.parse(input)

  const order = await database.order.findFirst({
    where: { id: orderId, accountId: account.id },
    select: { id: true, status: true },
  })

  if (!order) throw new Error('Order not found')

  const status = orderStatusSchema.parse(order.status)
  if (!canCancelOrder(status)) {
    throw new Error('This order can no longer be cancelled')
  }

  const result = await database.order.updateMany({
    where: { id: orderId, accountId: account.id, status },
    data: { status: 'cancelled' },
  })

  if (result.count !== 1) {
    throw new Error('The order changed before cancellation completed')
  }
}
```

Sesuai [aturan pembatalan murni](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order), `canCancelOrder()` mengizinkan status pending atau confirmed. Pesanan milik akun lain mendapat hasil “tidak ditemukan” yang sama dengan ID yang tidak dikenal. Kalau status berubah setelah query selesai, update bersyarat tidak mengubah baris apa pun dan operasi gagal.

Server Action, Route Handler, dan prosedur RPC bisa memanggil use case yang sama. Masing-masing adapter mengurus format input, penanganan error, serta respons atau refresh UI yang sesuai.

Server Action tidak mengambil ID akun dari form:

```ts
// src/features/orders/order.actions.ts
'use server'

import { refresh } from 'next/cache'
import { cancelOrderInputSchema } from './model/order.schema'
import { cancelOrderUseCase } from './cancel-order.use-case'

export async function cancelOrder(formData: FormData) {
  const input = cancelOrderInputSchema.parse({
    orderId: formData.get('orderId'),
  })

  await cancelOrderUseCase(input)
  refresh()
}
```

Request langsung ke action tetap melewati pemeriksaan sesi, kepemilikan, dan status dalam use case. Setelah berhasil, contoh ini me-refresh route. Jika query memakai cache, [invalidasi entri yang terpengaruh](./caching#invalidate-the-affected-result-after-a-successful-write) juga.

Laporkan kegagalan autentikasi dalam bentuk yang bisa ditangani oleh kode yang memanggil operasi. Halaman bisa melakukan redirect ke login, sedangkan API mengembalikan respons error yang sesuai.

## Pakai pemeriksaan sesi yang sama, tanpa bergantung pada layout {#reuse-verification-without-relying-on-a-layout}

Operasi yang dilindungi bisa memanggil query membership yang sama. Dari sana, pemeriksaan akun dan verifikasi sesi auth dipakai ulang. Ini lebih mudah dirawat daripada menulis ulang cara memverifikasi sesi di setiap operasi.

Saat rendering Server Component, `cache()` React bisa menghindari pekerjaan verifikasi yang berulang. Cache ini direset pada request server berikutnya. Panggilan di luar konteks cache React tidak mendapat memoization yang sama. [React cache](https://react.dev/reference/react/cache)

Pemeriksaan di layout punya fungsi berbeda. Layout tidak dirender ulang pada setiap navigasi, dan menyembunyikan children tidak mencegah semua segmen route di bawahnya dieksekusi. Walaupun layout memakai data sesi, tetap periksa akses resource dekat dengan operasi datanya. [Panduan autentikasi layout Next.js](https://nextjs.org/docs/app/guides/authentication#layouts-and-auth-checks)

Jika operasi juga dipakai background job atau klien dengan kredensial lain, definisikan konteks aktor tepercaya yang jelas. Setiap entry point bertanggung jawab memastikan identitas dan izin aktor tersebut. Aturan bisnisnya tetap tidak perlu bergantung pada cookie browser.

## Batasi penggunaan Better Auth di fitur auth {#keep-better-auth-behind-the-identity-boundary}

Simpan verifikasi sesi di fitur auth. Membership memanggil query publik auth, lalu mencari keanggotaan dan akun yang boleh dipakai. Sesi valid belum tentu cukup: pengguna yang belum punya keanggotaan bisnis tetap bisa ditolak saat mengakses akun aplikasi.

Tabel provider berada di `auth.table.ts`. File `auth.provider.ts` memberikan tabel itu ke factory di `platform/auth/server.ts`. Factory mengonfigurasi Better Auth dan adapter database tanpa mengimpor fitur. Adapter Drizzle Better Auth mendukung schema yang diberikan dari luar. [Konfigurasi adapter Drizzle](https://better-auth.com/docs/adapters/drizzle)

Query sesi publik hanya mengembalikan field yang dibutuhkan membership:

```ts
// src/features/auth/auth.queries.ts
import 'server-only'
import { AccessError } from '@/shared/utils/errors'
import { authProvider } from './auth.provider'
import { sessionSchema } from './model/auth.schema'

export async function requireSession(requestHeaders: Headers) {
  const session = await authProvider.api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  })

  if (!session) throw new AccessError(401, 'Please sign in.')

  return sessionSchema.parse({ userId: session.user.id, name: session.user.name })
}
```

`sessionSchema` mendefinisikan ID dan nama pengguna yang boleh diteruskan. `requireMembership()` memanggil `requireSession()`, mencari keanggotaan pengguna, lalu menolak akses jika tidak ada. Kalau aplikasi mendukung pemilihan akun bisnis, `requireAccount()` bisa menentukan akun yang diminta setelah pemeriksaan tersebut.

UI login dan logout berada di `features/auth/ui` dan memakai klien browser Better Auth dari `platform/auth/client.ts`. Route Handler auth memasang `authProvider.handler` langsung dari `auth.provider.ts`. Fitur lain cukup memakai query sesi.

Better Auth mendokumentasikan API ini untuk Server Components dan Server Actions. Helper `getSessionCookie()` hanya memeriksa keberadaan cookie. Pakai untuk redirect awal, lalu verifikasi sesi sebelum memberi akses ke data privat. [Integrasi Next.js Better Auth](https://better-auth.com/docs/integrations/next)

Setelah sesi valid, helper membership tetap harus menentukan akun bisnis aplikasi. Record `Account` di Better Auth mewakili metode login yang ditautkan, bukan otomatis akun pelanggan atau tenant. [Schema database Better Auth](https://better-auth.com/docs/concepts/database#account)

Perhatikan kebijakan cache sesi. Jika cookie cache Better Auth aktif, sesi yang sudah dicabut masih bisa diterima sampai cache-nya kedaluwarsa. Operasi yang harus memeriksa penyimpanan sesi secara langsung bisa melewati cookie cache dengan `disableCookieCache`. [Pengelolaan sesi Better Auth](https://better-auth.com/docs/concepts/session-management)

Query di atas menonaktifkan cookie cache agar memeriksa penyimpanan sesi. Kebijakan ini tetap di auth. Membership mengurus keanggotaan, sementara orders mengurus izin akses pesanan.

## Tentukan aturan akses sebelum menambahkan cache {#choose-caching-after-defining-access}

Contoh di atas selalu membaca data terkini tanpa cache bersama. Jika ingin menambahkan cache, verifikasi pengguna lebih dulu dan pastikan key membedakan lingkup data yang boleh dilihatnya. [Contoh caching untuk data privat](./caching#keep-protected-checks-outside-shared-cached-results) menunjukkan pembagiannya.

Untuk UI yang bergantung pada request, ada juga [contoh `use cache: private`](./caching#use-private-caching-for-request-dependent-ui). Directive ini mengizinkan API request di dalam fungsi cache dan memakai ulang hasilnya di memori browser. Setiap kali fungsi berjalan di server, pemeriksaan akses pada query tetap harus dijalankan. [Private caching Next.js](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

Selanjutnya: [tentukan apa yang di-cache dan cara memperbaruinya](./caching).
