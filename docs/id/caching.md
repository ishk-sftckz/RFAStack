---
title: Caching
description: Pahami cara kerja cache Next.js dan tentukan apa yang perlu diperbarui di server serta browser setelah data berubah.
---

# Caching

Satu layar Next.js bisa memakai beberapa cache sekaligus. Masing-masing punya aturan sendiri untuk rendering, navigasi, dan mutasi. Bagian sulitnya adalah memahami hubungan antar-cache itu: apa yang masih dipakai ulang, apa yang sudah berubah, dan kapan pengguna akan melihat data terbaru.

Halaman ini menghubungkan mekanisme yang dibahas terpisah dalam dokumentasi Next.js. Setelah memahami cara kerjanya, kamu bisa menentukan bagian yang perlu di-cache dan cara menginvalidasinya di setiap fitur.

## Cek model caching yang dipakai proyek {#know-which-caching-model-your-project-uses}

Next.js membedakan dokumentasi [Cache Components](https://nextjs.org/docs/app/getting-started/caching) dari [model caching sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components). Sebelum mengikuti contoh, cek `next.config.ts`:

| Konfigurasi | Cara mengatur cache |
| --- | --- |
| Cache Components tidak aktif | Gunakan opsi cache pada `fetch`, `unstable_cache` untuk query server lainnya, dan pengaturan rendering route dari model sebelumnya. |
| `cacheComponents: true` | Tandai fungsi atau komponen async dengan `'use cache'`, tentukan masa berlakunya, lalu gabungkan dengan bagian yang harus berjalan saat request masuk. |

Mengaktifkan Cache Components juga mengubah cara rendering. Tinjau konfigurasi route yang sudah ada dan tempat menjalankan kode yang bergantung pada request. Fitur ini membutuhkan runtime Node.js. Untuk aplikasi yang sudah berjalan, ikuti [panduan migrasi](https://nextjs.org/docs/app/guides/migrating-to-cache-components).

Memoization request React dan TanStack Query tetap punya masa berlaku sendiri. Memilih model caching Next.js tidak menyatukan semua cache menjadi satu penyimpanan.

## Ketahui apa yang disimpan setiap cache {#identify-what-is-being-reused}

| Mekanisme | Yang disimpan | Kapan dipakai ulang |
| --- | --- | --- |
| Memoization request | Hasil query server atau fungsi yang dipanggil berulang | Dalam satu konteks render/request server React. |
| Data Cache, pada model sebelumnya | Respons `fetch` atau hasil `unstable_cache` yang dipilih untuk di-cache | Antar-request server, sesuai revalidasi dan konfigurasi penyimpanan. |
| Full Route Cache, pada model sebelumnya | HTML dan payload React Server Component hasil prerender | Pada request berikutnya ke route yang dirender statis. |
| Client Router Cache | Payload route dari navigasi dan prefetch | Dalam sesi browser yang sama, mengikuti aturan navigasi dan kesegaran data. |
| Cache Components | Data dari fungsi async atau output komponen bertanda `'use cache'` | Selama cache masih berlaku; penyimpanan runtime mengikuti cache handler. |
| TanStack Query | Hasil query berdasarkan query key aplikasi | Dalam `QueryClient` yang menyimpannya, biasanya di browser setelah hydration. |

Payload React Server Component (RSC) berisi hasil render server yang dipakai Next.js untuk menyusun dan memperbarui UI. Cache query dan cache route bisa menyimpan versi berbeda dari pesanan yang sama. Karena itu, kita perlu tahu operasi mana yang memperbarui masing-masing cache.

## Hindari query berulang dalam satu render server {#reuse-repeated-reads-within-a-server-render}

Tambahkan cache ketika ada pekerjaan yang bisa dihemat. Gunakan `cache()` React jika beberapa Server Component membutuhkan query yang sama dalam satu render. Pertimbangkan `'use cache'` secara terpisah jika hasil boleh dipakai ulang antar-request dan aturan kesegaran serta invalidasinya sudah jelas.

| Pertanyaan | React cache() | Next.js 'use cache' |
| --- | --- | --- |
| Pekerjaan apa yang tidak perlu diulang? | Panggilan dengan argumen yang sama dalam satu render server. | Pengambilan data atau render komponen antar-request, jika penyimpanan cache mendukungnya. |
| Bagaimana dengan request server berikutnya? | Fungsi dijalankan lagi saat dipanggil. | Hasil cache yang masih valid bisa dipakai ulang. |
| Apa yang menentukan kapan data diperbarui? | Batas request. | `cacheLife` dan invalidasi setelah perubahan. |

Kedua mekanisme ini berbeda. React mendokumentasikan [memoization request](https://react.dev/reference/react/cache), sedangkan Next.js menjelaskan [lingkup fungsi cache dan penyimpanannya](https://nextjs.org/docs/app/api-reference/directives/use-cache).

Di contoh native, `OrderDetails` dan `OrderTotal` sama-sama memanggil `getOrder(orderId)`. Dengan memoization, query pesanan cukup berjalan sekali selama render. Sementara itu, `listCachedOrders(scopeId)` memakai `'use cache'` karena daftar pada halaman akun boleh sedikit tertinggal dan akan diinvalidasi setelah mutasi. Jadi, pilihan cache tidak ditentukan oleh apakah hasilnya satu pesanan atau sebuah daftar.

Untuk query yang dipanggil berulang oleh komponen, ekspor satu fungsi memoized yang dipakai bersama:

```ts
// src/features/orders/order.queries.ts
import { cache } from 'react'

export const getOrderDetailsForRender = cache(
  (accountId: string, orderId: string) =>
    getOrderDetails({ accountId, orderId }),
)
```

Tambahkan fungsi ini di samping `getOrderDetails` yang sudah dilindungi dalam [panduan pengambilan data](./data-fetching-and-mutation#fetch-where-a-server-component-needs-the-data). Semua komponen mengimpor fungsi ekspor yang sama. ID akun dan pesanan memakai nilai primitif, sehingga argumen yang nilainya sama bisa cocok tanpa harus berbagi objek input.

Panggilan berikutnya memakai hasil pertama, meskipun database berubah di tengah render. Error juga disimpan: kalau `getOrder('123')` gagal, panggilan dengan argumen sama melempar error itu lagi tanpa retry. Untuk argumen objek, React membandingkan identitas objeknya. Dua objek baru `{ orderId: '123' }` tetap menghasilkan cache miss. Entri dihapus pada request berikutnya; Route Handler biasa berjalan di luar konteks cache React. [Referensi cache React](https://react.dev/reference/react/cache)

Cache sendiri membutuhkan penyimpanan dan pencarian. Query yang hanya dipanggil sekali tidak mendapat manfaat deduplikasi, jadi tidak perlu membungkus semua query dengan `cache()`. Mutasi dan query yang wajib berjalan ulang juga harus tetap di luar fungsi memoized.

Request `fetch` GET yang sama mendapat memoization otomatis saat rendering server. Ini berbeda dari menyimpan hasil antar-request. Jika memberikan signal `AbortController`, memoization otomatis tersebut tidak dipakai. Route Handler juga tidak termasuk pohon komponen React. [Memoization fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#memoization)

Gunakan memoization untuk mengurangi pekerjaan berulang dalam satu render. Tidak perlu tag invalidasi agar query berjalan lagi pada request berikutnya.

Setelah tahu query mana yang perlu memoization, tentukan tempat wrapper-nya. Buat wrapper khusus rendering jika operasi dasarnya juga dipakai kode yang memberikan konteks request sendiri. Kalau hanya dipakai saat rendering, query bisa langsung dibungkus. Di contoh native, `getOrder(orderId)` yang memoized memberikan header saat ini ke query privat yang dilindungi `withMembership`. Kedua komponen mengimpor `getOrder` yang sama, jadi pemeriksaan membership dan hasil pesanan bisa dipakai bersama selama render.

## Pahami cache data dan route tanpa Cache Components {#understand-data-and-route-caching-without-cache-components}

### Data Cache menyimpan query server yang dipilih {#the-data-cache-reuses-opted-in-server-reads}

Saat Cache Components tidak aktif, gunakan `cache: 'force-cache'` untuk menyimpan hasil `fetch` server. Atur interval revalidasi dengan `next.revalidate` dan beri tag lewat `next.tags` agar hasil bisa diinvalidasi setelah mutasi. Untuk query database atau panggilan SDK, gunakan `unstable_cache` jika hasil perlu dipakai antar-request. [Panduan model caching sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components)

Key `unstable_cache` mencakup fungsi dan argumennya. `keyParts` menambahkan identitas lain, misalnya nilai dari closure. Tag hanya mengelompokkan entri untuk invalidasi, bukan membedakan isi cache. Data Cache ini bisa bertahan lintas deployment jika penyimpanannya mendukung. [Referensi unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

Secara default, `fetch` server tidak masuk Data Cache. Namun, route yang bisa di-prerender mungkin tetap mengambil data saat build lalu memakai ulang hasil render-nya. Tidak memakai cache data belum tentu berarti halaman dirender ulang pada setiap kunjungan. Dalam model ini, `cache: 'no-store'` secara eksplisit mengambil data pada setiap request. [Perilaku default fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#optionscache)

### Full Route Cache menyimpan hasil render halaman {#the-full-route-cache-reuses-the-rendered-page}

Route statis memakai ulang output yang sudah dibuat. Ada yang dibuat saat build, ada yang baru dibuat saat pertama kali dikunjungi. Incremental Static Regeneration (ISR) membuat ulang output ketika sudah stale. Prosesnya tetap dipicu request; lewatnya interval revalidasi tidak otomatis menjalankan background job. [Panduan ISR Next.js](https://nextjs.org/docs/app/guides/incremental-static-regeneration)

API seperti `cookies()` dan `headers()` membuat route bergantung pada request yang masuk. Dalam model sebelumnya, pemakaian API ini membuat route dirender secara dinamis. Query tertentu masih bisa memakai cache sesuai konfigurasinya. `dynamic = 'force-dynamic'` lebih luas: seluruh route dirender saat request dan fetch-nya tidak di-cache. [Pengaturan route pada model sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components#route-segment-config)

Jika data yang dipakai route prerender direvalidasi, output yang terpengaruh juga perlu dibuat ulang. Build aplikasi mengganti output route hasil generasi. Saat menyiapkan deployment, bedakan output ini dari cache data yang mungkin tetap tersimpan. [Self-hosting dan caching Next.js](https://nextjs.org/docs/app/guides/self-hosting#caching-and-isr)

## Dengan Cache Components, pilih bagian yang perlu di-cache {#cache-components-gives-reusable-work-its-own-boundary}

Aktifkan Cache Components di konfigurasi aplikasi Next.js:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

Letakkan `'use cache'` di fungsi async untuk menyimpan data hasilnya, atau di komponen async untuk menyimpan output render. Pilih bagian terkecil yang seluruh hasilnya boleh mengikuti aturan kesegaran yang sama. Cache key mencakup argumen yang diserialisasi, nilai dari closure, serta identitas fungsi dan build. [Referensi use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)

Next.js bisa melakukan prerender konten statis dan hasil cache yang memenuhi syarat menjadi kerangka halaman. Bagian yang membutuhkan request masuk bisa menyusul lewat streaming di dalam `Suspense`. Suspense menyediakan tampilan loading; membungkus konten sinkron tidak otomatis membuatnya dinamis. [Prerendering Next.js](https://nextjs.org/docs/app/getting-started/caching#prerendering)

### Tentukan masa berlaku dan tag cache {#give-the-cached-result-a-lifetime-and-a-tag}

`cacheLife` mengatur kapan hasil perlu diperbarui. Ketiga nilainya memakai satuan detik:

| Properti | Fungsinya |
| --- | --- |
| `stale` | Batas waktu router klien boleh memakai ulang hasil sebelum memeriksa server. |
| `revalidate` | Usia cache saat server boleh mengembalikan hasil lama sambil memperbaruinya di latar belakang. |
| `expire` | Usia cache saat request harus menunggu hasil baru. Nilainya harus lebih besar dari `revalidate`. |

Misalnya, `cacheLife({ stale: 30, revalidate: 60, expire: 300 })` mengizinkan pemakaian ulang di klien selama 30 detik. Setelah 60 detik, request bisa memicu pembaruan server di latar belakang. Setelah lima menit tanpa regenerasi, request harus menunggu hasil baru. Sesuaikan angka ini dengan usia data yang masih bisa diterima; ini bukan jadwal polling tab yang terbuka. Untuk kedaluwarsa berbasis waktu, router klien menerapkan batas minimum 30 detik. [Referensi cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)

Gunakan `cacheTag` untuk memberi label pada entri yang perlu diinvalidasi bersama. Contohnya, `orders:account-123` mengelompokkan query pesanan untuk satu akun. Argumen membedakan entri cache; tag membantu memilih entri yang akan diinvalidasi. [Referensi cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)

### Sesuaikan penyimpanan cache dengan deployment {#match-the-storage-to-the-deployment}

Secara default, `'use cache'` biasa menyimpan entri runtime di memori. Hasil hanya bisa dipakai antar-request selama instance mempertahankan memori itu. Pada serverless, belum tentu instance-nya tetap ada. Prerender saat build tetap bisa mendapat manfaat dari hasil cache. [Pertimbangan cache saat runtime](https://nextjs.org/docs/app/api-reference/directives/use-cache#runtime-caching-considerations)

Kalau hasil perlu dibagikan antar-instance, `'use cache: remote'` bisa memakai remote handler yang sudah dikonfigurasi. Ada tambahan request jaringan dan biaya penyimpanan, jadi hitung apakah cache hit memang menghemat pekerjaan. Entri juga tetap mengikuti identitas build atau deployment. [Referensi remote caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)

Untuk hasil yang bergantung pada request dan hanya perlu disimpan di browser, lihat [contoh private caching](#use-private-caching-for-request-dependent-ui).

## Periksa akses sebelum mengambil hasil dari cache bersama {#keep-protected-checks-outside-shared-cached-results}

Saat cache hit, isi fungsi cache tidak dijalankan. Kalau pemeriksaan otorisasi hanya ada di dalam fungsi tersebut, pemeriksaannya ikut terlewat. Karena itu, operasi publik harus memastikan akses pengguna sebelum memanggil fungsi cache.

Untuk daftar pesanan yang boleh sedikit tertinggal, query bisa menentukan akun lebih dulu lalu memanggil helper cache privat:

```ts
// src/features/orders/order.queries.ts
import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { requireAccount } from '@/features/membership/membership.queries'
import { database } from '@/platform/database/client'
import { orderSummarySchema } from './model/order.schema'

export async function listOrders() {
  const account = await requireAccount()
  return listCachedOrdersForAccount(account.id)
}

async function listCachedOrdersForAccount(accountId: string) {
  'use cache'
  cacheLife({ stale: 30, revalidate: 60, expire: 300 })
  cacheTag(`orders:${accountId}`)

  const rows = await database.order.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  return rows.map((row) => orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  }))
}
```

Ini versi dengan cache dari [query daftar pesanan yang dilindungi](./protected-resources#make-a-protected-read-establish-its-caller), memakai schema dan klien database yang sama. Contoh mengasumsikan semua pengguna yang boleh mengakses akun bisa melihat daftar yang sama. Jika izin pengguna dalam satu akun berbeda, periksa izin itu sebelum mengakses cache dan bedakan setiap lingkup data lewat input helper. Kalau belum bisa memastikan pemisahan tersebut, jangan cache query-nya.

Helper tetap tidak diekspor. Fitur lain memanggil `listOrders()` agar pemeriksaan akses selalu ikut berjalan. Next.js juga mencontohkan verifikasi identitas dalam operasi publik sebelum ID diteruskan ke fungsi cache privat. Gunakan ID stabil untuk key dan tag; jangan masukkan token sesi atau rahasia lain. [Autentikasi dengan Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data)

`'use cache'` biasa tidak boleh membaca `cookies()` atau `headers()`, termasuk lewat query membership yang dipanggil di dalamnya. Ambil informasi request sebelum masuk ke fungsi cache. ID akun yang sudah diverifikasi boleh diteruskan sebagai argumen. Namun, karena akun ini bergantung pada request pengguna, hasil personal tersebut tidak bisa menjadi bagian dari kerangka statis bersama. [API runtime dan caching](https://nextjs.org/docs/app/getting-started/caching#passing-runtime-values-to-cached-functions)

Bungkus komponen yang menjalankan query ini dengan Suspense agar halaman bisa tampil sambil menunggu pemeriksaan akun:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { Suspense } from 'react'
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default function OrdersPage() {
  return (
    <>
      <h1>Orders</h1>
      <Suspense fallback={<p>Loading orders…</p>}>
        <Orders />
      </Suspense>
    </>
  )
}

async function Orders() {
  const orders = await listOrders()
  return <OrderList orders={orders} />
}
```

Judul halaman bisa muncul lebih dulu, sementara pemeriksaan akun dan query pesanan masih berjalan. Untuk pembatalan atau mutasi lain, tetap periksa data terbaru di dalam [use case](./protected-resources#authorize-mutations-against-the-current-resource). Data cache cukup untuk tampilan, tetapi tidak membuktikan bahwa perubahan masih boleh dilakukan.

### Gabungkan kedua cache jika beberapa komponen meminta daftar yang sama {#combine-the-caches-when-the-list-has-repeated-render-callers}

Kalau dua Server Component memanggil `listOrders()` dalam satu render, tambahkan memoization pada query publik dan pertahankan `'use cache'` di helper privat. Ganti fungsi ekspor sebelumnya dengan:

```ts
import { cache } from 'react'

export const listOrders = cache(async () => {
  const account = await requireAccount()
  return listCachedOrdersForAccount(account.id)
})
```

Cache luar menyimpan hasil pemeriksaan akun dan daftar selama satu render. Pada request berikutnya, akses diperiksa lagi sebelum cache dalam dibaca. Otorisasi tetap berada di luar fungsi yang memakai ulang hasil antar-request. Next.js menunjukkan [memoization otorisasi saat rendering](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal) dan [pemeriksaan akses sebelum cache bersama](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data).

Contoh native yang bisa dijalankan memakai `listOrders(requestHeaders)`. Jika signature ini dibungkus `cache()`, kedua komponen harus memberikan instance `Headers` yang sama agar hasilnya dipakai bersama. Tanpa wrapper luar, setiap panggilan tetap memeriksa membership meskipun daftar di cache dalam masih tersedia. Tambahkan wrapper hanya saat pemanggilan berulang membutuhkan penghematan itu. Aturan masa berlaku dan invalidasi helper tetap sama.

## Gunakan private caching untuk UI yang membutuhkan data request {#use-private-caching-for-request-dependent-ui}

`'use cache: private'` membolehkan `headers()` dan `cookies()` di dalam fungsinya. Fungsi tetap berjalan pada setiap render server; hasil hanya dipakai ulang di memori browser dan hilang saat reload. Aktifkan `cacheComponents: true` seperti contoh sebelumnya. [Referensi private caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

Sebagai alternatif cache bersama, panggil [`listOrders()` yang dilindungi tanpa cache](./protected-resources#make-a-protected-read-establish-its-caller) dari komponen privat:

```tsx
// src/app/(authenticated)/orders/page.tsx
import { Suspense } from 'react'
import { cacheLife } from 'next/cache'
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading orders…</p>}>
      <PrivateOrders />
    </Suspense>
  )
}

async function PrivateOrders() {
  'use cache: private'
  cacheLife({ stale: 30 })

  const orders = await listOrders()
  return <OrderList orders={orders} />
}
```

Query tetap menentukan akun dan membatasi data yang diambil. Query membership boleh mengakses header request dalam fungsi private cache ini. Stale time 30 detik pada contoh mengizinkan pemakaian ulang di browser, tetapi tidak mengurangi query database pada render server baru.

Pakai pendekatan ini kalau hasil boleh digunakan ulang di browser dan kode yang membutuhkan request memang lebih mudah dipahami dalam satu tempat. Mutasi tetap memeriksa data terkini. Setelah mutasi atau pergantian akun, perbarui UI yang terpengaruh.

## Invalidasi cache setelah perubahan berhasil disimpan {#invalidate-the-affected-result-after-a-successful-write}

Pilih cara invalidasi berdasarkan apa yang harus dilihat pengguna setelahnya:

| Operasi | Tempat pemakaian | Dampaknya |
| --- | --- | --- |
| `updateTag(tag)` | Hanya Server Action | Membuat entri dengan tag tersebut kedaluwarsa. Query berikutnya menunggu data baru. |
| `revalidateTag(tag, 'max')` | Server Action atau Route Handler | Menandai entri sebagai stale. Query berikutnya boleh menerima hasil lama sambil cache diperbarui. |
| `revalidateTag(tag, { expire: 0 })` | Server Action atau Route Handler | Membuat entri kedaluwarsa agar query berikutnya menunggu data baru. Bisa dipakai di luar action. |
| `revalidatePath(path)` | Server Action atau Route Handler | Merevalidasi path halaman atau layout. Jika dipanggil dari handler, revalidasi dilakukan saat kunjungan berikutnya. |
| `router.refresh()` | Client Component | Meminta render server baru untuk route saat ini. Cache data server tidak ikut dihapus. |

Gunakan `updateTag` ketika hasil mutasi pengguna harus langsung terlihat pada query berikutnya dari Server Action. Untuk webhook, gunakan `revalidateTag` dengan profil yang sesuai. Revalidasi dipicu query berikutnya. Bentuk lama `revalidateTag(tag)` dengan satu argumen sudah deprecated. [Referensi updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [referensi revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

Invalidasi path berlaku untuk output route dan data yang dipakainya. Data dengan satu tag bisa dipakai banyak route, jadi menginvalidasi satu path tidak menggantikan invalidasi tag data bersama. [Referensi revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)

Untuk daftar pesanan tadi, tambahkan langkah berikut setelah use case berhasil:

```ts
// src/features/orders/order.actions.ts
'use server'

import { refresh, updateTag } from 'next/cache'
import { requireAccount } from '@/features/membership/membership.queries'
import { cancelOrderInputSchema } from './model/order.schema'
import { cancelOrderUseCase } from './cancel-order.use-case'

export async function cancelOrder(formData: FormData) {
  const input = cancelOrderInputSchema.parse({
    orderId: formData.get('orderId'),
  })
  const account = await requireAccount()

  await cancelOrderUseCase(input)

  updateTag(`orders:${account.id}`)
  refresh()
}
```

Use case tetap memverifikasi pengguna dan aturan pembatalan sendiri. Action membaca akun untuk memilih tag yang perlu diinvalidasi. `updateTag` membuat cache daftar kedaluwarsa, lalu `refresh()` meminta Next.js memperbarui router klien dari Server Action. [Referensi refresh Server Action](https://nextjs.org/docs/app/api-reference/functions/refresh)

Refresh route tetap menjadi tugas adapter. Semua jalur yang mengubah data yang sama harus menginvalidasi cache terkait, termasuk prosedur RPC, Route Handler, dan event eksternal. Prosedur RPC lewat HTTP tidak bisa memakai API khusus Server Action hanya karena kodenya berjalan di server; gunakan `revalidateTag`. Kalau beberapa jalur mutasi memakai kebijakan invalidasi yang sama, satukan kebijakan itu dalam modul server fitur.

Contoh ini hanya menyimpan daftar pesanan dalam cache. Kalau detail atau total pesanan juga di-cache, beri tag yang sesuai dan invalidasi setelah perubahan yang memengaruhinya.

## Bedakan cache navigasi dari cache query browser {#treat-browser-navigation-and-query-freshness-separately}

### Router Cache menyimpan payload route {#the-router-cache-reuses-route-payloads}

Next.js menyimpan payload RSC dari kunjungan dan prefetch di memori browser. Saat navigasi, layout bersama dan UI loading bisa dipakai ulang. Aturan untuk navigasi biasa, prefetch, dan tombol back/forward berbeda. Jangan menganggap semua halaman akan selalu di-cache sampai reload. [Glosarium Client Cache Next.js](https://nextjs.org/docs/app/glossary#client-cache)

Tanpa Cache Components, stale time default halaman dinamis adalah nol. Halaman statis atau yang sepenuhnya di-prefetch punya aturan berbeda. Layout bersama dan navigasi back/forward masih bisa memakai ulang hasil sebelumnya. Dengan Cache Components, `cacheLife.stale` ikut mengatur kesegaran di klien. [Konfigurasi stale time klien](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes), [perilaku klien cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife#client-cache-behavior)

`router.refresh()` menghapus cache klien route saat ini dan meminta payload RSC baru. Namun, jika query server masih mengambil hasil dari cache data lama, browser akan menerima nilai lama itu lagi. [Referensi useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)

Invalidasi dari webhook juga tidak otomatis memperbarui semua tab yang terbuka. Browser baru tahu ada perubahan setelah membuat request lagi, melakukan navigasi atau polling, atau menerima pembaruan dari subscription aplikasi.

### TanStack Query menyimpan salinan data sendiri {#tanstack-query-owns-another-copy-of-the-data}

TanStack Query menyimpan hasil berdasarkan query key. `staleTime` menentukan berapa lama data dianggap fresh, sedangkan `gcTime` menentukan berapa lama query yang tidak aktif disimpan sebelum dibuang. Status stale membuat query bisa di-refetch saat ada pemicunya; status itu bukan jadwal polling. [Perilaku default TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

Setelah mutasi, `queryClient.invalidateQueries()` menandai query yang cocok sebagai stale dan biasanya mengambil ulang query aktif. Cache server di balik request tidak ikut diinvalidasi. Jadi, jika server masih mengembalikan data cache lama, query klien juga mendapat data lama lagi. [Invalidasi query TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

Jika mutasi memengaruhi UI server dan query klien, perbarui keduanya sesuai alur berikut:

```text
Mutasi → use case terlindungi → penulisan database berhasil di-commit
       → invalidasi entri server yang terpengaruh
       → kembalikan hasil berhasil ke browser
       → invalidasi atau perbarui query TanStack yang terpengaruh
       → segarkan route jika Server Component-nya juga menampilkan data yang berubah
```

[Panduan pengambilan data](./data-fetching-and-mutation#cancel-the-order-and-invalidate-affected-reads) menunjukkan invalidasi query dengan oRPC. Transport menyediakan cara memanggil operasi. Fitur tetap harus menentukan tag server dan query key klien yang terkena dampaknya.

Di server, buat `QueryClient` untuk setiap request. Lakukan hydration pada bagian browser yang membutuhkan state query berkelanjutan. Refetch query klien tidak memperbarui angka total yang dirender terpisah oleh Server Component. Tentukan satu sumber untuk tiap nilai yang ditampilkan, atau perbarui kedua versi secara eksplisit. [Rendering server dan kepemilikan data TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

## Uji cache lewat alur request aplikasi {#check-caching-through-the-application-s-real-request-paths}

Periksa perilaku cache pada build produksi aplikasi Next.js yang memakainya. Saat development, cache fetch lintas hot reload dan header dari hard refresh browser bisa membuat hasil pengamatan berbeda. [Pemecahan masalah fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#troubleshooting)

Untuk fitur yang memakai cache, coba skenario berikut:

- Panggil query yang sama beberapa kali dalam satu render, lalu pada request baru. Lihat pekerjaan mana yang dijalankan lagi.
- Ubah data lewat setiap jalur mutasi yang didukung. Pastikan daftar, detail, dan total yang terpengaruh ikut berubah.
- Akses sebagai dua akun dan pastikan datanya tidak tertukar. Ulangi setelah mengubah izin.
- Pindah halaman lalu kembali, refresh route, dan refetch query klien. Periksa nilai yang tampil pada setiap langkah.
- Jalankan pada susunan deployment yang akan dipakai, termasuk beberapa instance jika ada. Pastikan cache hit dan invalidasi mengenai penyimpanan yang benar.

Catat batas usia data dan pemicu invalidasi di dekat query fitur. Saat ada mutasi baru yang mengubah data yang sama, aturan cache yang perlu diikuti harus mudah ditemukan.
