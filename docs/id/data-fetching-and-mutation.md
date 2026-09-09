---
title: Pengambilan Data & Mutasi
description: Cara memilih jalur pembacaan, mutasi, lokasi eksekusi, dan konsumen dalam aplikasi Next.js.
---

# Pengambilan Data & Mutasi

Next.js menunjukkan cara [mengambil data](https://nextjs.org/docs/app/getting-started/fetching-data) dan [menangani mutasi](https://nextjs.org/docs/app/getting-started/mutating-data). Aplikasi nyata tetap membutuhkan strategi berbeda untuk memuat halaman, menjaga status pesanan tetap terkini, atau menerima pembatalan dari aplikasi mobile. Seiring pertumbuhan proyek, Anda membutuhkan strategi yang jelas agar keputusan itu konsisten di seluruh fitur.

## Next.js native {#next-js-native}

### Baca data saat rendering melalui Server Component {#read-during-rendering-through-a-server-component}

Server Component dapat memuat data sambil merender halaman, menggunakan `fetch`, ORM, atau klien database. Dalam fitur orders, komponen memanggil query dari `order.queries.ts`, lalu meneruskan hasil ke UI. [Panduan pengambilan data Next.js](https://nextjs.org/docs/app/getting-started/fetching-data)

Karena komponen dan query sama-sama berjalan di server, komponen dapat memanggil fungsi itu langsung. Melewati Route Handler aplikasi sendiri akan menambah request HTTP di antara keduanya. Request itu juga dapat gagal saat prerender pada waktu build, ketika server HTTP aplikasi belum berjalan. [Panduan Backend for Frontend Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

Sebelum menulis query, tentukan data yang boleh diterima UI. Untuk contoh orders ini, datanya adalah ID pesanan, status, total, dan tanggal pembuatan. Kita mendeskripsikan field tersebut dengan schema Zod agar query dapat memeriksa nilai hasil dan UI menggunakan tipe TypeScript yang sesuai. Schema berada di `model/order.schema.ts` milik fitur, bersama schema input yang sudah ada:

```ts
// src/features/orders/model/order.schema.ts
import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'shipped',
  'cancelled',
])

export const orderSummarySchema = z.object({
  id: z.string().min(1),
  status: orderStatusSchema,
  totalInCents: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
})

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderSummary = z.infer<typeof orderSummarySchema>
```

Ini memperluas file schema dari [contoh struktur folder](./folder-structure#use-zod-schemas-and-infer-their-types); pertahankan definisi `orderStatusSchema` saat menambahkan `orderSummarySchema`. Zod memeriksa nilai saat runtime dan menginferensikan tipe TypeScript yang sesuai. [Dasar Zod](https://zod.dev/basics)

Query membatasi pembacaan database pada akun dan memetakan record ke schema tersebut. Namanya `listOrders` karena mengembalikan koleksi. [Konvensi nama pembacaan](./folder-structure#name-reads-by-their-result-and-responsibility) menggunakan `get` untuk satu resource atau agregat dan `fetch` untuk fungsi bantu request HTTP/RPC.

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

```tsx
// src/app/(authenticated)/orders/page.tsx
import { listOrders } from '@/features/orders/order.queries'
import { OrderList } from '@/features/orders/ui/OrderList'

export default async function OrdersPage() {
  const orders = await listOrders()

  return <OrderList orders={orders} />
}
```

Panggilan berjalan langsung dari halaman ke fitur:

```text
Server Component → query fitur → database atau layanan eksternal
```

Halaman menangani rendering. Fitur menentukan pesanan yang dapat dilihat akun dan field yang dikembalikan. Ketika route lain membutuhkan pembacaan yang sama, route mengimpor query langsung dari `order.queries.ts`.

Hasilnya berupa data transfer object, atau DTO: field yang dibutuhkan UI dan boleh diterima pemanggil. Query memilih field secara eksplisit dan mengubah tanggal database menjadi string ISO. Contoh menggunakan klien bergaya Prisma dari `platform/database/client`.

Query ini memilih dan memetakan hasil sendiri. Ketika beberapa pembacaan berbagi pemetaan atau pemetaan membutuhkan modul terpisah agar jelas, [ekstrak mapper `toOrderSummary`](#extract-a-dto-mapper-when-reads-share-the-conversion) ke `order.dto.ts`. Field hasil harus aman bagi pemanggil pada kedua susunan. Schema Zod dan tipe hasil inferensi tetap di `model/`, agar kode browser dapat menggunakannya tanpa mengimpor mapper server.

`requireAccount` adalah operasi server publik fitur membership untuk memverifikasi sesi dan menentukan akun yang boleh digunakan pemanggil. Query memanggilnya secara internal agar setiap pemanggil menerima perlindungan yang sama. ID tervalidasi saja tidak mengotorisasi pembacaan. [Panduan perlindungan resource](./protected-resources) menjelaskan tempat pemeriksaan tersebut.

Modul query khusus server, sehingga kredensial database dan implementasinya tetap di luar bundle klien. [Referensi Server Components React](https://react.dev/reference/rsc/server-components) menjelaskan pemisahan ini. Jika query membaca layanan eksternal, parsing response dengan schema Zod sebelum mengandalkan bentuknya.

### Gunakan Server Actions untuk mutasi UI yang ditangani Next.js {#use-server-actions-for-ui-mutations-handled-by-next-js}

Formulir pembatalan dapat mengirim ke aplikasi Next.js ini, yang memeriksa apakah akun boleh membatalkan pesanan lalu memperbarui layar. Gunakan Server Action untuk jalur ini.

Di sini, “Server Action” berarti mekanisme Next.js untuk memanggil React Server Function dari action atau transition, misalnya pengiriman formulir. Gunakan `.actions.ts` khusus untuk fungsi tersebut. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data)

Input pembatalan berada dalam file schema fitur, yang sudah mengimpor Zod:

```ts
// src/features/orders/model/order.schema.ts
export const cancelOrderInputSchema = z.object({
  orderId: z.string().min(1),
})

export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>
```

Action menggunakan schema ini untuk mem-parsing kiriman formulir sebelum memanggil use case. Pemeriksaan kepemilikan, aturan kelayakan, dan update pembatalan berada dalam use case sejak implementasi pertama:

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

```tsx
// src/features/orders/ui/CancelOrderForm.tsx
import { canCancelOrder } from '../model/order-cancellation'
import type { OrderStatus } from '../model/order.schema'
import { cancelOrder } from '../order.actions'

export function CancelOrderForm({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  if (!canCancelOrder(status)) return null

  return (
    <form action={cancelOrder}>
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit">Cancel order</button>
    </form>
  )
}
```

Tampilan detail menyediakan ID pesanan dan status yang ditampilkan untuk formulir. `canCancelOrder` adalah aturan murni bersama dari [contoh model](./folder-structure#extract-business-behavior-when-it-needs-its-own-module). Menyembunyikan kontrol tidak mengotorisasi request: action mem-parsing ID yang dikirim, sedangkan `cancelOrderUseCase` memverifikasi pemanggil, memvalidasi input-nya, serta memeriksa kepemilikan dan kelayakan pembatalan terhadap pesanan tersimpan terkini. [Penelusuran pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) menunjukkan pemeriksaan itu dan update yang menolak perubahan status bersamaan.

Formulir yang dirender dalam Server Component dapat mengirim sebelum JavaScript dimuat atau ketika JavaScript dinonaktifkan. Client Component dapat mengimpor action dari file khusus `'use server'` ketika membutuhkan indikator pending, state optimistis, atau pemanggilan dari event handler. [Contoh Server Functions Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#server-components)

#### Perbarui layar setelah mutasi berhasil {#update-the-screen-after-the-mutation-succeeds}

Contoh memanggil [`refresh()`](https://nextjs.org/docs/app/api-reference/functions/refresh) setelah pembatalan berhasil. Ini menyegarkan router klien agar halaman dapat merender hasil terbaru dari query database langsung.

Jika nantinya query pesanan di-cache, menyegarkan halaman saja tidak membatalkan validitas data bertag. Action juga perlu merevalidasi data yang terpengaruh, menggunakan perilaku revalidasi yang sesuai dengan cara pembacaan di-cache. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#refresh-data)

Contoh menunjukkan pengiriman yang berhasil. Untuk kegagalan yang diperkirakan, seperti input tidak valid atau pesanan yang tidak lagi bisa dibatalkan, kembalikan hasil yang dapat ditampilkan formulir. Sesuaikan action untuk `useActionState` agar pesan dan indikator pending muncul di samping kontrol. [Panduan penanganan error Next.js](https://nextjs.org/docs/app/getting-started/error-handling#server-functions)

#### Periksa akses di dalam setiap Server Action {#check-access-inside-every-server-action}

Server Functions dapat dijangkau melalui request POST langsung. Pemanggil dapat mengirim request tanpa menggunakan formulir hasil render. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#what-are-server-functions)

Setiap action harus menegakkan pemeriksaan berikut saat dieksekusi, langsung atau melalui operasi terlindungi yang dipanggil:

1. Autentikasi pemanggil ketika operasi membutuhkan akun.
2. Otorisasi operasi terhadap resource tujuan.
3. Validasi input tidak tepercaya dengan Zod.
4. Kembalikan hanya data yang aman bagi pemanggil.
5. Simpan rahasia dan implementasi server dalam modul khusus server.

Perlakukan field tersembunyi `orderId` sebagai input pengguna. Periksa kepemilikan dan aturan pembatalan di server, meskipun UI hanya menampilkan tombol untuk pesanan yang tampak memenuhi syarat.

#### Pisahkan pembacaan independen dari Server Actions {#keep-independent-reads-out-of-server-actions}

Server Functions dapat mengembalikan data, tetapi Server Actions dirancang untuk mutasi dari UI. Next.js mengantrekan panggilan action, sehingga menggunakannya untuk mengambil data independen menyebabkan eksekusi berurutan. [Panduan Backend for Frontend Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-actions)

Baca melalui query fitur saat rendering server. Gunakan HTTP atau RPC ketika kode browser perlu meminta data.

### Ambil data dari browser ketika interaksi membutuhkannya {#fetch-from-the-browser-when-the-interaction-needs-it}

Sebagian layar membutuhkan data tambahan setelah render awal:

- Hasil pencarian berubah saat pengguna mengetik.
- Status pesanan diperbarui selama halaman terbuka.
- Infinite scrolling memuat kelompok data berikutnya.
- Pagination memperbarui daftar tanpa navigasi.
- Request bergantung pada input dari API browser.
- Beberapa tampilan yang terpasang menggunakan data cache yang sama.

Pembacaan ini terjadi setelah halaman dimuat, sehingga browser membutuhkan cara meminta data dari server. Jalurnya dapat berupa Route Handler aplikasi, API eksternal, atau prosedur RPC.

Request satu kali dapat menggunakan `fetch` langsung. Tambahkan library query ketika perlu mengoordinasikan caching, retry, penyegaran di latar belakang, atau request bersama beberapa komponen.

#### Gunakan Route Handler untuk menghubungkan HTTP dengan query fitur {#let-route-handlers-adapt-http-to-feature-queries}

[Route Handlers Next.js](https://nextjs.org/docs/app/getting-started/route-handlers) menggunakan API Web standar `Request` dan `Response`. Tempatkan handler di `app` dan panggil query fitur dari sana:

```ts
// src/app/api/orders/route.ts
import { listOrders } from '@/features/orders/order.queries'

export async function GET() {
  const orders = await listOrders()

  return Response.json(orders)
}
```

Handler menangani request dan response HTTP. Query memverifikasi sesi, membatasi pembacaan pada akun yang diizinkan, dan mengembalikan ringkasan pesanan. Cuplikan ini menunjukkan jalur berhasil; ubah kegagalan autentikasi menjadi respons error HTTP yang sesuai.

Penambahan pagination mengikuti pembagian yang sama: handler membaca nilai query string dan meneruskannya ke query fitur, yang memvalidasi input pagination sebelum menggunakannya.

Route Handler juga sesuai untuk webhook, klien mobile, integrasi eksternal, serta respons seperti file atau feed. Fokuskan setiap handler pada penerjemahan request menjadi operasi fitur dan pengembalian respons yang sesuai.

### Gunakan Route Handler untuk mutasi melalui API {#use-route-handlers-for-mutations-consumed-through-an-api}

Aplikasi mobile atau integrasi eksternal membutuhkan endpoint dengan request dan response yang terdefinisi. Route Handler memvalidasi input dengan Zod dan mengimpor use case publik terlindungi langsung dari fitur orders. Use case memverifikasi pemanggil secara internal:

```ts
// src/app/api/orders/[orderId]/cancel/route.ts
import { cancelOrderInputSchema } from '@/features/orders/model/order.schema'
import { cancelOrderUseCase } from '@/features/orders/cancel-order.use-case'

export async function POST(
  _request: Request,
  context: RouteContext<'/api/orders/[orderId]/cancel'>,
) {
  const { orderId } = await context.params
  const input = cancelOrderInputSchema.parse({ orderId })

  await cancelOrderUseCase(input)

  return new Response(null, { status: 204 })
}
```

Action dan handler sama-sama memanggil `cancelOrderUseCase`, sehingga menegakkan aturan kepemilikan dan pembatalan yang sama. Setiap entry point menangani respons yang dibutuhkan pemanggilnya: action menyegarkan halaman, sementara handler mengembalikan respons HTTP.

Use case adalah operasi server publik yang diimplementasikan di `cancel-order.use-case.ts` pada root fitur dan dilindungi dengan `import 'server-only'`. Operasi publik berada di samping repository privat dan mapper internal; [aturan import publik](./folder-structure#expose-the-operations-and-components-callers-need) menentukan ekspor yang boleh digunakan pemanggil.

Contoh ini menunjukkan respons berhasil. Ubah kegagalan validasi, penolakan akses, dan penolakan pembatalan menjadi status HTTP yang dipilih dengan jelas serta body respons yang aman. Gunakan autentikasi sesuai konsumen API; contoh mengasumsikan pemanggil menggunakan sesi akun aplikasi.

### Panggil API yang sudah ada untuk mutasi {#call-an-existing-api-for-mutations}

Backend yang sudah ada mungkin menyediakan pembatalan pesanan melalui HTTP atau RPC. Jika mendukung panggilan browser terautentikasi, tempatkan request itu di `order.api.ts`. Ini alternatif dari pengiriman melalui Server Action Next.js.

Gunakan ulang schema input pembatalan dari contoh Server Action. Fungsi request mem-parsing input dan mengirimkannya ke API:

```ts
// src/features/orders/order.api.ts
import {
  cancelOrderInputSchema,
  type CancelOrderInput,
} from './model/order.schema'

export async function cancelOrder(input: CancelOrderInput) {
  const body = cancelOrderInputSchema.parse(input)
  const response = await fetch(
    'https://api.example.com/orders/cancel',
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    throw new Error('Unable to cancel order')
  }
}
```

Contoh mengasumsikan API menggunakan cookie sesi browser, mengizinkan request berkredensial dari frontend melalui CORS, dan mengembalikan `204 No Content` saat berhasil. API tetap mengautentikasi pemanggil, memvalidasi input, dan menegakkan aturan kepemilikan serta pembatalan. Parsing sisi klien memberikan umpan balik awal. [MDN: mengirim kredensial](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)

Komponen dapat memanggil fungsi langsung dan menggunakan state React untuk indikator request:

```tsx
// src/features/orders/ui/CancelOrderButton.tsx
'use client'

import { useState } from 'react'
import { cancelOrder } from '../order.api'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle')

  async function handleCancel() {
    setStatus('pending')

    try {
      await cancelOrder({ orderId })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p role="status">Order cancelled.</p>
  }

  return (
    <>
      <button
        type="button"
        disabled={status === 'pending'}
        onClick={handleCancel}
      >
        {status === 'pending' ? 'Cancelling…' : 'Cancel order'}
      </button>

      {status === 'error' && (
        <p role="alert">Unable to cancel order.</p>
      )}
    </>
  )
}
```

[`useState`](https://react.dev/reference/react/useState) melacak indikator dalam komponen ini. Setelah berhasil, perbarui atau ambil ulang data pesanan lain yang ditampilkan tampilan induk. Jalur ini tidak membutuhkan file actions maupun TanStack Query. Jika fitur nantinya menggunakan TanStack, [mutation options](#share-mutation-configuration-when-several-consumers-need-it) dapat memanggil fungsi `cancelOrder` yang sama.

Jika API eksternal membutuhkan private key, simpan request itu di server dan sediakan operasinya melalui Server Action atau Route Handler. Kebutuhan kredensial API menentukan tempat request boleh berjalan. [Tanggung jawab server dan klien Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#when-to-use-server-and-client-components)

### Teruskan data server ke interaksi klien {#pass-server-data-into-client-interaction}

Client Component tidak perlu mengambil ulang data hanya karena interaktif. Teruskan DTO yang dapat diserialisasi dari Server Component:

```tsx
// Server Component
const order = await getOrderDetails({ accountId: account.id, orderId })
return <OrderEditor initialOrder={order} />
```

Di sini, server memperoleh `account` dari request terautentikasi. Ini sesuai untuk editor yang memuat pesanan dan membiarkan pengguna mengubah field secara lokal sebelum menyimpan. Tambahkan pengambilan data browser ketika editor juga membutuhkan data server baru selama terbuka.

Anda juga dapat meneruskan promise ke Client Component dan membacanya dengan [API `use` React](https://react.dev/reference/react/use). Batas Suspense menampilkan fallback selama menunggu promise selesai:

```tsx
// Server Component
import { Suspense } from 'react'
import { listOrders } from '@/features/orders/order.queries'
import { InteractiveOrderList } from '@/features/orders/ui/InteractiveOrderList'
import { OrderListSkeleton } from '@/features/orders/ui/OrderListSkeleton'

export function OrdersPanel() {
  const orders = listOrders()

  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <InteractiveOrderList orders={orders} />
    </Suspense>
  )
}
```

Query memperoleh dan memverifikasi akun sendiri; panel hanya meneruskan promise-nya ke komponen klien.

```tsx
// src/features/orders/ui/InteractiveOrderList.tsx
'use client'

import { use } from 'react'
import type { OrderSummary } from '../model/order.schema'
import { OrderTable } from './OrderTable'

export function InteractiveOrderList({
  orders,
}: {
  orders: Promise<OrderSummary[]>
}) {
  const items = use(orders)
  return <OrderTable items={items} />
}
```

Untuk sebagian besar komponen, menunggu data lalu meneruskan prop yang dapat diserialisasi sudah cukup. Meneruskan promise memungkinkan UI di sekitarnya muncul sementara komponen ini menunggu data. Gunakan ketika bagian layar lain berguna secara mandiri, dengan fallback yang menunjukkan apa yang masih dimuat.

### Bagikan data dengan komponen yang bersarang jauh {#share-data-with-deeply-nested-components}

Halaman orders mengambil pesanan dan meneruskannya melalui panel, tab, serta toolbar sebelum mencapai badge status. Komponen perantara itu kini menerima prop `order` yang tidak pernah digunakannya.

Pertahankan pengambilan data server sebagai pilihan awal untuk data rendering. Pilih cara berbagi hasil berdasarkan komponen konsumen dan apakah mereka membutuhkan pembaruan setelah halaman dimuat.

#### Ambil data di tempat Server Component membutuhkannya {#fetch-where-a-server-component-needs-the-data}

Server Component bersarang dapat memanggil query fitur langsung. Halaman tidak harus memuat semua hasil untuk pohon komponen.

Ketika beberapa Server Component membutuhkan pembacaan database yang sama, ekspor query bersama yang dibungkus `cache()` React:

```ts
// src/features/orders/order.queries.ts
import 'server-only'
import { cache } from 'react'

// Keep the existing query implementation and authorization scope.
export const getOrderDetailsForRender = cache(
  (accountId: string, orderId: string) =>
    getOrderDetails({ accountId, orderId }),
)
```

Setiap Server Component mengimpor fungsi ekspor yang sama. Panggilan dengan ID akun dan pesanan yang sama menggunakan ulang hasil dalam request server. ID primitif juga menghindari cache miss akibat pembuatan objek input baru pada setiap panggilan. React menghapus memoization ini antar-request server. [Referensi `cache` React](https://react.dev/reference/react/cache)

Komponen memberikan ID pesanan dan lingkup akun yang diminta. Query dasarnya memverifikasi lingkup itu terhadap akun terautentikasi. Memoization tidak menggantikan otorisasi.

#### Gunakan context ketika komponen turunan klien berbagi data dari server {#use-context-when-client-descendants-share-server-provided-data}

Editor pesanan mungkin membutuhkan pesanan awal dalam beberapa tab dan kontrol. Jika komponen itu berbagi hasil yang dimuat tanpa menyegarkannya secara independen, sediakan DTO melalui context yang dibatasi pada fitur.

```tsx
// src/features/orders/ui/OrderProvider.tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { OrderSummary } from '../model/order.schema'

const OrderContext = createContext<OrderSummary | null>(null)

export function OrderProvider({
  order,
  children,
}: {
  order: OrderSummary
  children: ReactNode
}) {
  return (
    <OrderContext.Provider value={order}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const order = useContext(OrderContext)

  if (order === null) {
    throw new Error('useOrder must be used within OrderProvider')
  }

  return order
}
```

Server Component meneruskan hasil terotorisasi ke provider:

```tsx
const order = await getOrderDetails({
  accountId: account.id,
  orderId,
})

return (
  <OrderProvider order={order}>
    <OrderEditor />
  </OrderProvider>
)
```

Client Component yang bersarang jauh membaca nilainya langsung:

```tsx
// src/features/orders/ui/OrderStatusBadge.tsx
'use client'

import { useOrder } from './OrderProvider'

export function OrderStatusBadge() {
  const order = useOrder()
  return <span>{order.status}</span>
}
```

Dengan provider mengelilingi editor pesanan, tab dan kontrol klien dapat membaca pesanan tanpa meneruskannya melalui setiap komponen perantara. Hanya Client Component yang dapat menggunakan context ini. Server Component yang diteruskan sebagai children tetap berupa Server Component, tetapi tidak dapat membaca nilai provider. [Context provider Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)

Provider membagikan pesanan dari server; perubahan formulir yang belum disimpan tetap berada dalam draft state editor. Provider juga tidak memberi cara mengambil ulang pesanan atau membatalkan validitas data lama setelah mutasi. Jika komponen membutuhkan pembaruan itu, [pendekatan TanStack Query di bawah](#use-tanstack-query-when-client-consumers-need-ongoing-updates) membahas langkah berikutnya.

Ketika streaming memperbaiki pengalaman layar, provider dapat menerima promise yang dibuat server. Konsumen klien membaca promise dengan `use()` React di bawah batas Suspense. Next.js mendokumentasikan variasi ini untuk berbagi data server pada subtree klien. [Contoh promise melalui context Next.js](https://nextjs.org/docs/app/guides/single-page-applications#using-reacts-use-within-a-context-provider)

### Verifikasi akun yang diminta dalam pembacaan detail {#verify-the-requested-account-in-a-detail-read}

Contoh detail juga mengidentifikasi akun agar entri cache browser tetap terpisah. Perlakukan ID itu sebagai lingkup yang diminta dan verifikasi di dalam query. Definisikan input bersama schema yang ada:

```ts
// src/features/orders/model/order.schema.ts
export const orderReferenceInputSchema = z.object({
  accountId: z.string().min(1),
  orderId: z.string().min(1),
})

export type OrderReferenceInput = z.infer<typeof orderReferenceInputSchema>
```

Tambahkan pembacaan detail ke modul query server yang sama. Pertahankan import dan implementasi `listOrders` di atas, lalu tambahkan import schema berikut:

```ts
// src/features/orders/order.queries.ts
import { orderReferenceInputSchema } from './model/order.schema'
import type { OrderReferenceInput } from './model/order.schema'

export async function getOrderDetails(input: OrderReferenceInput) {
  const account = await requireAccount()
  const { accountId, orderId } = orderReferenceInputSchema.parse(input)

  if (accountId !== account.id) throw new Error('Access denied')

  const row = await database.order.findFirst({
    where: { id: orderId, accountId: account.id },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  if (!row) throw new Error('Order not found')

  return orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  })
}
```

Contoh ini melayani satu konteks akun yang diizinkan per request. Fitur membership menentukan cara konteks itu dipilih dan diverifikasi. Halaman, handler HTTP, atau prosedur RPC dapat memanggil query ini; tidak ada yang bisa memberikan akses dengan menyuplai ID akun berbeda. Sesuaikan kegagalan yang diperkirakan dengan respons yang dibutuhkan setiap pemanggil.

### Ekstrak mapper DTO ketika pembacaan berbagi konversi {#extract-a-dto-mapper-when-reads-share-the-conversion}

File `order.dto.ts` terpisah bersifat opsional. Simpan pemetaan singkat dalam query sampai berbagi atau memisahkan konversi membuat kode lebih jelas. Pembacaan daftar dan detail di atas mengembalikan field sama dan mengonversi tanggal database yang sama, sehingga dapat berbagi satu mapper:

```ts
// src/features/orders/order.dto.ts
import 'server-only'
import { orderSummarySchema, type OrderSummary } from './model/order.schema'

export function toOrderSummary(row: {
  id: string
  status: string
  totalInCents: number
  createdAt: Date
}): OrderSummary {
  return orderSummarySchema.parse({
    id: row.id,
    status: row.status,
    totalInCents: row.totalInCents,
    createdAt: row.createdAt.toISOString(),
  })
}
```

Parameter mendeskripsikan field database terpilih, termasuk nilai `Date`. DTO hasil mengikuti `orderSummarySchema`, dengan `createdAt` dikonversi menjadi string. Simpan schema dan tipe `OrderSummary` hasil inferensinya di `model/` agar Client Component dapat menggunakan kontrak data tanpa mengimpor mapper server.

Dalam `order.queries.ts`, ganti import langsung `orderSummarySchema` dengan `toOrderSummary`. Pembacaan daftar menjadi:

```ts
// src/features/orders/order.queries.ts
import 'server-only'
import { requireAccount } from '@/features/membership/membership.queries'
import { database } from '@/platform/database/client'
import { toOrderSummary } from './order.dto'

export async function listOrders() {
  const account = await requireAccount()
  const rows = await database.order.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, totalInCents: true, createdAt: true },
  })

  return rows.map(toOrderSummary)
}
```

Pertahankan pembacaan detail dan import schema input-nya dalam modul query yang sama. Setelah pemeriksaan akun, pembacaan database terbatas, dan pemeriksaan pesanan tidak ditemukan yang sudah ada, ganti pemetaan inline dengan:

```ts
return toOrderSummary(row)
```

Query tetap memverifikasi akses dan memilih field yang diizinkan. Mapper hanya mengonversi dan memvalidasi field itu; mapper tidak memuat data atau mengotorisasi pemanggil. Jaga tetap privat dalam fitur. Route, prosedur RPC, dan fitur lain tetap memanggil query publik.

### Mulai pembacaan independen bersama-sama {#start-independent-reads-together}

Query terlindungi yang independen dapat dimulai bersama dan masing-masing memverifikasi pemanggil secara internal. Menunggu satu query sebelum memulai yang lain membuat pembacaan kedua menunggu tanpa perlu.

```tsx
export default async function DashboardPage() {
  const ordersPromise = listRecentOrders()
  const balancePromise = getAccountBalance()

  const [orders, balance] = await Promise.all([
    ordersPromise,
    balancePromise,
  ])

  return <Dashboard orders={orders} balance={balance} />
}
```

Jika satu pembacaan lambat dan halaman sekitarnya berguna tanpa hasil itu, pindahkan pembacaan ke Server Component async yang lebih kecil di balik `<Suspense>`. Bagian halaman lain dapat muncul sementara komponen menunggu data. [Panduan streaming Next.js](https://nextjs.org/docs/app/getting-started/fetching-data#streaming)

## React Query {#react-query}

### Tambahkan TanStack Query untuk caching dan pembaruan di latar belakang {#add-tanstack-query-for-caching-and-background-updates}

Jika layar pesanan perlu mengambil ulang data di latar belakang, mencoba ulang request gagal, atau berbagi data dengan tampilan lain yang terpasang, gunakan [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview). Library ini melacak status request dan data server yang di-cache dalam browser.

Untuk pembacaan browser melalui API HTTP aplikasi ini, simpan request dalam `order.api.ts`:

```ts
// src/features/orders/order.api.ts
import { orderSummarySchema } from './model/order.schema'

export async function fetchOrderDetails(
  input: { accountId: string; orderId: string },
  signal?: AbortSignal,
) {
  const accountId = encodeURIComponent(input.accountId)
  const orderId = encodeURIComponent(input.orderId)
  const response = await fetch(
    `/api/accounts/${accountId}/orders/${orderId}`,
    { signal },
  )

  if (!response.ok) throw new Error('Unable to load order')
  return orderSummarySchema.parse(await response.json())
}
```

Request API terkait dapat berbagi file ini. Ekspor definisi TanStack dari `order.query-options.ts`; fungsi bantu [`queryOptions`](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) menyatukan key, fungsi request, dan kebijakan cache dengan inferensi tipe:

```ts
// src/features/orders/order.query-options.ts
import { queryOptions } from '@tanstack/react-query'
import { fetchOrderDetails } from './order.api'

export function orderDetailsOptions(input: {
  accountId: string
  orderId: string
}) {
  return queryOptions({
    queryKey: ['orders', input.accountId, 'details', input.orderId],
    queryFn: ({ signal }) => fetchOrderDetails(input, signal),
    staleTime: 60_000,
  })
}
```

Tampilan detail ini menampilkan empat field dalam `OrderSummary`. Contoh mengasumsikan endpoint HTTP di `/api/accounts/[accountId]/orders/[orderId]`. Handler-nya meneruskan ID akun dan pesanan yang diminta ke query terlindungi `getOrderDetails` lalu menyesuaikan response. Query memverifikasi sesi, menolak ketidakcocokan akun, membatasi pembacaan pada kedua ID, dan mengembalikan DTO yang sama.

ID akun membedakan entri cache; ID itu tidak memberikan akses. Sertakan input yang mengubah hasil dalam [query key](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys). Hapus data akun saat mengakhiri sesi, dan batasi cache klien aplikasi dengan tepat saat berganti akun.

Komponen menggunakan options langsung:

```tsx
// src/features/orders/ui/LiveOrderDetails.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { orderDetailsOptions } from '../order.query-options'
import { OrderDetails } from './OrderDetails'

export function LiveOrderDetails(input: {
  accountId: string
  orderId: string
}) {
  const order = useQuery(orderDetailsOptions(input))

  if (order.isPending) return <p role="status">Loading order…</p>
  if (order.isError) return <p role="alert">Unable to load order.</p>
  return <OrderDetails order={order.data} />
}
```

Ini mengasumsikan `QueryClientProvider` sudah dikonfigurasi. Tambahkan custom hook ketika mengoordinasikan perilaku React di luar penggunaan query. Options tetap tersedia bagi komponen, operasi cache, dan rendering server tanpa memanggil hook.

`order.queries.ts` menjalankan pembacaan server langsung. `order.api.ts` membuat request HTTP. `order.query-options.ts` mengembalikan konfigurasi; membuat options tidak menjalankan request tersebut. Jangan masukkan import khusus server ke modul API dan options, dan jangan beri `'use client'` ketika Server Component perlu memanggil factory options.

### Bagikan konfigurasi mutasi ketika beberapa konsumen membutuhkannya {#share-mutation-configuration-when-several-consumers-need-it}

Formulir dapat memanggil Server Action langsung. Ketika UI membutuhkan state mutasi TanStack, fungsi mutasinya dapat memanggil Server Action, endpoint HTTP, atau prosedur RPC. Perbarui atau batalkan validitas query klien yang terpengaruh setelah berhasil agar tampilan yang terpasang menerima data yang berubah. [Invalidasi dari mutasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Mutasi yang digunakan satu komponen dapat menyimpan konfigurasi di sana. Setelah beberapa konsumen membutuhkan konfigurasi yang sama, factory options memberi definisi bersama. Untuk [pembatalan melalui API eksternal](#call-an-existing-api-for-mutations), factory dapat menggunakan ulang fungsi request yang sudah ditulis:

```ts
// src/features/orders/order.mutation-options.ts
import { mutationOptions } from '@tanstack/react-query'
import { cancelOrder } from './order.api'

export function cancelOrderOptions() {
  return mutationOptions({
    mutationKey: ['orders', 'cancel'],
    mutationFn: cancelOrder,
  })
}
```

Factory ini dan tombol React biasa memanggil request API yang sama. Dengan `useMutation(cancelOrderOptions())`, komponen meneruskan `{ orderId }` ke `mutate` dan menambahkan handler `onSuccess` untuk membatalkan validitas query pesanan akun yang terpengaruh. Navigasi dan notifikasi tetap bersama komponen karena bergantung pada perilaku layar setelah pembatalan. [Contoh mutation options](https://tanstack.com/query/latest/docs/framework/react/typescript#typing-mutation-options) TanStack menunjukkan bagaimana factory juga dapat menyuplai konsumen status mutasi.

Untuk UI dengan Server Action, `mutationFn` dapat merujuk ekspor dari `order.actions.ts`. Action dalam panduan ini menerima `FormData`; itulah input untuk `mutate` pada versi tersebut. Impor modul khusus `'use server'` agar Next.js menyediakan fungsi yang dapat dipanggil klien. [Server Functions Next.js dalam Client Components](https://nextjs.org/docs/app/api-reference/directives/use-server#using-server-functions-in-a-client-component)

`order.mutation-options.ts` bersifat opsional. Pemanggil server memanggil operasi fitur yang sesuai langsung; mereka tidak membutuhkan mutation options untuk menjalankan penulisan.

### Gunakan TanStack Query ketika konsumen klien membutuhkan pembaruan berkelanjutan {#use-tanstack-query-when-client-consumers-need-ongoing-updates}

Badge status pesanan, panel detail, dan kontrol pembatalan mungkin sama-sama membutuhkan data baru setelah pembatalan. Gunakan TanStack Query ketika beberapa tampilan klien harus berbagi data server dan menjaganya tetap terkini.

Setiap konsumen membaca query yang sama melalui QueryClient yang sama. Memperbarui atau membatalkan validitas query setelah pembatalan memungkinkan seluruh tampilan itu menerima data yang berubah. Jika Anda juga menginginkan prosedur bertipe dan options request hasil generasi, oRPC menyediakan [integrasi TanStack Query](https://orpc.dev/docs/integrations/tanstack-query), yang dibahas pada bagian berikutnya.

Pembacaan awal tetap bisa dilakukan dalam Server Component. Isi cache query di server dan lakukan hydration di sekitar subtree klien, seperti pada [contoh prefetch](#prefetch-when-the-client-needs-the-same-data-afterward) nanti:

```text
Server Component → query fitur → cache query hasil hydration
                                      ↓
                           konsumen klien bersarang
                                      ↓
                           mutasi → invalidasi query
```

Badge status dan panel detail harus merender nilainya dari cache klien tersebut. Salinan terpisah yang dirender Server Component tidak berubah saat browser melakukan refetch, sehingga keduanya bisa menampilkan status pesanan berbeda. Contoh prefetch di bawah menunjukkan cara menyuplai data cache awal selama rendering server. [Rendering server dan kepemilikan data TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

Untuk dashboard interaktif, utamakan TanStack Query bagi data browser yang berubah melalui filter, polling, atau mutasi. Kami merekomendasikan oRPC untuk API bertipe bersama yang baru. API HTTP yang sudah ada dapat menyuplai cache query yang sama.

### Lakukan prefetch ketika klien masih membutuhkan data yang sama setelahnya {#prefetch-when-the-client-needs-the-same-data-afterward}

Layar pesanan mungkin membutuhkan data selama rendering server lalu terus memperbaruinya di browser. Baca melalui query server fitur dan isi cache dengan key yang dikembalikan options bersama:

```tsx
// src/app/(authenticated)/orders/[orderId]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { requireAccount } from '@/features/membership/membership.queries'
import { getOrderDetails } from '@/features/orders/order.queries'
import { orderDetailsOptions } from '@/features/orders/order.query-options'
import { LiveOrderDetails } from '@/features/orders/ui/LiveOrderDetails'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const account = await requireAccount()
  const { orderId } = await params
  const input = { accountId: account.id, orderId }
  const queryClient = new QueryClient()
  const order = await getOrderDetails(input)

  queryClient.setQueryData(orderDetailsOptions(input).queryKey, order)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LiveOrderDetails {...input} />
    </HydrationBoundary>
  )
}
```

Ini alternatif dari halaman yang merender DTO langsung. Contoh membuat QueryClient untuk render server ini, memanggil pembacaan langsung, dan menyimpan hasil dengan [`setQueryData`](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata). `dehydrate` dan `HydrationBoundary` memindahkan data itu ke cache klien. Aplikasi tetap membutuhkan penyiapan provider. [Rendering server lanjutan TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

Browser dan server berbagi identitas query serta kontrak hasil. Contoh server ini tidak menjalankan fetch URL relatif dari options; ia mengakses query fitur langsung. Factory options lengkap juga dapat berjalan di kedua lingkungan ketika fungsi request dan penyiapan autentikasinya mendukung keduanya. Untuk panggilan ke data aplikasi sendiri, pertahankan jalur server langsung. [Pengambilan data server Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

`staleTime` pada options bersama memberi tahu TanStack Query berapa lama data dianggap baru, sehingga hydration tidak langsung memicu request lain. Tetapkan sesuai kebutuhan kesegaran layar. Di server, setiap request membutuhkan QueryClient sendiri, seperti contoh ini.

Setelah hydration, cache klien menyuplai pesanan yang ditampilkan dan pembaruan berikutnya. Jika Anda juga merender status pesanan terpisah dalam Server Component, refetch browser tidak memperbarui salinan itu. Tentukan komponen yang merender setiap nilai sebelum menambahkan kedua versi ke halaman. [Kepemilikan data dan revalidasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

Mulai dengan query Server Component ketika halaman hanya membutuhkan data untuk rendering. Tambahkan cache dan hydration ini ketika interaksi browser terus menggunakan query setelah render awal.

## oRPC + React Query {#orpc-react-query}

### Tambahkan oRPC ketika pemanggil membutuhkan API bertipe bersama {#add-orpc-when-callers-need-a-shared-typed-api}

Beberapa tampilan interaktif mungkin memanggil operasi pesanan yang sama. Anda perlu menjaga input request, tipe response, dan penanganan error tetap konsisten pada semua panggilan tersebut.

Kami merekomendasikan oRPC ketika memperkenalkan API bertipe bersama yang baru. Setiap fitur mendefinisikan prosedur untuk operasinya, dan aplikasi menyediakannya melalui adapter HTTP. Kode browser memanggil prosedur melalui klien bertipe, dengan input dan hasil diperiksa oleh TypeScript. Jika API HTTP sudah ada, API itu dapat tetap menyuplai TanStack Query tanpa migrasi oRPC.

oRPC mendefinisikan API yang dapat dipanggil dan membawa tipe input serta hasil ke klien. TanStack Query mengelola hasil cache, state request, dan refetch. Anda dapat memanggil klien oRPC langsung untuk request satu kali atau menggunakan [integrasi TanStack Query](https://orpc.dev/docs/integrations/tanstack-query) ketika browser membutuhkan siklus hidup tersebut.

Pembacaan detail pesanan mengikuti jalur ini:

```text
Client Component → TanStack Query → klien oRPC → adapter HTTP Next.js
  → prosedur detail pesanan → query fitur
```

Contoh berikut menggunakan ulang query pesanan, use case pembatalan, dan schema dari panduan ini. Ikuti [panduan instalasi resmi](https://orpc.dev/docs/getting-started#installation) untuk paket oRPC; aplikasi juga membutuhkan provider TanStack Query yang dijelaskan sebelumnya.

#### Hubungkan request orders dengan operasi fitur yang ada {#adapt-order-requests-to-the-existing-feature-operations}

Kedua prosedur mengidentifikasi pesanan dalam satu akun. Gunakan ulang `orderReferenceInputSchema` dari [pembacaan detail](#verify-the-requested-account-in-a-detail-read). Browser memberikan `accountId` agar identitas query mencakup akun yang dipilih. Server harus memeriksa pilihan itu terhadap request terautentikasi.

Definisikan prosedur di samping operasi server yang dipanggilnya:

```ts
// src/features/orders/order.rpc.ts
import 'server-only'
import { ORPCError, os } from '@orpc/server'
import { requireAccount } from '@/features/membership/membership.queries'
import { orderReferenceInputSchema, orderSummarySchema } from './model/order.schema'
import { getOrderDetails } from './order.queries'
import { cancelOrderUseCase } from './cancel-order.use-case'

const accountOrderProcedure = os
  .input(orderReferenceInputSchema)
  .use(async ({ next }, input) => {
    const account = await requireAccount()

    if (input.accountId !== account.id) {
      throw new ORPCError('FORBIDDEN')
    }

    return next({ context: { account } })
  })

export const orderRouter = {
  details: accountOrderProcedure
    .output(orderSummarySchema)
    .handler(({ input, context }) =>
      getOrderDetails({ accountId: context.account.id, orderId: input.orderId }),
    ),

  cancel: accountOrderProcedure.handler(async ({ input }) => {
    await cancelOrderUseCase({ orderId: input.orderId })
  }),
}
```

Prosedur bersama memvalidasi input, memperoleh akun dari request, dan menolak ID akun berbeda. Middleware-nya meneruskan akun terautentikasi ke setiap handler. [Middleware oRPC](https://orpc.dev/docs/middleware#middleware-input)

Contoh ini mengasumsikan `requireAccount` menolak panggilan API tanpa autentikasi, bukan mengalihkan ke halaman login. Sesuaikan kegagalan autentikasi menjadi error oRPC `UNAUTHORIZED` pada batas API. Query dan use case juga memverifikasi akun secara internal, sehingga pemanggil server langsung mendapat perlindungan yang sama. Query membatasi pembacaan pada akun yang diminta; use case menegakkan kepemilikan, kelayakan pembatalan, dan pemeriksaan update bersamaan dari [penelusuran pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order).

Pembacaan mengembalikan DTO `OrderSummary` yang sudah ada. Pembatalan tidak mengembalikan data. UI di bawah menampilkan pesan kegagalan umum; ketika membutuhkan petunjuk pemulihan khusus, ubah kegagalan fitur yang dikenal menjadi error oRPC yang dipilih secara eksplisit. Jaga pesan error dan data aman bagi pemanggil, serta pisahkan tipe error khusus oRPC dari aturan bisnis murni. [Penanganan error oRPC](https://orpc.dev/docs/error-handling)

#### Pasang prosedur dan hubungkan klien {#mount-the-procedures-and-connect-the-client}

Aplikasi menyusun router API dari ekspor fitur:

```ts
// src/app/api/rpc/router.ts
import 'server-only'
import { orderRouter } from '@/features/orders/order.rpc'

export const router = { orders: orderRouter }
```

Pasang melalui Route Handler catch-all agar path prosedur bersarang mencapai adapter:

```ts
// src/app/api/rpc/[...rest]/route.ts
import { RPCHandler } from '@orpc/server/fetch'
import { router } from '../router'

const handler = new RPCHandler(router)

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: {},
  })

  return response ?? new Response('Not found', { status: 404 })
}

export { handleRequest as GET, handleRequest as POST }
```

Route menghubungkan HTTP dengan router yang sudah disusun. Perilaku orders tetap dalam fitur. Lihat [adapter Next.js oRPC](https://orpc.dev/docs/adapters/next) untuk konfigurasi transport.

Simpan link HTTP bersama di `platform`. Modul ini tidak mengimpor fitur apa pun:

```ts
// src/platform/rpc/client.ts
import { RPCLink } from '@orpc/client/fetch'

export const rpcLink = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('Use a direct query or local oRPC client on the server')
    }

    return new URL('/api/rpc', window.location.origin).toString()
  },
})
```

Link ini mengirim request browser ke origin yang sama, menggunakan cookie sesi aplikasi. URL sesuai dengan prefix handler. Aplikasi yang di-deploy dengan `basePath` Next.js harus menyertakan prefix tersebut dalam URL browser.

Fitur orders menyediakan tipe klien dan utilitas query-nya sendiri:

```ts
// src/features/orders/order.rpc-client.ts
import { createORPCClient } from '@orpc/client'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpcLink } from '@/platform/rpc/client'
import type { orderRouter } from './order.rpc'

export const orderClient: RouterClient<{ orders: typeof orderRouter }> =
  createORPCClient(rpcLink)

export const orpc = createTanstackQueryUtils(orderClient)
```

Key `orders` sesuai dengan router aplikasi. Klien ini hanya mengenali prosedur orders. Import modul server-nya hanya untuk tipe, sehingga implementasi prosedur tidak masuk bundle browser. oRPC mendukung penentuan tipe klien dari router server-nya. [Penyiapan klien oRPC](https://orpc.dev/docs/client/client-side#setup)

File-file tersebut memiliki tanggung jawab berikut:

| File | Tanggung jawab |
| --- | --- |
| `features/orders/model/order.schema.ts` | Schema input bersama dan schema DTO |
| `features/orders/order.rpc.ts` | Prosedur yang mengautentikasi, memvalidasi, dan memanggil operasi fitur |
| `app/api/rpc/router.ts` | Menyusun prosedur fitur menjadi API aplikasi |
| `app/api/rpc/[...rest]/route.ts` | Menyediakan API melalui HTTP |
| `platform/rpc/client.ts` | Transport browser bersama |
| `features/orders/order.rpc-client.ts` | Klien orders bertipe dan utilitas TanStack Query |

File schema digunakan bersama kode browser, jadi harus bebas dependensi khusus server. Fitur lain yang berjalan di server tetap dapat memanggil query dan use case publik langsung. Penambahan API tidak menjadikan repository atau mapper internal publik; keduanya tetap di balik operasi yang dijelaskan dalam [aturan dependensi folder](./folder-structure#keep-operation-modules-at-the-feature-root).

#### Baca melalui query options hasil generasi {#read-through-generated-query-options}

Factory options sebelumnya mendefinisikan request HTTP dan query key secara manual. Kini oRPC dapat menghasilkan keduanya, sehingga factory cukup menyediakan kebijakan kesegaran bersama:

```ts
// src/features/orders/order.query-options.ts
import { orpc } from './order.rpc-client'
import type { OrderReferenceInput } from './model/order.schema'

export function orderDetailsOptions(input: OrderReferenceInput) {
  return orpc.orders.details.queryOptions({ input, staleTime: 60_000 })
}
```

Komponen `LiveOrderDetails` yang ada tetap memanggil `useQuery(orderDetailsOptions(input))` dan merender state loading, error, serta berhasil. oRPC kini menyediakan fungsi request dan query key. Jalur ini tidak membutuhkan wrapper `order.api.ts`.

`staleTime` bersama menjadi alasan contoh ini tetap memiliki file `order.query-options.ts`. Jika hanya satu komponen membutuhkan query dan tidak ada konfigurasi bersama, komponen dapat memanggil `orpc.orders.details.queryOptions({ input })` langsung. Integrasi juga menyediakan mutation options dan fungsi bantu key. [Integrasi TanStack Query oRPC](https://orpc.dev/docs/integrations/tanstack-query)

#### Batalkan pesanan dan invalidasi pembacaan yang terpengaruh {#cancel-the-order-and-invalidate-affected-reads}

Kontrol pembatalan memanggil prosedur, lalu membatalkan validitas query pesanan setelah penulisan berhasil:

```tsx
// src/features/orders/ui/CancelOrderButton.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '../order.rpc-client'
import type { OrderReferenceInput } from '../model/order.schema'

export function CancelOrderButton(input: OrderReferenceInput) {
  const queryClient = useQueryClient()
  const cancel = useMutation(orpc.orders.cancel.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orpc.orders.key() })
    },
  }))

  return (
    <>
      <button
        type="button"
        disabled={cancel.isPending || cancel.isSuccess}
        onClick={() => cancel.mutate(input)}
      >
        {cancel.isPending ? 'Cancelling…' : 'Cancel order'}
      </button>
      {cancel.isError && <p role="alert">Unable to cancel order.</p>}
      {cancel.isSuccess && <p role="status">Order cancelled.</p>}
    </>
  )
}
```

Ini menggantikan tombol berbasis API sebelumnya. Render untuk pesanan yang dapat dibatalkan dan beri key berdasarkan ID akun serta pesanan jika tampilan sekitarnya berganti pesanan tanpa melepas kontrol. Use case selalu memeriksa status tersimpan terkini.

`orpc.orders.key()` mencocokkan query di bawah router orders, termasuk pembacaan detail dan prosedur daftar pesanan yang ditambahkan di sana. Ini sengaja menginvalidasi seluruh query pesanan yang di-cache; query aktif yang cocok melakukan refetch. Persempit pilihan ketika cache membesar. Menunggu invalidasi menjaga mutasi berstatus pending sampai refetch selesai. [Invalidasi mutasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Mutation options hasil generasi tidak menyimpulkan pembacaan mana yang berubah. Pilih query key yang terpengaruh secara eksplisit. Key oRPC juga berbeda dari key manual `['orders', ...]` sebelumnya, jadi migrasikan prefetch, update cache, dan invalidasi bersama-sama. Query HTTP biasa yang masih menggunakan key manual membutuhkan invalidasi sendiri.

Simpan konfigurasi mutasi untuk satu konsumen ini di samping kontrol. Ekstrak `order.mutation-options.ts` ketika beberapa konsumen menggunakannya bersama. Jika penulisan juga memengaruhi data hasil render server yang di-cache, revalidasi cache itu secara terpisah; invalidasi TanStack hanya memperbarui cache query klien.

#### Pertahankan jalur langsung untuk rendering server {#keep-server-rendering-on-a-direct-path}

Untuk Server Component, gunakan query fitur langsung sebagai pilihan awal. [Contoh hydration](#prefetch-when-the-client-needs-the-same-data-afterward) bekerja dengan `orderDetailsOptions` baru: ambil melalui `getOrderDetails`, lalu simpan DTO dengan query key hasil generasi sebelum dehydrate.

Membuat query options tidak mengirim request. Link browser menentukan URL hanya saat prosedur dipanggil, sehingga rendering server dapat menggunakan key options tanpa menjalankan transport browser. Jaga modul klien dan options bebas dari `'use client'` untuk penggunaan tersebut.

Ketika pemanggil server membutuhkan validasi dan middleware prosedur, gunakan `call` atau `createRouterClient` oRPC untuk memanggilnya secara lokal. Berikan konteks request terautentikasi yang dibutuhkan prosedur. Panggilan lokal menghindari perjalanan HTTP ke API aplikasi sendiri. [Klien sisi server oRPC](https://orpc.dev/docs/client/server-side)

oRPC menambah prosedur dan konfigurasi transport yang perlu dirawat. Gunakan ketika panggilan browser bertipe dan perilaku API bersama membenarkan penyiapan itu. Halaman yang hanya membutuhkan pembacaan server langsung dapat tetap menggunakan query fitur.

## Memilih pendekatan {#choosing-an-approach}

### Pilih strategi data untuk seluruh proyek {#choose-a-project-wide-data-strategy}

Ketika setiap fitur memilih klien request dan aturan cache sendiri, developer harus mempelajari ulang alur data setiap kali bekerja pada fitur lain. Pilih strategi awal proyek dan gunakan secara konsisten untuk operasi yang sebanding.

| Strategi | Pilih ketika | Aplikasi yang sesuai | Pekerjaan tambahan |
| --- | --- | --- | --- |
| **Next.js native** | Pembacaan hasil render server dan pengiriman formulir mencakup sebagian besar interaksi. | Situs konten, portal pelanggan, atau alat internal dengan formulir sederhana. | Definisikan query fitur, Server Actions, dan endpoint HTTP yang diperlukan. |
| **Next.js + React Query** | Tampilan browser membutuhkan data cache bersama, polling, penyegaran latar belakang, atau update optimistis. | Dashboard operasional atau workspace interaktif dengan API HTTP yang sudah ada. | Rawat query key, update cache, dan fungsi request pemanggil API. |
| **Next.js + React Query + oRPC** | Anda mengendalikan API dan menginginkan operasi bertipe bersama antarfitur atau klien aplikasi. | Produk dengan klien web dan mobile yang menggunakan operasi bisnis sama. | Rawat kontrak prosedur, konteks request, penyiapan transport, dan aturan cache klien. |

Pilih berdasarkan kebutuhan aplikasi dan backend yang ada. Proyek besar dapat berhasil menggunakan API native Next.js. Pembaruan browser yang sering atau API bersama adalah alasan yang lebih berguna untuk menambah alat daripada ukuran proyek saja.

React Query mengelola data server yang di-cache dan state request bagi konsumen klien. oRPC menyediakan operasi bertipe dan terintegrasi dengan options React Query. Keduanya dapat bekerja bersama rendering server Next.js. [Panduan rendering server TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), [integrasi oRPC](https://orpc.dev/docs/integrations/tanstack-query)

### Terapkan strategi secara konsisten {#apply-the-strategy-consistently}

Memilih library hanya sebagian dari keputusan. Tetapkan juga cara proyek menangani pembacaan server, request browser, mutasi, dan pembaruan setelah penulisan berhasil.

Contohnya, proyek yang memilih **React Query + oRPC** dapat mengikuti aturan berikut:

| Operasi | Pilihan awal proyek |
| --- | --- |
| Membaca data selama rendering server | Panggil query server fitur langsung. |
| Membaca data yang membutuhkan pembaruan browser berkelanjutan | Gunakan React Query dengan query options oRPC. |
| Mengirim mutasi aplikasi dari browser | Gunakan React Query dengan mutation options oRPC. Prosedur memanggil use case fitur. |
| Memperbarui browser setelah mutasi | Invalidasi atau perbarui query klien yang terpengaruh. Revalidasi data server yang di-cache secara terpisah jika terpengaruh. |
| Menerima webhook | Gunakan Route Handler yang memvalidasi request dan memanggil operasi fitur. |

Aturan ini memberi setiap jalur eksekusi tanggung jawab yang jelas. Kontributor dapat mengikuti pendekatan sama saat menambahkan fitur lain.

Gunakan [matriks operasi](#choose-the-default-that-matches-the-caller) dalam strategi yang dipilih. Ketika kebutuhan baru membenarkan library atau transport lain, perbarui strategi proyek dan dokumentasikan tempat pendekatan baru berlaku.

### Pilih jalur data berdasarkan operasi {#choose-the-data-path-from-the-operation}

Sebelum menambahkan query atau mutasi, jawab tiga pertanyaan:

1. **Apa yang dilakukan?** Pembacaan mengambil data. Mutasi mengubah state aplikasi atau memicu efek.
2. **Siapa pemanggilnya?** Server Component, kode browser, atau klien lain seperti aplikasi mobile maupun integrasi eksternal?
3. **Apa yang dibutuhkan pemanggil setelahnya?** Satu hasil, halaman yang disegarkan, atau data yang terus diperbarui melalui polling, penyegaran latar belakang, atau cache klien bersama?

Mengubah filter, nomor halaman, atau parameter pencarian biasanya memilih data berbeda untuk dibaca. Klasifikasikan operasi berdasarkan tindakannya terhadap state aplikasi. Membuka menu atau mengubah field formulir yang belum disimpan dapat tetap dalam state komponen.

### Pilih jalur yang sesuai dengan pemanggil {#choose-the-default-that-matches-the-caller}

Terapkan [strategi proyek yang dipilih](#choose-a-project-wide-data-strategy) pada setiap pemanggil. Gunakan konvensi request dan cache yang sama untuk operasi sebanding lintas fitur.

| Situasi | Jalur dalam strategi terpilih | Perilaku pendukung |
| --- | --- | --- |
| Server Component membutuhkan data untuk rendering | Query fitur langsung dekat konsumen | `cache()` React untuk pembacaan database berulang selama request |
| Client Component membutuhkan data awal | Prop yang dapat diserialisasi dari server | Promise dan `use()` ketika streaming memperbaiki pengalaman layar |
| Komponen turunan klien yang jauh berbagi data yang dimuat | Context dalam lingkup fitur | Draft state saat mengedit secara lokal |
| Kode browser membutuhkan pembacaan | Klien HTTP atau RPC proyek, melalui TanStack Query jika dipilih untuk proyek | Indikator loading dan error |
| Tampilan klien membutuhkan data bersama yang terus diperbarui | TanStack Query dengan klien HTTP atau RPC proyek | Pengambilan data server dan hydration untuk render awal |
| Formulir atau kontrol mengirim mutasi yang ditangani aplikasi Next.js ini | Jalur Server Action, HTTP, atau RPC pilihan proyek yang memanggil use case fitur | Indikator pending, pesan error yang diperkirakan, dan pembaruan data yang terpengaruh |
| UI mengirim mutasi ke API HTTP atau RPC yang sudah ada | Klien API yang ada, melalui TanStack Query jika dipilih untuk proyek | Indikator mutasi dan pembaruan data yang terpengaruh |
| Aplikasi mobile atau integrasi eksternal membutuhkan mutasi | Endpoint HTTP atau prosedur RPC proyek yang memanggil use case fitur | Autentikasi dan respons yang sesuai konsumen |
| Webhook mengirim event | Route Handler yang memvalidasi event dan memanggil operasi fitur | Respons sesuai protokol webhook provider |
| Interaksi hanya mengubah state UI lokal | State komponen | Library state ketika beberapa bagian klien perlu mengoordinasikan state tersebut |

Selanjutnya: [lindungi pembacaan dan mutasi pada batas fitur](./protected-resources).
