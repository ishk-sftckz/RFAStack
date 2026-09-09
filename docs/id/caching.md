---
title: Caching
description: Pahami masa berlaku cache Next.js, pilih batas caching fitur, dan segarkan data server serta browser setelah penulisan.
---

# Caching

Caching termasuk bagian yang sulit saat membangun aplikasi Next.js. Satu layar dapat bergantung pada beberapa cache, masing-masing dengan aturan rendering, navigasi, dan mutasi yang berbeda. Tantangannya adalah memahami interaksi aturan tersebut agar Anda bisa menentukan tempat caching dalam aplikasi.

Dokumentasi Next.js bisa sulit diikuti saat Anda mencoba menghubungkan bagian-bagian itu. Halaman ini menjelaskan mekanismenya secara berurutan, lalu menunjukkan cara memilih batas cache dan menangani invalidasi di seluruh fitur. Anda seharusnya bisa memperoleh manfaat performa caching Next.js sekaligus menjelaskan alasan perilaku implementasi Anda.

## Kenali model caching proyek Anda {#know-which-caching-model-your-project-uses}

Next.js mendokumentasikan [Cache Components](https://nextjs.org/docs/app/getting-started/caching) dan [model caching sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components) secara terpisah. Periksa `next.config.ts` sebelum menerapkan contoh caching:

| Konfigurasi | Cara menyatakan caching |
| --- | --- |
| Cache Components dinonaktifkan | Gunakan opsi cache `fetch`, `unstable_cache` untuk pembacaan server lainnya, dan kontrol rendering route dari model sebelumnya. |
| `cacheComponents: true` | Gunakan `'use cache'` pada fungsi atau komponen async, tetapkan masa berlaku, lalu gabungkan konten yang di-cache dengan pekerjaan yang berjalan saat request. |

Cache Components mengubah rendering sekaligus caching. Mengaktifkannya membutuhkan peninjauan konfigurasi route yang ada dan tempat pekerjaan yang bergantung pada request berjalan. Runtime yang dibutuhkan adalah Node.js. Ikuti [panduan migrasi](https://nextjs.org/docs/app/guides/migrating-to-cache-components) saat mengubah aplikasi yang sudah ada.

Memoization request React dan TanStack Query juga memiliki masa berlaku sendiri. Memilih model caching Next.js tidak menjadikan semua cache aplikasi satu tempat penyimpanan.

## Kenali hasil yang digunakan ulang {#identify-what-is-being-reused}

| Mekanisme | Hasil yang disimpan | Batas penggunaan ulang |
| --- | --- | --- |
| Memoization request | Pembacaan server atau hasil fungsi yang berulang | Satu konteks render/request server React. |
| Data Cache, pada model sebelumnya | Response `fetch` atau hasil `unstable_cache` yang diaktifkan caching-nya | Antar-request server, mengikuti revalidasi dan penyimpanan yang dikonfigurasi. |
| Full Route Cache, pada model sebelumnya | HTML dan payload React Server Component hasil prerender | Antar-request untuk route yang dirender statis. |
| Client Router Cache | Payload route dari navigasi dan prefetch | Sesi browser saat ini, mengikuti aturan navigasi dan kesegaran data. |
| Cache Components | Output fungsi atau komponen async bertanda `'use cache'` | Lingkup cache dengan masa berlaku eksplisit; penyimpanan runtime bergantung pada cache handler. |
| TanStack Query | Hasil yang diindeks berdasarkan query key aplikasi | `QueryClient` pemiliknya, biasanya di browser setelah hydration. |

Payload React Server Component, atau payload RSC, mendeskripsikan hasil komponen yang dirender di server dan digunakan Next.js untuk menyusun serta memperbarui UI. Hasil query yang di-cache dan payload route yang di-cache dapat mewakili pesanan yang sama pada waktu berbeda. Bagian berikut menjelaskan operasi yang menyegarkan masing-masing hasil.

## Gunakan ulang pembacaan berulang dalam satu render server {#reuse-repeated-reads-within-a-server-render}

Aktifkan caching sesuai kebutuhan. Tambahkan `cache()` React ketika beberapa Server Component membutuhkan pembacaan yang sama dalam satu render. Pilih `'use cache'` secara terpisah ketika hasil dapat digunakan ulang antar-request dan Anda sudah menetapkan usia data yang dapat diterima serta aturan invalidasinya.

| Keputusan | React cache() | Next.js 'use cache' |
| --- | --- | --- |
| Pekerjaan apa yang perlu digunakan ulang? | Panggilan berulang dengan argumen yang sama dalam satu render server. | Data fungsi atau output komponen antar-request, jika penyimpanan cache memungkinkan. |
| Apa yang terjadi pada request server baru? | Fungsi berjalan lagi saat dipanggil. | Hasil cache yang masih valid dapat digunakan ulang. |
| Apa yang mengendalikan kesegaran data? | Batas request. | `cacheLife` dan invalidasi setelah perubahan. |

Keduanya mekanisme terpisah. React menjelaskan [memoization request](https://react.dev/reference/react/cache); Next.js menjelaskan [lingkup cache dan penyimpanan](https://nextjs.org/docs/app/api-reference/directives/use-cache).

Pada contoh native, `OrderDetails` dan `OrderTotal` sama-sama memanggil `getOrder(orderId)`. Keduanya berbagi satu pembacaan pesanan selama render. `listCachedOrders(scopeId)` menggunakan `'use cache'` karena halaman akun menerima daftar yang sedikit tertinggal, dengan invalidasi setelah penulisan. Mengembalikan satu pesanan atau koleksi tidak menentukan cache yang dipilih.

Untuk pembacaan komponen yang berulang, ekspor satu query dengan memoization yang digunakan bersama:

```ts
// src/features/orders/order.queries.ts
import { cache } from 'react'

export const getOrderDetailsForRender = cache(
  (accountId: string, orderId: string) =>
    getOrderDetails({ accountId, orderId }),
)
```

Tambahkan ini di samping query terlindungi `getOrderDetails` dari [panduan pengambilan data](./data-fetching-and-mutation#fetch-where-a-server-component-needs-the-data). Setiap pemanggil mengimpor fungsi ekspor yang sama. ID akun dan pesanan berupa nilai primitif memungkinkan panggilan yang setara cocok tanpa berbagi objek input.

Panggilan berulang menggunakan hasil pertama meskipun database berubah selama render. Error juga digunakan ulang: jika `getOrder('123')` gagal, panggilan yang sama melempar ulang error tersebut tanpa mencoba lagi. Argumen objek dicocokkan berdasarkan identitas: dua objek baru `{ orderId: '123' }` tidak cocok dalam cache. React menghapus entri ini antar-request; panggilan Route Handler biasa berada di luar konteks cache-nya. [Referensi cache React](https://react.dev/reference/react/cache)

Caching menambah pekerjaan penyimpanan dan pencarian. Pembacaan yang hanya dipanggil sekali tidak mendapat manfaat deduplikasi, jadi hindari membungkus setiap query secara bawaan. Jaga mutasi dan pembacaan yang harus dieksekusi ulang di luar jalur memoization ini.

Request `fetch` GET yang sama mendapat memoization otomatis selama rendering server. Ini terpisah dari penyimpanan antar-request. Memberikan signal `AbortController` menonaktifkan memoization otomatis tersebut; Route Handler berada di luar pohon komponen React. [Memoization fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#memoization)

Gunakan mekanisme ini ketika masalahnya adalah pekerjaan berulang dalam satu render. Mekanisme ini tidak membutuhkan tag untuk invalidasi pada request berikutnya.

Setelah pembacaan berulang membenarkan memoization, tentukan tempat wrapper-nya. Wrapper render terpisah berguna jika operasi dasarnya juga memiliki pemanggil yang memberikan konteks request sendiri. Jika hanya melayani rendering, bungkus query langsung. `getOrder(orderId)` dengan memoization pada contoh native memberikan header saat ini kepada pembacaan privat yang dilindungi `withMembership`. Kedua komponen mengimpor fungsi `getOrder` yang sama, sehingga berbagi pemeriksaan membership dan hasil pesanan selama render.

## Pahami cache data dan route tanpa Cache Components {#understand-data-and-route-caching-without-cache-components}

### Data Cache menggunakan ulang pembacaan server yang dipilih {#the-data-cache-reuses-opted-in-server-reads}

Saat Cache Components dinonaktifkan, `fetch` server dapat mengaktifkan caching melalui `cache: 'force-cache'`. `next.revalidate` menetapkan interval revalidasi, dan `next.tags` memberi label hasil untuk invalidasi setelah penulisan. Untuk query database atau panggilan SDK, `unstable_cache` menyediakan caching antar-request. [Panduan caching model sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components)

Key `unstable_cache` mencakup fungsi dan argumennya; `keyParts` menambahkan identitas, misalnya nilai yang ditangkap closure. Tag mengelompokkan entri untuk invalidasi dan tidak membedakan isinya. Data Cache-nya dapat bertahan lintas deployment, bergantung pada penyimpanan dasarnya. [Referensi unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

Secara bawaan, `fetch` server tidak disimpan dalam Data Cache. Namun, route yang dapat di-prerender masih bisa membaca data saat build dan menggunakan ulang output render. Request data tanpa cache dan render halaman baru pada setiap kunjungan adalah keputusan terpisah. Request dengan `cache: 'no-store'` secara eksplisit mengambil data pada setiap request dalam model ini. [Perilaku bawaan fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#optionscache)

### Full Route Cache menggunakan ulang halaman hasil render {#the-full-route-cache-reuses-the-rendered-page}

Route yang dirender statis menggunakan ulang output yang dihasilkan. Sebagian route dibuat saat build; yang lain dapat dibuat pada kunjungan pertama. Incremental Static Regeneration, atau ISR, membuat ulang output setelah menjadi stale. Proses ini dipicu request: tercapainya interval revalidasi tidak otomatis menjadwalkan background job. [Panduan ISR Next.js](https://nextjs.org/docs/app/guides/incremental-static-regeneration)

API saat request seperti `cookies()` atau `headers()` membuat route bergantung pada request masuk. Dalam model sebelumnya, hal itu mengaktifkan rendering dinamis untuk route. Pembacaan individual tetap bisa di-cache jika konfigurasinya mengizinkan. `dynamic = 'force-dynamic'` melangkah lebih jauh dengan memaksa rendering saat request dan fetch tanpa cache di seluruh route. [Kontrol route model sebelumnya](https://nextjs.org/docs/app/guides/caching-without-cache-components#route-segment-config)

Revalidasi data yang digunakan route hasil prerender juga membutuhkan pembuatan ulang output yang terpengaruh. Build ulang aplikasi mengganti output route yang dihasilkan. Bedakan output tersebut dari penyimpanan data persisten saat merencanakan deployment. [Self-hosting dan caching Next.js](https://nextjs.org/docs/app/guides/self-hosting#caching-and-isr)

## Cache Components memberi batas sendiri pada pekerjaan yang dapat digunakan ulang {#cache-components-gives-reusable-work-its-own-boundary}

Aktifkan Cache Components dalam konfigurasi aplikasi Next.js:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

Gunakan `'use cache'` di dalam fungsi async untuk menyimpan data yang dikembalikan, atau di dalam komponen async untuk menyimpan output-nya. Tempatkan directive pada lingkup terkecil yang seluruh hasilnya dapat mengikuti kebijakan kesegaran yang sama. Cache key mencakup argumen terserialisasi, nilai yang ditangkap, serta identitas fungsi dan build. [Referensi use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)

Next.js dapat melakukan prerender konten statis dan pekerjaan cache yang memenuhi syarat menjadi kerangka halaman. Pekerjaan yang bergantung pada request dapat di-stream ke kerangka itu di balik `Suspense`. Batas tersebut menyediakan UI loading; membungkus konten sinkron dengan `Suspense` tidak membuat konten itu dinamis. [Prerendering Next.js](https://nextjs.org/docs/app/getting-started/caching#prerendering)

### Beri hasil cache masa berlaku dan tag {#give-the-cached-result-a-lifetime-and-a-tag}

`cacheLife` mengendalikan kapan hasil perlu disegarkan. Ketiga propertinya menggunakan satuan detik:

| Properti | Makna |
| --- | --- |
| `stale` | Berapa lama router klien dapat menggunakan ulang hasil sebelum memeriksa server. |
| `revalidate` | Usia setelahnya request server dapat menerima hasil cache sementara penyegaran berjalan di latar belakang. |
| `expire` | Usia setelahnya request server harus menunggu hasil baru. Harus lebih besar dari `revalidate`. |

Contohnya, `cacheLife({ stale: 30, revalidate: 60, expire: 300 })` mengizinkan penggunaan ulang di klien selama 30 detik, penyegaran server di latar belakang setelah 60 detik, dan penyegaran yang ditunggu setelah lima menit tanpa regenerasi. Nilai ini hanya contoh; pilih berdasarkan usia hasil yang dapat diterima. Nilai tersebut tidak melakukan polling pada tab terbuka. Router klien menerapkan jendela minimum 30 detik untuk kedaluwarsa berbasis waktu. [Referensi cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)

`cacheTag` memberi label pada entri terkait agar penulisan dapat membatalkan validitasnya bersama. Tag seperti `orders:account-123` dapat mengelompokkan pembacaan pesanan akun itu. Argumen membedakan entri cache; tag mengidentifikasi kelompok untuk invalidasi. [Referensi cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag)

### Sesuaikan penyimpanan dengan deployment {#match-the-storage-to-the-deployment}

Secara bawaan, `'use cache'` biasa menggunakan memori untuk entri runtime. Penggunaan ulang antar-request bergantung pada instance yang mempertahankan memori itu; instance serverless mungkin tidak melakukannya. Prerendering saat build tetap mendapat manfaat dari pekerjaan yang di-cache. [Pertimbangan caching runtime](https://nextjs.org/docs/app/api-reference/directives/use-cache#runtime-caching-considerations)

`'use cache: remote'` menggunakan remote handler yang dikonfigurasi ketika hasil runtime membutuhkan penyimpanan bersama antar-instance. Ini menambah request jaringan cache dan biaya penyimpanan, jadi nilai apakah cache hit menghemat pekerjaan yang cukup. Entrinya tetap dibatasi oleh identitas build atau deployment. [Referensi remote caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote)

Untuk konten yang bergantung pada request dan hanya boleh digunakan ulang di memori browser, lihat [contoh private caching](#use-private-caching-for-request-dependent-ui) di bawah.

## Tempatkan pemeriksaan akses di luar hasil cache bersama {#keep-protected-checks-outside-shared-cached-results}

Cache hit melewati isi fungsi yang di-cache. Jika otorisasi hanya terjadi di dalam fungsi itu, cache hit juga melewati pemeriksaannya. Operasi publik yang dilindungi harus memastikan pemanggil sebelum mencapai data cache.

Untuk daftar pesanan yang tampilannya dapat menerima data sedikit tertinggal, query terlindungi dapat menentukan akun dan memanggil fungsi bantu cache privat:

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

Ini adalah varian caching dari [daftar pesanan terlindungi](./protected-resources#make-a-protected-read-establish-its-caller), menggunakan schema dan klien database yang sama. Contoh ini mengasumsikan semua pemanggil yang diizinkan untuk satu akun boleh menerima daftar yang sama. Jika izin berbeda dalam satu akun, tetapkan izin tersebut di luar fungsi bantu cache dan bedakan setiap lingkup visibilitas melalui input-nya, atau biarkan pembacaan tanpa cache.

Jangan ekspor fungsi bantu tersebut. Fitur lain memanggil `listOrders()` dan mendapat pemeriksaan aksesnya. Next.js mendokumentasikan pola penentuan identitas dalam operasi yang diekspor sebelum meneruskan ID ke fungsi cache privat. Gunakan ID stabil dalam key dan tag; jangan sertakan token sesi atau rahasia lain. [Autentikasi dengan Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data)

`'use cache'` biasa tidak dapat membaca `cookies()` atau `headers()`, termasuk melalui query membership bersarang. Baca informasi request di luar lingkupnya. Meneruskan ID akun terverifikasi ke fungsi bantu memungkinkan caching untuk ID itu, meskipun ketergantungan pada request saat ini mencegah hasil personal ini menjadi bagian dari kerangka statis bersama. [API runtime dan caching](https://nextjs.org/docs/app/getting-started/caching#passing-runtime-values-to-cached-functions)

Render pembacaan terlindungi di bawah batas yang dapat menunggu akun:

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

Judul dapat dirender sebelum pencarian akun dan daftar pesanan selesai. Pemeriksaan kelayakan pembatalan dan mutasi lainnya harus menggunakan data tersimpan terkini dalam [use case](./protected-resources#authorize-mutations-against-the-current-resource). Daftar yang di-cache menyediakan data tampilan; daftar itu tidak dapat memastikan apakah penulisan masih diizinkan.

### Gabungkan cache ketika daftar dipanggil berulang selama render {#combine-the-caches-when-the-list-has-repeated-render-callers}

Jika dua Server Component membutuhkan `listOrders()` dalam satu render, tambahkan memoization pada query publik sambil mempertahankan directive `'use cache'` fungsi bantu privat. Ganti fungsi ekspor di atas dengan:

```ts
import { cache } from 'react'

export const listOrders = cache(async () => {
  const account = await requireAccount()
  return listCachedOrdersForAccount(account.id)
})
```

Cache luar membagikan pemeriksaan akun dan hasil daftar selama render itu. Pada request berikutnya, query memeriksa akses lagi sebelum menggunakan cache dalam. Jaga otorisasi di luar fungsi bantu yang menggunakan ulang data antar-request. Next.js menunjukkan [memoization otorisasi selama rendering](https://nextjs.org/docs/app/guides/authentication#creating-a-data-access-layer-dal) dan [otorisasi sebelum pembacaan cache bersama](https://nextjs.org/docs/app/guides/authentication-with-cache-components#step-4-cache-session-derived-data).

Contoh native yang dapat dijalankan menerima `listOrders(requestHeaders)`. Jika Anda membungkus signature itu dengan `cache()`, kedua komponen harus memberikan instance `Headers` yang sama untuk berbagi hasil. Tanpa wrapper luar, setiap panggilan memeriksa membership meskipun cache daftar di dalam mengalami hit. Tambahkan wrapper ketika pemanggil berulang membutuhkan penggunaan ulang tersebut; pertahankan masa berlaku dan kebijakan invalidasi fungsi bantu yang ada.

## Gunakan private caching untuk UI yang bergantung pada request {#use-private-caching-for-request-dependent-ui}

`'use cache: private'` mengizinkan `headers()` dan `cookies()` di dalam lingkupnya. Fungsi berjalan pada setiap render server; hasil hanya digunakan ulang di memori browser dan hilang saat reload. Aktifkan `cacheComponents: true` seperti di atas. [Referensi private caching](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)

Sebagai alternatif query cache bersama di atas, gunakan [`listOrders()` terlindungi tanpa cache](./protected-resources#make-a-protected-read-establish-its-caller) di dalam komponen privat:

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

Query tetap menentukan akun dan membatasi pembacaan. Query membership-nya dapat mengakses header request dalam lingkup privat ini. Contoh stale time 30 detik mengizinkan penggunaan ulang di browser; nilainya tidak mengurangi pekerjaan database pada render server baru.

Gunakan ini ketika penggunaan ulang di browser dapat diterima dan pekerjaan yang bergantung pada request perlu berada bersama. Pemeriksaan mutasi tetap menggunakan data terkini, dan segarkan UI yang terpengaruh setelah penulisan atau pergantian akun.

## Batalkan validitas hasil yang terpengaruh setelah penulisan berhasil {#invalidate-the-affected-result-after-a-successful-write}

Pilih perilaku invalidasi berdasarkan kebutuhan pemanggil berikutnya:

| Operasi | Tempat berjalan | Hasil berikutnya |
| --- | --- | --- |
| `updateTag(tag)` | Hanya Server Action | Membuat entri bertag kedaluwarsa; pembacaan berikutnya menunggu data baru. |
| `revalidateTag(tag, 'max')` | Server Action atau Route Handler | Menandai entri bertag sebagai stale; pembacaan berikutnya dapat menyajikan data lama sambil menyegarkannya. |
| `revalidateTag(tag, { expire: 0 })` | Server Action atau Route Handler | Membuat entri kedaluwarsa sehingga pembacaan berikutnya menunggu data baru. Berguna di luar action. |
| `revalidatePath(path)` | Server Action atau Route Handler | Merevalidasi path halaman atau layout. Handler menandainya untuk kunjungan berikutnya. |
| `router.refresh()` | Client Component | Meminta render server baru untuk route saat ini; cache data server tetap utuh. |

Gunakan `updateTag` ketika pembacaan berikutnya dari Server Action harus menampilkan hasil penulisan pengguna. Webhook dapat menggunakan `revalidateTag` dengan profil sesuai kebutuhan kesegarannya. Revalidasi dipicu pembacaan berikutnya, dan bentuk satu argumen `revalidateTag(tag)` sudah deprecated. [Referensi updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [referensi revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

Invalidasi path berlaku pada output route itu dan dependensi datanya. Tag menamai data yang mungkin digunakan oleh beberapa route, jadi invalidasi satu path tidak menggantikan invalidasi data bertag bersama di seluruh tempat. [Referensi revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)

Untuk daftar pesanan yang di-cache di atas, tambahkan langkah setelah use case berhasil pada Server Action yang ada:

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

Use case tetap memastikan pemanggil dan menegakkan aturan pembatalan secara independen. Action ini membaca akun untuk memilih tag invalidasi. `updateTag` membuat daftar kedaluwarsa; `refresh()` meminta Next.js menyegarkan router klien dari Server Action. [Referensi refresh Server Action](https://nextjs.org/docs/app/api-reference/functions/refresh)

Simpan perilaku penyegaran route dalam adapter. Setiap jalur yang mengubah data yang sama juga harus membatalkan validitas entri yang terpengaruh, termasuk prosedur RPC, Route Handler, dan penanganan event eksternal. Prosedur RPC berbasis HTTP tidak dapat menggunakan API khusus action hanya karena berjalan di server. Gunakan `revalidateTag` di sana. Jika beberapa jalur mutasi berbagi kebijakan invalidasi, simpan kebijakan bersama itu dalam modul server fitur.

Contoh ini hanya melakukan caching pada daftar pesanan. Jika Anda juga melakukan caching detail atau total pesanan, beri pembacaan tersebut tag yang sesuai dan batalkan validitasnya setelah perubahan yang memengaruhinya.

## Bedakan navigasi browser dari kesegaran query {#treat-browser-navigation-and-query-freshness-separately}

### Router Cache menggunakan ulang payload route {#the-router-cache-reuses-route-payloads}

Next.js menyimpan payload RSC yang dikunjungi dan di-prefetch dalam memori browser. Layout bersama dan UI loading dapat digunakan ulang selama navigasi. Penggunaan ulang halaman berbeda antara navigasi biasa, prefetch, serta tombol mundur/maju browser; ini tidak menjamin setiap halaman tetap di-cache sampai reload. [Glosarium Client Cache Next.js](https://nextjs.org/docs/app/glossary#client-cache)

Tanpa Cache Components, stale time bawaan halaman dinamis adalah nol, sedangkan halaman statis atau yang sepenuhnya di-prefetch memiliki aturan penggunaan ulang berbeda. Penggunaan ulang layout bersama dan navigasi mundur/maju tetap berlaku. Dengan Cache Components, `cacheLife.stale` ikut mengatur kesegaran di klien. [Konfigurasi stale time klien](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes), [perilaku klien cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife#client-cache-behavior)

`router.refresh()` menghapus cache klien route saat ini dan meminta payload RSC baru. Jika pembacaan server mendapat hit pada cache data yang belum berubah, browser dapat menerima nilai lama yang sama lagi. [Referensi useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)

Invalidasi server dari webhook juga tidak mengirim UI baru ke setiap browser yang terbuka. Browser membutuhkan request lain, navigasi, polling, atau subscription aplikasi untuk mengetahui perubahan itu.

### TanStack Query memiliki salinan data lain {#tanstack-query-owns-another-copy-of-the-data}

TanStack Query mengindeks hasil berdasarkan query key. `staleTime` menjelaskan kesegaran, sedangkan `gcTime` mengendalikan berapa lama query tidak aktif bertahan sebelum garbage collection. Menjadi stale membuat query memenuhi syarat untuk pemicu refetch; hal itu tidak menjadwalkan polling. [Perilaku bawaan TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

Setelah mutasi, `queryClient.invalidateQueries()` menandai query yang cocok sebagai stale dan biasanya mengambil ulang query aktif yang cocok. Operasi itu tidak membatalkan validitas cache server di balik request. Jika request tersebut membaca data server lama, query klien yang disegarkan dapat menerimanya lagi. [Invalidasi query TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

Untuk mutasi yang memengaruhi UI hasil render server dan query klien, ikuti data melalui kedua penyimpanan:

```text
Mutasi → use case terlindungi → penulisan database berhasil di-commit
       → invalidasi entri server yang terpengaruh
       → kembalikan hasil berhasil ke browser
       → invalidasi atau perbarui query TanStack yang terpengaruh
       → segarkan route jika Server Component-nya juga menampilkan data yang berubah
```

[Panduan pengambilan data](./data-fetching-and-mutation#cancel-the-order-and-invalidate-affected-reads) menunjukkan invalidasi query dengan oRPC. Transport menyediakan operasi; fitur tetap menentukan tag server dan query key klien yang berubah.

Batasi instance `QueryClient` sisi server pada satu request, lalu lakukan hydration di browser yang membutuhkan state query berkelanjutan. Refetch query klien tidak memperbarui total yang dirender terpisah oleh Server Component. Pilih satu pemilik untuk setiap nilai yang ditampilkan, atau segarkan keduanya secara eksplisit. [Rendering server dan kepemilikan data TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

## Periksa caching melalui jalur request aplikasi yang sebenarnya {#check-caching-through-the-application-s-real-request-paths}

Validasi caching dengan build produksi aplikasi Next.js yang menggunakannya. Caching fetch saat pengembangan lintas hot reload dan header hard refresh browser dapat mengubah perilaku yang Anda amati. [Pemecahan masalah fetch Next.js](https://nextjs.org/docs/app/api-reference/functions/fetch#troubleshooting)

Untuk fitur yang di-cache, uji kasus berikut:

- Ulangi pembacaan yang sama dalam satu render, lalu dari request baru. Periksa pekerjaan yang dieksekusi lagi.
- Ubah data melalui setiap jalur mutasi yang didukung dan verifikasi daftar, detail, serta total yang terpengaruh.
- Baca sebagai dua akun dan pastikan tidak ada yang menerima data akun lain. Ulangi setelah mengubah izin.
- Navigasikan ke halaman lain lalu kembali, segarkan route, dan ambil ulang query klien. Periksa setiap nilai yang ditampilkan.
- Jalankan pada topologi deployment tujuan, termasuk beberapa instance jika berlaku. Pastikan cache hit dan invalidasi mencapai penyimpanan yang Anda harapkan.

Catat usia data yang dapat diterima dan pemicu invalidasi di dekat pembacaan fitur. Ketika mutasi baru mengubah data yang sama, penulisnya harus dapat menemukan kebijakan cache yang terpengaruh dalam fitur tersebut.
