---
title: Perlindungan Resource
description: Tempat memverifikasi sesi, menegakkan akses resource, dan mengembalikan data yang aman dalam aplikasi Next.js.
---

# Perlindungan Resource

Melindungi resource adalah tanggung jawab utama saat membangun aplikasi full-stack Next.js. Anda harus mengendalikan siapa yang dapat mengakses data privat dan menjalankan operasi yang mengubahnya. Kontrol akses tersebut harus menjadi bagian dari arsitektur aplikasi sejak awal.

Gunakan beberapa lapisan perlindungan. Kami merekomendasikan Proxy untuk pemeriksaan route awal dan pengalihan ke login, query auth untuk verifikasi sesi, serta Data Access Layer (DAL) untuk menegakkan akses ke data dan operasi. Setiap lapisan memiliki tanggung jawab, dan bersama-sama melindungi berbagai jalur dalam aplikasi.

Tegakkan autentikasi dan otorisasi di dalam operasi fitur yang membaca atau mengubah resource terlindungi. Pemeriksaan di tingkat halaman tidak melindungi Server Actions miliknya, yang dapat menerima request secara independen dari halaman. [Keamanan data Next.js](https://nextjs.org/docs/app/guides/data-security#authentication-and-authorization)

## Tetapkan tanggung jawab setiap lapisan perlindungan {#give-each-protection-layer-a-clear-responsibility}

Autentikasi memastikan siapa yang membuat request. Otorisasi menentukan apa yang boleh diakses atau diubah oleh pemanggil tersebut. Login yang valid tidak memberikan akses ke semua pesanan. [Panduan otorisasi OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

Untuk pembatalan pesanan, ada beberapa keputusan di sepanjang jalur:

| Lapisan | Tanggung jawab |
| --- | --- |
| Proxy | Mengalihkan pengunjung yang tidak lolos pemeriksaan sesi awal. |
| Fitur auth | Memverifikasi sesi dan mengidentifikasi pengguna yang terautentikasi. |
| Fitur membership | Menetapkan akun dan peran yang boleh digunakan pemanggil. |
| Fitur orders | Memverifikasi akses ke pesanan yang diminta dan menegakkan aturan pembatalan. |
| UI | Menampilkan kontrol yang tersedia dan menjelaskan hasilnya. |

Setiap lapisan memiliki informasi berbeda. Proxy dapat memutuskan apakah pengunjung perlu dialihkan, sementara fitur orders dapat memeriksa siapa pemilik pesanan dan apakah pesanan sudah dikirim.

Simpan keputusan itu bersama kode pemiliknya. Fitur orders harus menegakkan aturannya meskipun request mencapainya tanpa pemeriksaan route sebelumnya.

## Gunakan Proxy untuk pengalihan awal {#use-proxy-for-early-redirects}

Next.js 16 mengganti nama Middleware menjadi Proxy. Konfigurasi `matcher` menentukan path request yang melewatinya. [Referensi Proxy Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

Tempatkan `proxy.ts` di samping `app` dalam `src`, agar ditemukan oleh Next.js. Perlakukan sebagai entry point framework yang menangani pencocokan request dan pengalihan. Mengimpor fungsi bantu cookie Better Auth di sini sesuai dengan tanggung jawab itu; mengimpor `auth.provider.ts`, query membership, atau operasi resource akan menarik pekerjaan fitur ke pemeriksaan awal ini.

Kami merekomendasikan Proxy untuk area aplikasi yang membutuhkan autentikasi. Anda memiliki satu tempat untuk mengarahkan pengunjung yang belum login sebelum route dirender. Next.js menganggap lapisan ini opsional dan menyarankan pemeriksaan ringan karena Proxy juga dapat berjalan untuk route yang di-prefetch. [Panduan autentikasi Next.js](https://nextjs.org/docs/app/guides/authentication#optimistic-checks-with-proxy-optional)

Simpan keputusan khusus resource dalam operasi fitur. Memeriksa kepemilikan pesanan di Proxy akan mengikat aturan pada pencocokan URL dan mengulangnya untuk setiap transport yang menyediakan operasi sama.

Contohnya, alihkan pengunjung tanpa cookie sesi Better Auth sebelum merender `/orders` atau route turunannya:

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

Contoh ini menggunakan konfigurasi cookie bawaan Better Auth. Sesuaikan nama atau prefix cookie kustom di `getSessionCookie()` juga. Keberadaan cookie hanya menentukan pengalihan ini: cookie kedaluwarsa atau palsu bisa lolos, sehingga operasi terlindungi tetap harus memverifikasi sesi. [Integrasi Proxy Better Auth](https://better-auth.com/docs/integrations/next#auth-protection)

Tulis path matcher sebagai literal agar Next.js dapat menganalisisnya saat build. Matcher ini mengecualikan login, endpoint auth, dan aset framework dari pemeriksaan pengalihan. Saat menambahkan halaman terlindungi, masukkan URL-nya ke matcher; route group seperti `(authenticated)` tidak menambahkan segmen URL. Endpoint API harus melaporkan kegagalan autentikasi melalui transport masing-masing.

Periksa bahwa cookie sesi yang tidak ada atau kosong menyebabkan pengalihan, nama cookie biasa maupun secure berfungsi, serta cookie palsu atau kedaluwarsa tetap gagal saat verifikasi sesi dalam operasi terlindungi. Jaga agar login tetap bisa diakses ketika ada cookie lama sehingga pengunjung dapat login kembali.

Dokumen statis privat membutuhkan perhatian terpisah: akses harus ditegakkan di tempat dokumen disajikan. Query aplikasi tidak bisa melindungi file yang dapat diambil langsung melalui URL publik. [Panduan OWASP tentang resource statis](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#enforce-authorization-checks-on-static-resources)

## Tempatkan perlindungan data dalam operasi server fitur {#put-data-protection-in-the-feature-s-server-operations}

Data Access Layer, atau DAL, mengendalikan akses ke data aplikasi. Next.js merekomendasikan agar lapisan ini berjalan di server, memeriksa otorisasi, dan mengembalikan data transfer object yang aman serta minimal. Dokumentasinya juga menunjukkan autentikasi di dalam operasi data, sehingga Server Action pemanggil tetap tipis. [Panduan DAL Next.js](https://nextjs.org/docs/app/guides/data-security#data-access-layer)

Simpan tanggung jawab tersebut dalam [struktur fitur yang sudah ada](./folder-structure#keep-operation-modules-at-the-feature-root):

| Lokasi | Tanggung jawab |
| --- | --- |
| `features/auth/auth.queries.ts` | Memverifikasi sesi dan mengembalikan pengguna yang terautentikasi. |
| `features/membership/membership.queries.ts` | Menentukan keanggotaan bisnis pengguna dan konteks akun yang diizinkan. |
| `features/orders/order.queries.ts` | Mengotorisasi pembacaan pesanan dan mengembalikan field yang boleh diterima pemanggil. |
| `features/orders/cancel-order.use-case.ts` | Mengotorisasi pembatalan dan menerapkan aturan bisnis. |
| `features/orders/order.repository.ts` | Membungkus persistensi ketika repository terpisah berguna. |

Anda tidak membutuhkan direktori `dal/` global untuk menetapkan batas ini. Simpan kebijakan resource bersama fiturnya, bagikan verifikasi sesi melalui auth, dan pemeriksaan akses akun melalui membership.

Untuk operasi atas nama pengguna yang sedang login, peroleh akun di dalam query atau use case publik yang dilindungi. Saat halaman lain mengimpor operasi itu, perlindungannya ikut terbawa.

## Pastikan pembacaan terlindungi mengenali pemanggilnya {#make-a-protected-read-establish-its-caller}

Bayangkan query yang menampilkan daftar pesanan. Jika query memercayai ID akun yang diberikan, setiap pemanggil harus tahu dari mana ID tersebut boleh berasal. Satu pemanggil mungkin memperolehnya dari sesi terverifikasi, sementara yang lain meneruskan parameter URL.

Operasi terlindungi dapat mengambil alih keputusan itu dari pemanggilnya:

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

Contoh ini menggunakan [schema ringkasan pesanan dan klien database bergaya Prisma](./data-fetching-and-mutation#read-during-rendering-through-a-server-component) dari panduan pengambilan data. `requireAccount()` harus menolak sesi tidak valid dan mengembalikan akun yang boleh digunakan pemanggil terautentikasi.

Query membatasi pembacaan database pada akun itu dan memilih field yang dikembalikan. Halaman cukup memanggil operasi dan merender hasilnya:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default async function OrdersPage() {
  const orders = await listOrders()

  return <OrderList orders={orders} />
}
```

Untuk query detail, pemanggil tetap memberikan ID pesanan yang diminta. Validasi input tersebut, lalu cari pesanan di dalam akun yang diizinkan. Format ID yang benar memastikan bentuk input; pencarian dalam lingkup akun memastikan apakah akun ini boleh mengakses pesanan tersebut.

Sebagian pembacaan juga menerima ID akun untuk menentukan lingkup yang diminta, seperti pada [contoh query browser](./data-fetching-and-mutation#add-tanstack-query-for-caching-and-background-updates). Query terlindungi harus memverifikasi pilihan itu terhadap akun yang terautentikasi. Mencantumkan ID akun dalam URL atau cache key tidak memberikan akses ke akun tersebut.

## Otorisasi mutasi berdasarkan resource terkini {#authorize-mutations-against-the-current-resource}

Request pembatalan memberikan ID pesanan. Use case pembatalan harus mengenali pemanggil, menemukan pesanan dalam akun yang diizinkan bagi pemanggil itu, dan memeriksa status terkini sebelum memperbaruinya.

UI boleh menggunakan aturan pembatalan murni yang sama untuk menentukan apakah tombol ditampilkan. Use case menerapkan aturan itu lagi pada data tersimpan karena pesanan mungkin berubah sejak halaman dirender.

Sertakan batasan kepemilikan dan kelayakan dalam operasi penulisan jika database mendukungnya. [Contoh pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) menyertakan akun dan status yang diperiksa dalam kondisi update, sehingga pesanan yang berubah bersamaan tidak dibatalkan berdasarkan keputusan lama.

Berikut use case dengan seluruh pemeriksaan perlindungannya:

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

`canCancelOrder()` menerima pesanan berstatus pending atau confirmed, sesuai [aturan pembatalan murni](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order). Pesanan milik akun lain menghasilkan respons tidak ditemukan yang sama dengan ID tidak dikenal. Jika status berubah setelah pembacaan, penulisan bersyarat tidak memengaruhi baris mana pun dan operasi gagal.

Server Action, Route Handler, atau prosedur RPC dapat memanggil use case terlindungi ini. Setiap adapter menangani transport-nya: mem-parsing input, menyesuaikan kegagalan, dan menyegarkan UI atau mengembalikan response.

Server Action tidak menerima ID akun dari formulir:

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

Memanggil action ini secara langsung tetap melewati pemeriksaan sesi, kepemilikan, dan status dalam use case. Contoh ini menyegarkan route setelah berhasil; jika pembacaan menggunakan cache, [batalkan validitas entri yang terpengaruh](./caching#invalidate-the-affected-result-after-a-successful-write) juga.

Operasi bersama harus melaporkan kegagalan autentikasi dalam bentuk yang dapat disesuaikan pemanggilnya. Halaman dapat mengalihkan ke login; API harus mengembalikan respons error yang sesuai.

## Gunakan ulang verifikasi tanpa bergantung pada layout {#reuse-verification-without-relying-on-a-layout}

Memanggil query membership yang sama dari operasi terlindungi menggunakan ulang pemeriksaan akses akun dan verifikasi sesi auth. Masalah perawatan muncul ketika setiap operasi membuat verifikasi sesinya sendiri.

Selama rendering Server Component, React `cache()` dapat membagikan hasil verifikasi yang berulang. Cache-nya direset antar-request server, dan pemanggil di luar konteks cache React tidak mendapatkan perilaku memoization yang sama. [React cache](https://react.dev/reference/react/cache)

Pemeriksaan layout memiliki tujuan berbeda. Layout tidak dirender ulang pada setiap navigasi, dan menyembunyikan turunannya tidak mencegah seluruh segmen route bersarang dieksekusi. Tempatkan pemeriksaan resource dekat akses data meskipun layout juga menggunakan informasi sesi. [Panduan autentikasi layout Next.js](https://nextjs.org/docs/app/guides/authentication#layouts-and-auth-checks)

Jika operasi juga membutuhkan pemanggil berupa background job atau kredensial alternatif, definisikan konteks aktor tepercaya yang eksplisit untuk implementasi itu. Setiap entry point harus memastikan aktor beserta izinnya. Jaga aturan bisnis tetap tidak bergantung pada cookie browser.

## Tempatkan Better Auth di balik batas auth {#keep-better-auth-behind-the-identity-boundary}

Letakkan verifikasi sesi di fitur auth. Membership memanggil query publik auth, lalu menentukan keanggotaan dan akun yang boleh digunakan pemanggil. Pengguna terautentikasi tanpa keanggotaan bisnis bisa memiliki sesi valid, sementara membership menolak akses ke akun aplikasi.

Auth memiliki tabel provider di `auth.table.ts`. File `auth.provider.ts` memberikan tabel tersebut ke factory di `platform/auth/server.ts`. Factory mengonfigurasi Better Auth dan adapter database-nya tanpa mengimpor fitur. Adapter Drizzle Better Auth menerima schema yang diberikan. [Konfigurasi adapter Drizzle](https://better-auth.com/docs/adapters/drizzle)

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

Di sini, `sessionSchema` mendefinisikan ID dan nama pengguna publik. `requireMembership()` milik fitur membership memanggil `requireSession()`, mencari keanggotaan pengguna, dan menolak pemanggil yang tidak memilikinya. `requireAccount()` kemudian dapat menentukan akun bisnis yang diminta jika aplikasi mendukung pemilihan akun.

Simpan UI login dan logout di `features/auth/ui`. Komponen tersebut menggunakan klien browser Better Auth dari `platform/auth/client.ts`. Route Handler auth memasang `authProvider.handler` langsung dari `auth.provider.ts`. Fitur lain menggunakan query sesi secara langsung.

Better Auth mendokumentasikan API ini untuk Server Components dan Server Actions. Fungsi bantu `getSessionCookie()` hanya memeriksa keberadaan cookie, jadi gunakan untuk pengalihan optimistis dan validasi sesi sebelum memberikan akses ke resource terlindungi. [Integrasi Next.js Better Auth](https://better-auth.com/docs/integrations/next)

Fungsi bantu membership kemudian harus menentukan konteks akun aplikasi. Record `Account` Better Auth mewakili metode autentikasi yang ditautkan; record itu tidak otomatis mewakili akun pelanggan atau tenant aplikasi Anda. [Schema database Better Auth](https://better-auth.com/docs/concepts/database#account)

Pilih caching sesi dengan pertimbangan yang jelas. Jika cookie cache Better Auth diaktifkan, sesi yang sudah dicabut dapat tetap diterima sampai data cache kedaluwarsa. Operasi yang membutuhkan pemeriksaan terkini terhadap penyimpanan sesi dapat melewati cookie cache dengan `disableCookieCache`. [Pengelolaan sesi Better Auth](https://better-auth.com/docs/concepts/session-management)

Query sesi di atas menonaktifkan penggunaan ulang cookie cache agar memeriksa penyimpanan sesi. Simpan kebijakan itu di auth. Membership memiliki pemeriksaan keanggotaan, dan orders memiliki akses ke data pesanan.

## Tentukan akses sebelum memilih caching {#choose-caching-after-defining-access}

Contoh di atas membaca data terkini tanpa cache data bersama. Saat menambahkannya, kenali pemanggil sebelum mengakses cache dan sertakan lingkup visibilitas yang diizinkan dalam key-nya. [Contoh caching terlindungi](./caching#keep-protected-checks-outside-shared-cached-results) menunjukkan batas tersebut.

Untuk UI yang bergantung pada request, panduan caching juga menyediakan [contoh `use cache: private`](./caching#use-private-caching-for-request-dependent-ui). Directive ini mengizinkan API request di dalam fungsi yang di-cache dan menggunakan ulang hasilnya di memori browser. Pemeriksaan akses query terlindungi tetap diperlukan setiap kali server mengeksekusinya. [Private caching Next.js](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

Selanjutnya: [pilih batas cache dan segarkan data yang terpengaruh](./caching).
