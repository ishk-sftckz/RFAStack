---
title: Pengambilan Data & Mutasi
description: Memilih cara mengambil data dan menjalankan mutasi sesuai kebutuhan halaman, interaksi browser, dan API aplikasi.
---

# Pengambilan Data & Mutasi

Next.js menyediakan cara untuk [mengambil data](https://nextjs.org/docs/app/getting-started/fetching-data) dan [menjalankan mutasi](https://nextjs.org/docs/app/getting-started/mutating-data). Tapi memuat halaman, memperbarui status pesanan di browser, dan menerima pembatalan dari aplikasi mobile punya kebutuhan berbeda. Tentukan strategi data untuk proyekmu supaya setiap fitur mengikuti pola yang sama untuk kebutuhan yang serupa.

## Next.js native {#next-js-native}

### Ambil data saat rendering lewat Server Component {#read-during-rendering-through-a-server-component}

Server Component bisa mengambil data sambil merender halaman, baik lewat `fetch`, ORM, maupun klien database. Dalam fitur orders, komponen memanggil query dari `order.queries.ts`, lalu mengirim hasilnya ke UI. [Panduan pengambilan data Next.js](https://nextjs.org/docs/app/getting-started/fetching-data)

Komponen dan query sama-sama berjalan di server, jadi panggil fungsinya langsung. Melewati Route Handler aplikasi sendiri hanya menambah request HTTP di antara keduanya. Request itu juga bisa gagal saat prerender pada waktu build karena server HTTP aplikasi belum berjalan. [Panduan Backend for Frontend Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

Sebelum menulis query, tentukan field yang boleh diterima UI. Contoh orders membutuhkan ID, status, total, dan tanggal pembuatan pesanan. Kita definisikan hasilnya dengan schema Zod agar query bisa memvalidasinya dan UI mendapat tipe TypeScript yang sesuai. Tambahkan schema ini ke `model/order.schema.ts`, di samping schema input yang sudah ada:

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

Kode ini melengkapi file schema dari [contoh struktur folder](./folder-structure#use-zod-schemas-and-infer-their-types). Pertahankan `orderStatusSchema` saat menambahkan `orderSummarySchema`. Zod memvalidasi nilai saat runtime sekaligus menyediakan inferensi tipe TypeScript. [Dasar Zod](https://zod.dev/basics)

Query membatasi pencarian ke akun yang diizinkan, lalu mengubah record database menjadi bentuk hasil di atas. Namanya `listOrders` karena mengembalikan kumpulan pesanan. Dalam [konvensi nama query](./folder-structure#name-reads-by-their-result-and-responsibility), `get` dipakai untuk satu resource atau agregat, sedangkan `fetch` untuk helper request HTTP/RPC.

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

Halaman memanggil fitur secara langsung:

```text
Server Component → query fitur → database atau layanan eksternal
```

Halaman mengurus rendering. Fitur menentukan pesanan yang boleh dilihat akun dan field yang dikembalikan. Route lain yang membutuhkan data sama bisa mengimpor query langsung dari `order.queries.ts`.

Hasil ini disebut data transfer object atau DTO: data yang dibutuhkan UI dan boleh diterima pemanggil. Query memilih field satu per satu dan mengubah tanggal database menjadi string ISO. Contoh memakai klien bergaya Prisma dari `platform/database/client`.

Pemetaan hasil masih berada di dalam query. Kalau beberapa query memakai konversi yang sama, atau konversinya lebih mudah dibaca dalam modul sendiri, [pisahkan mapper `toOrderSummary`](#extract-a-dto-mapper-when-reads-share-the-conversion) ke `order.dto.ts`. Dengan atau tanpa file mapper, field hasil harus tetap aman untuk pemanggil. Schema Zod dan tipe hasil inferensi tetap di `model/` agar browser bisa memakainya tanpa mengimpor kode server.

`requireAccount` adalah operasi server publik dari membership. Tugasnya memverifikasi sesi dan menentukan akun yang boleh diakses. Query memanggilnya di dalam operasi supaya pemeriksaan berlaku bagi semua pemanggil. ID yang valid belum membuktikan hak akses. [Panduan perlindungan resource](./protected-resources) membahas penempatan pemeriksaan ini.

Modul query hanya berjalan di server, sehingga kredensial database dan implementasinya tidak masuk bundle browser. [Referensi Server Components React](https://react.dev/reference/rsc/server-components) menjelaskan pemisahan tersebut. Kalau query mengambil data dari layanan luar, parsing response dengan schema Zod sebelum memakai isinya.

### Pakai Server Actions untuk mutasi UI yang ditangani Next.js {#use-server-actions-for-ui-mutations-handled-by-next-js}

Form pembatalan bisa mengirim ke aplikasi Next.js ini, yang memeriksa hak akses, membatalkan pesanan, lalu memperbarui halaman. Server Action cocok untuk alur ini.

Di panduan ini, “Server Action” merujuk pada mekanisme Next.js untuk memanggil React Server Function dari action atau transition, misalnya saat form dikirim. Gunakan akhiran `.actions.ts` khusus untuk fungsi tersebut. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data)

Tambahkan schema input pembatalan ke file schema fitur yang sudah mengimpor Zod:

```ts
// src/features/orders/model/order.schema.ts
export const cancelOrderInputSchema = z.object({
  orderId: z.string().min(1),
})

export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>
```

Action memakai schema ini untuk parsing isi form sebelum memanggil use case. Sejak implementasi pertama, pemeriksaan pemilik pesanan, aturan pembatalan, dan update database berada dalam use case:

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

Tampilan detail memberikan ID dan status pesanan ke form. `canCancelOrder` memakai aturan murni bersama dari [contoh model](./folder-structure#extract-business-behavior-when-it-needs-its-own-module). Menyembunyikan tombol tidak mencegah orang mengirim request sendiri. Action tetap melakukan parsing ID yang dikirim. Lalu `cancelOrderUseCase` memverifikasi pemanggil, memvalidasi input-nya sendiri, serta memeriksa pemilik dan status terbaru di database. [Alur pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order) menunjukkan pemeriksaan tersebut beserta update yang menolak perubahan status bersamaan.

Form yang dirender oleh Server Component bisa dikirim sebelum JavaScript selesai dimuat, bahkan saat JavaScript dimatikan. Kalau perlu indikator pending, state optimistis, atau event handler, Client Component bisa mengimpor action dari file khusus `'use server'`. [Contoh Server Functions Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#server-components)

#### Perbarui halaman setelah mutasi berhasil {#update-the-screen-after-the-mutation-succeeds}

Setelah pembatalan berhasil, contoh memanggil [`refresh()`](https://nextjs.org/docs/app/api-reference/functions/refresh). Fungsi ini me-refresh router klien agar halaman bisa merender hasil terbaru dari query database langsung.

Kalau query pesanan kemudian memakai cache, refresh halaman saja tidak menginvalidasi data bertag. Action juga perlu merevalidasi data yang berubah. Pilih cara revalidasi yang sesuai dengan cache query tersebut. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#refresh-data)

Contoh di atas memperlihatkan alur berhasil. Untuk kegagalan yang sudah diperkirakan, seperti input tidak valid atau pesanan yang sudah tidak boleh dibatalkan, kembalikan hasil yang bisa ditampilkan form. Sesuaikan action untuk `useActionState` agar pesan dan indikator pending muncul dekat kontrolnya. [Panduan penanganan error Next.js](https://nextjs.org/docs/app/getting-started/error-handling#server-functions)

#### Periksa akses setiap kali Server Action dijalankan {#check-access-inside-every-server-action}

Server Functions bisa dipanggil lewat request POST langsung. Pemanggil tidak harus memakai form yang kamu render. [Panduan mutasi Next.js](https://nextjs.org/docs/app/getting-started/mutating-data#what-are-server-functions)

Setiap action harus melakukan pemeriksaan berikut, baik sendiri maupun melalui operasi yang dipanggilnya:

1. Verifikasi identitas pemanggil jika operasi membutuhkan akun.
2. Periksa izin terhadap resource yang dituju.
3. Validasi input dari luar dengan Zod.
4. Kembalikan hanya data yang boleh diterima pemanggil.
5. Simpan rahasia dan implementasi server dalam modul khusus server.

Field tersembunyi `orderId` tetap input pengguna. Periksa pemilik pesanan dan aturan pembatalan di server, meskipun UI hanya menampilkan tombol saat pesanan terlihat bisa dibatalkan.

#### Jangan gunakan Server Actions untuk query yang independen {#keep-independent-reads-out-of-server-actions}

Server Functions bisa mengembalikan data, tetapi Server Actions dirancang untuk mutasi dari UI. Next.js mengantrekan panggilan action. Kalau beberapa query independen memakai jalur ini, eksekusinya menjadi berurutan. [Panduan Backend for Frontend Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-actions)

Saat rendering server, panggil query fitur. Saat browser perlu meminta data, gunakan HTTP atau RPC.

### Ambil data dari browser saat interaksi memerlukannya {#fetch-from-the-browser-when-the-interaction-needs-it}

Beberapa tampilan masih membutuhkan data baru setelah render pertama:

- Hasil pencarian berubah saat pengguna mengetik.
- Status pesanan diperbarui selama halaman terbuka.
- Infinite scrolling memuat data berikutnya.
- Pagination mengganti isi daftar tanpa navigasi.
- Request bergantung pada input dari API browser.
- Beberapa komponen yang sedang tampil memakai cache data yang sama.

Untuk kebutuhan ini, browser harus bisa meminta data ke server melalui Route Handler, API luar, atau prosedur RPC.

Request sekali jalan bisa memakai `fetch` langsung. Tambahkan library query saat perlu mengatur cache, retry, refresh di latar belakang, atau request yang dipakai beberapa komponen.

#### Hubungkan request HTTP ke query fitur lewat Route Handler {#let-route-handlers-adapt-http-to-feature-queries}

[Route Handlers Next.js](https://nextjs.org/docs/app/getting-started/route-handlers) memakai API Web standar `Request` dan `Response`. Letakkan handler di `app`, lalu panggil query fitur dari sana:

```ts
// src/app/api/orders/route.ts
import { listOrders } from '@/features/orders/order.queries'

export async function GET() {
  const orders = await listOrders()

  return Response.json(orders)
}
```

Handler mengurus request dan response HTTP. Query memverifikasi sesi, membatasi data ke akun yang diizinkan, lalu mengembalikan ringkasan pesanan. Contoh ini hanya menunjukkan alur berhasil; ubah kegagalan autentikasi menjadi response error HTTP yang sesuai.

Pembagian tugasnya tetap sama saat menambah pagination. Handler membaca query string dan mengirim nilainya ke query fitur. Query memvalidasi input pagination sebelum menggunakannya.

Route Handler juga bisa melayani webhook, aplikasi mobile, integrasi luar, serta response berupa file atau feed. Batasi handler pada penghubung antara request, operasi fitur, dan response yang dibutuhkan klien.

### Sediakan mutasi API lewat Route Handler {#use-route-handlers-for-mutations-consumed-through-an-api}

Aplikasi mobile dan integrasi luar membutuhkan endpoint dengan format request dan response yang jelas. Route Handler memvalidasi input dengan Zod, lalu langsung mengimpor use case publik dari orders. Use case tersebut memverifikasi pemanggil di dalam operasinya:

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

Action dan handler sama-sama memanggil `cancelOrderUseCase`, sehingga aturan pemilik pesanan dan pembatalannya tetap sama. Responsnya mengikuti kebutuhan pemanggil: action me-refresh halaman, sedangkan handler mengembalikan response HTTP.

Use case berada di `cancel-order.use-case.ts` pada root fitur dan ditandai `import 'server-only'`. Operasi publik boleh berada satu folder dengan repository privat dan mapper internal. [Aturan import publik](./folder-structure#expose-the-operations-and-components-callers-need) menentukan ekspor mana yang boleh dipakai dari luar fitur.

Untuk kegagalan validasi, akses ditolak, atau pembatalan ditolak, tentukan status HTTP dan body response yang aman. Contoh berhasil di atas menganggap klien memakai sesi akun aplikasi. Sesuaikan autentikasi dengan klien API yang sebenarnya.

### Panggil API yang sudah ada untuk mutasi {#call-an-existing-api-for-mutations}

Backend yang sudah ada mungkin menyediakan pembatalan pesanan lewat HTTP atau RPC. Kalau API itu mendukung request browser dengan autentikasi, letakkan fungsi request di `order.api.ts`. Kamu bisa memakai jalur ini sebagai pengganti Server Action Next.js.

Pakai schema input pembatalan dari contoh sebelumnya. Fungsi request melakukan parsing input, lalu mengirimkannya ke API:

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

Contoh menganggap API memakai cookie sesi browser, mengizinkan request dengan kredensial dari frontend melalui CORS, dan mengembalikan `204 No Content` saat berhasil. API tetap harus memverifikasi pemanggil, memvalidasi input, serta memeriksa pemilik pesanan dan aturan pembatalan. Parsing di browser memberi umpan balik lebih awal kepada pengguna. [MDN: mengirim kredensial](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)

Komponen bisa memanggil fungsi request langsung dan menyimpan statusnya dalam state React:

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

[`useState`](https://react.dev/reference/react/useState) menyimpan status request komponen ini. Setelah berhasil, perbarui atau ambil ulang data pesanan lain yang ditampilkan komponen induk. Jalur ini tidak perlu file actions atau TanStack Query. Kalau nantinya memakai TanStack, [mutation options](#share-mutation-configuration-when-several-consumers-need-it) bisa memanggil fungsi `cancelOrder` yang sama.

Jika API luar membutuhkan private key, jalankan request di server dan sediakan operasinya lewat Server Action atau Route Handler. Kebutuhan kredensial menentukan di mana request boleh dijalankan. [Tanggung jawab server dan klien Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#when-to-use-server-and-client-components)

### Kirim data server ke komponen interaktif {#pass-server-data-into-client-interaction}

Komponen yang interaktif tidak otomatis perlu mengambil data sendiri. Server Component bisa mengirim DTO yang bisa diserialisasi ke Client Component:

```tsx
// Server Component
const order = await getOrderDetails({ accountId: account.id, orderId })
return <OrderEditor initialOrder={order} />
```

Server mendapatkan `account` dari request yang sudah diautentikasi. Cara ini cocok untuk editor yang memuat pesanan, lalu membiarkan pengguna mengubah field sebelum menyimpan. Tambahkan request browser kalau editor juga perlu mengambil data server terbaru selama masih terbuka.

Kamu juga bisa mengirim promise ke Client Component dan membacanya dengan [API `use` React](https://react.dev/reference/react/use). Suspense menampilkan fallback selama promise belum selesai:

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

Query mengambil dan memverifikasi akun sendiri. Panel hanya meneruskan promise ke komponen klien.

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

Untuk kebanyakan komponen, menunggu data lalu mengirimkannya lewat props sudah cukup. Mengirim promise berguna kalau bagian halaman lain bisa tampil lebih dulu sambil komponen ini menunggu. Pilih fallback yang menjelaskan bagian mana yang masih dimuat.

### Bagikan data ke komponen yang jauh di bawah {#share-data-with-deeply-nested-components}

Halaman orders mungkin meneruskan data pesanan lewat panel, tab, dan toolbar sebelum sampai ke badge status. Akibatnya, komponen perantara menerima prop `order` yang tidak mereka pakai sendiri.

Tetap mulai dengan pengambilan data di server untuk kebutuhan rendering. Cara membagikan hasilnya bergantung pada komponen yang memakainya dan apakah data perlu diperbarui setelah halaman dimuat.

#### Ambil data langsung di Server Component yang memerlukannya {#fetch-where-a-server-component-needs-the-data}

Server Component yang berada jauh di dalam pohon komponen boleh memanggil query fitur langsung. Halaman tidak harus mengambil semua data untuk seluruh turunannya.

Kalau beberapa Server Component membutuhkan query database yang sama, ekspor satu query bersama yang dibungkus `cache()` React:

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

Semua komponen mengimpor fungsi yang sama. Panggilan dengan ID akun dan pesanan yang sama memakai ulang hasil selama satu request server. Argumen berupa ID primitif juga menghindari cache miss karena objek input baru dibuat setiap kali memanggil fungsi. React menghapus memoization ini antar-request server. [Referensi `cache` React](https://react.dev/reference/react/cache)

Komponen mengirim ID pesanan dan akun yang diminta. Query di dalamnya tetap memverifikasi akun itu terhadap sesi aktif. Memoization tidak menggantikan pemeriksaan akses.

#### Gunakan context untuk berbagi data server di komponen klien {#use-context-when-client-descendants-share-server-provided-data}

Editor pesanan bisa memakai data awal yang sama di beberapa tab dan kontrol. Kalau semuanya cukup memakai hasil yang sudah dimuat tanpa refetch sendiri, bagikan DTO lewat context dalam fitur.

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

Server Component mengirim data yang sudah diperiksa hak aksesnya ke provider:

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

Client Component di bawahnya bisa langsung membaca nilai tersebut:

```tsx
// src/features/orders/ui/OrderStatusBadge.tsx
'use client'

import { useOrder } from './OrderProvider'

export function OrderStatusBadge() {
  const order = useOrder()
  return <span>{order.status}</span>
}
```

Dengan provider di sekitar editor, tab dan kontrol bisa membaca pesanan tanpa melewatkan prop melalui setiap komponen perantara. Context ini hanya bisa dibaca Client Component. Server Component yang dikirim sebagai children tetap menjadi Server Component, tetapi tidak bisa membaca nilai provider. [Context provider Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)

Provider membagikan data pesanan dari server. Perubahan form yang belum disimpan tetap masuk draft state editor. Context ini tidak menyediakan refetch atau invalidasi setelah mutasi. Kalau komponen mulai membutuhkan keduanya, gunakan [pendekatan TanStack Query di bawah](#use-tanstack-query-when-client-consumers-need-ongoing-updates).

Jika streaming membuat halaman lebih berguna saat data belum selesai dimuat, provider bisa menerima promise dari server. Komponen klien membacanya dengan `use()` React di dalam Suspense. Next.js memperlihatkan variasi ini dalam [contoh promise melalui context](https://nextjs.org/docs/app/guides/single-page-applications#using-reacts-use-within-a-context-provider).

### Verifikasi akun di dalam query detail {#verify-the-requested-account-in-a-detail-read}

Contoh detail menyertakan ID akun supaya cache browser untuk setiap akun terpisah. ID ini hanya menyatakan akun yang diminta; query tetap harus memeriksanya. Tambahkan input berikut ke file schema yang ada:

```ts
// src/features/orders/model/order.schema.ts
export const orderReferenceInputSchema = z.object({
  accountId: z.string().min(1),
  orderId: z.string().min(1),
})

export type OrderReferenceInput = z.infer<typeof orderReferenceInputSchema>
```

Tambahkan query detail ke modul query server yang sama. Pertahankan `listOrders` beserta import-nya, lalu tambahkan import schema berikut:

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

Contoh ini memakai satu konteks akun yang diizinkan per request. Membership menentukan cara memilih dan memverifikasi akun tersebut. Halaman, handler HTTP, dan prosedur RPC boleh memanggil query ini, tetapi tidak bisa memberi akses hanya dengan mengirim ID akun lain. Ubah kegagalan yang sudah diperkirakan menjadi respons yang sesuai bagi masing-masing pemanggil.

### Pisahkan mapper DTO saat beberapa query memakai konversi yang sama {#extract-a-dto-mapper-when-reads-share-the-conversion}

`order.dto.ts` tidak wajib ada sejak awal. Biarkan pemetaan singkat berada dalam query sampai ada kebutuhan untuk berbagi konversi atau memisahkannya agar lebih mudah dibaca. Query daftar dan detail di atas memilih field yang sama dan mengubah tanggal dengan cara yang sama, sehingga bisa memakai satu mapper:

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

Parameter mapper berisi field database yang dipilih, termasuk nilai `Date`. Hasilnya mengikuti `orderSummarySchema`, dengan `createdAt` berupa string. Simpan schema dan tipe `OrderSummary` hasil inferensi di `model/` agar Client Component bisa memakainya tanpa mengimpor mapper server.

Di `order.queries.ts`, ganti import langsung `orderSummarySchema` dengan `toOrderSummary`. Query daftar menjadi:

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

Query detail dan import schema input-nya tetap di modul yang sama. Pertahankan pemeriksaan akun, batas query database, dan penanganan pesanan yang tidak ditemukan. Ganti bagian pemetaan hasilnya dengan:

```ts
return toOrderSummary(row)
```

Query tetap memeriksa akses dan memilih field yang diizinkan. Mapper hanya mengonversi serta memvalidasi field itu. Ia tidak mengambil data atau memeriksa hak akses. Biarkan mapper privat dalam fitur; route, prosedur RPC, dan fitur lain tetap memakai query publik.

### Jalankan query yang independen bersamaan {#start-independent-reads-together}

Dua query yang tidak saling bergantung bisa dimulai bersamaan. Masing-masing tetap memverifikasi pemanggil di dalam operasinya. Menunggu query pertama selesai sebelum memulai yang kedua hanya menambah waktu tunggu.

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

Kalau satu query lambat sementara bagian halaman lain sudah berguna tanpa hasilnya, pindahkan query tersebut ke Server Component async yang lebih kecil di dalam `<Suspense>`. Bagian lain bisa tampil sambil menunggu data. [Panduan streaming Next.js](https://nextjs.org/docs/app/getting-started/fetching-data#streaming)

## React Query {#react-query}

### Pakai TanStack Query untuk cache dan pembaruan di browser {#add-tanstack-query-for-caching-and-background-updates}

Gunakan [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) saat halaman pesanan perlu refetch di latar belakang, retry saat request gagal, atau berbagi data dengan komponen lain yang sedang tampil. Library ini mengelola status request dan cache data server di browser.

Untuk request browser ke API HTTP aplikasi ini, simpan fungsinya di `order.api.ts`:

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

Request API yang berkaitan boleh berada di file yang sama. Ekspor konfigurasi TanStack dari `order.query-options.ts`. Helper [`queryOptions`](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) menyatukan key, fungsi request, dan pengaturan cache sambil mempertahankan inferensi tipe:

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

Tampilan detail ini memakai empat field dari `OrderSummary`. Contoh menganggap endpoint tersedia di `/api/accounts/[accountId]/orders/[orderId]`. Handler mengirim ID akun dan pesanan ke `getOrderDetails`, lalu menyusun response. Query memverifikasi sesi, menolak akun yang tidak cocok, membatasi pencarian pada kedua ID, dan mengembalikan DTO yang sama.

ID akun membedakan entri cache, tetapi tidak membuktikan hak akses. Masukkan semua input yang memengaruhi hasil ke dalam [query key](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys). Hapus data akun saat sesi berakhir dan pastikan pergantian akun tidak memakai cache akun sebelumnya.

Komponen bisa memakai options langsung:

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

Contoh ini menganggap `QueryClientProvider` sudah dipasang. Buat custom hook kalau ada perilaku React lain yang perlu diatur bersama query. Options tetap bisa dipakai komponen, operasi cache, dan kode rendering server tanpa memanggil hook.

Bedakan tugas ketiga file: `order.queries.ts` menjalankan query server, `order.api.ts` mengirim request HTTP, dan `order.query-options.ts` membuat konfigurasi. Memanggil factory options belum mengirim request. Modul API dan options harus bebas import khusus server. Jangan beri `'use client'` kalau Server Component perlu memanggil factory options tersebut.

### Pisahkan konfigurasi mutasi saat dipakai beberapa komponen {#share-mutation-configuration-when-several-consumers-need-it}

Form bisa memanggil Server Action langsung. Kalau UI membutuhkan state mutasi TanStack, `mutationFn` bisa memanggil Server Action, endpoint HTTP, atau prosedur RPC. Setelah berhasil, perbarui atau invalidasi query klien yang terpengaruh supaya komponen mendapat data terbaru. [Invalidasi dari mutasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Konfigurasi mutasi yang hanya dipakai satu komponen cukup disimpan di sana. Saat beberapa pemakai membutuhkan konfigurasi sama, pisahkan ke factory options. Untuk [pembatalan lewat API luar](#call-an-existing-api-for-mutations), gunakan fungsi request yang sudah ada:

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

Factory ini dan tombol React biasa memakai request API yang sama. Dengan `useMutation(cancelOrderOptions())`, komponen mengirim `{ orderId }` ke `mutate`, lalu menambahkan `onSuccess` untuk menginvalidasi query pesanan akun terkait. Navigasi dan notifikasi tetap di komponen karena mengikuti kebutuhan tampilan setelah pembatalan. [Contoh mutation options](https://tanstack.com/query/latest/docs/framework/react/typescript#typing-mutation-options) TanStack juga menunjukkan pemakaian factory untuk komponen yang memantau status mutasi.

Jika UI memakai Server Action, `mutationFn` bisa menunjuk ekspor dari `order.actions.ts`. Action dalam panduan ini menerima `FormData`, jadi versi tersebut juga mengirim `FormData` ke `mutate`. Impor dari file khusus `'use server'` agar Next.js menyediakan fungsi yang bisa dipanggil klien. [Server Functions Next.js dalam Client Components](https://nextjs.org/docs/app/api-reference/directives/use-server#using-server-functions-in-a-client-component)

`order.mutation-options.ts` tetap opsional. Kode server cukup memanggil operasi fitur langsung untuk mengubah data.

### Pakai cache query bersama untuk data klien yang terus berubah {#use-tanstack-query-when-client-consumers-need-ongoing-updates}

Setelah pesanan dibatalkan, badge status, panel detail, dan kontrol pembatalan perlu menampilkan keadaan yang sama. TanStack Query cocok saat beberapa komponen klien harus berbagi data server dan terus mengikuti perubahannya.

Semua pemakai membaca query yang sama dari QueryClient yang sama. Update atau invalidasi setelah pembatalan membuat komponen-komponen tersebut mendapat perubahan data. Kalau kamu juga membutuhkan prosedur bertipe dan options request hasil generasi, oRPC menyediakan [integrasi TanStack Query](https://orpc.dev/docs/integrations/tanstack-query) yang dibahas setelah ini.

Data awal tetap bisa diambil lewat Server Component. Isi cache query di server, lalu lakukan hydration di sekitar bagian UI klien seperti pada [contoh prefetch](#prefetch-when-the-client-needs-the-same-data-afterward):

```text
Server Component → query fitur → cache query hasil hydration
                                      ↓
                           konsumen klien bersarang
                                      ↓
                           mutasi → invalidasi query
```

Badge dan panel detail harus membaca nilai dari cache klien tersebut. Salinan status yang dirender terpisah oleh Server Component tidak ikut berubah saat browser melakukan refetch. Kalau keduanya ditampilkan, statusnya bisa berbeda. Contoh prefetch di bawah menunjukkan cara memasok data awal ke cache saat rendering server. [Rendering server dan kepemilikan data TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

Untuk dashboard interaktif, utamakan TanStack Query bagi data browser yang berubah lewat filter, polling, atau mutasi. Pilih klien API sesuai backend. Untuk Elysia, [Eden Fetch](https://elysiajs.com/eden/fetch) mengambil tipe request dan response dari tipe aplikasi yang diekspor backend. Simpan request tersebut di modul `.api.ts` fitur dan panggil dari query options; React Query tetap mengurus cache hasil dan status request. [Contoh dashboard HTTP](./examples) menunjukkan susunan ini.

### Isi cache dari server jika browser masih memakai data setelah render {#prefetch-when-the-client-needs-the-same-data-afterward}

Halaman pesanan bisa membutuhkan data saat rendering server, lalu terus memperbaruinya di browser. Panggil query server fitur dan simpan hasilnya dengan key dari options bersama:

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

Cara ini bisa menggantikan halaman yang merender DTO langsung. Contoh membuat QueryClient untuk render server ini, menjalankan query langsung, lalu menyimpan hasil lewat [`setQueryData`](https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata). `dehydrate` dan `HydrationBoundary` memindahkan hasil ke cache klien. Aplikasi tetap perlu memasang provider. [Rendering server lanjutan TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

Server dan browser memakai identitas query serta bentuk hasil yang sama. Server tidak menjalankan fungsi fetch URL relatif dari options; ia memanggil query fitur langsung. Factory options lengkap juga bisa dipakai di kedua lingkungan jika fungsi request dan autentikasinya mendukung keduanya. Untuk data aplikasi sendiri, pertahankan pemanggilan langsung dari server. [Pengambilan data server Next.js](https://nextjs.org/docs/app/guides/backend-for-frontend#server-components)

`staleTime` menentukan berapa lama TanStack Query menganggap data masih baru, sehingga hydration tidak langsung memicu request berikutnya. Pilih nilainya sesuai kebutuhan tampilan. Di server, buat QueryClient terpisah untuk setiap request seperti dalam contoh.

Setelah hydration, cache klien menjadi sumber data pesanan yang ditampilkan dan diperbarui. Status yang dirender terpisah dalam Server Component tidak ikut diperbarui oleh refetch browser. Tentukan komponen mana yang menampilkan setiap nilai sebelum memasang kedua versi di halaman yang sama. [Kepemilikan data dan revalidasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#data-ownership-and-revalidation)

Kalau halaman hanya membutuhkan data untuk render, query Server Component sudah cukup. Tambahkan cache dan hydration saat interaksi browser terus memakai data itu setelah render awal.

## oRPC + React Query {#orpc-react-query}

### Tambahkan oRPC jika prosedur bersama cocok untuk API {#add-orpc-when-callers-need-a-shared-typed-api}

Beberapa tampilan interaktif bisa memanggil operasi pesanan yang sama. Input, tipe response, dan penanganan error perlu tetap konsisten di semua pemanggil.

Gunakan oRPC saat kamu ingin mendefinisikan API sebagai prosedur bertipe yang dipakai bersama, dengan middleware bersama dan options React Query hasil generasi. Fitur mendefinisikan prosedur operasinya, lalu aplikasi menyediakannya lewat adapter HTTP. Browser memanggil prosedur melalui klien bertipe, sehingga TypeScript bisa memeriksa input dan hasilnya. Klien HTTP seperti Eden Fetch sudah bisa menyediakan request bertipe; pilih oRPC jika model prosedurnya cocok dengan cara kamu menyediakan operasi fitur.

oRPC mendefinisikan operasi API dan membawa tipe input serta hasilnya ke klien. TanStack Query mengurus cache, status request, dan refetch. Klien oRPC bisa dipanggil langsung untuk request sekali jalan; gunakan [integrasi TanStack Query](https://orpc.dev/docs/integrations/tanstack-query) jika browser membutuhkan pengelolaan data tersebut.

Query detail pesanan mengikuti alur ini:

```text
Client Component → TanStack Query → klien oRPC → adapter HTTP Next.js
  → prosedur detail pesanan → query fitur
```

Contoh berikut memakai query pesanan, use case pembatalan, dan schema yang sudah dibahas. Ikuti [panduan instalasi resmi](https://orpc.dev/docs/getting-started#installation) untuk paket oRPC. Provider TanStack Query tetap diperlukan.

#### Hubungkan request orders ke operasi fitur yang sudah ada {#adapt-order-requests-to-the-existing-feature-operations}

Kedua prosedur menerima identitas pesanan dalam satu akun. Pakai `orderReferenceInputSchema` dari [query detail](#verify-the-requested-account-in-a-detail-read). Browser mengirim `accountId` supaya identitas query mencakup akun yang dipilih. Server tetap memeriksa akun itu terhadap request yang sudah diautentikasi.

Letakkan prosedur di samping operasi server yang dipanggilnya:

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

Prosedur dasar memvalidasi input, mengambil akun dari request, dan menolak ID akun yang berbeda. Middleware mengirim akun yang sudah diverifikasi ke setiap handler. [Middleware oRPC](https://orpc.dev/docs/middleware#middleware-input)

Contoh menganggap `requireAccount` menolak panggilan API tanpa autentikasi, tanpa redirect ke halaman login. Ubah kegagalan autentikasi menjadi error oRPC `UNAUTHORIZED` saat request masuk lewat API. Query dan use case tetap memverifikasi akun sendiri agar panggilan server langsung mendapat perlindungan yang sama. Query membatasi data ke akun yang diminta. Use case memeriksa pemilik, aturan pembatalan, dan perubahan status bersamaan seperti pada [alur pembatalan](./folder-structure#follow-a-cancellation-from-the-form-to-the-stored-order).

Query mengembalikan DTO `OrderSummary` yang sudah ada. Pembatalan tidak mengembalikan data. UI di bawah memakai pesan error umum. Jika pengguna membutuhkan petunjuk untuk mengatasi kegagalan tertentu, petakan kegagalan fitur yang dikenal ke error oRPC yang sesuai. Pastikan pesan dan data error aman diterima pemanggil. Tipe error khusus oRPC tetap di luar aturan bisnis murni. [Penanganan error oRPC](https://orpc.dev/docs/error-handling)

#### Pasang prosedur dan sambungkan klien {#mount-the-procedures-and-connect-the-client}

Susun router API aplikasi dari ekspor fitur:

```ts
// src/app/api/rpc/router.ts
import 'server-only'
import { orderRouter } from '@/features/orders/order.rpc'

export const router = { orders: orderRouter }
```

Pasang router lewat Route Handler catch-all agar path prosedur bertingkat bisa mencapai adapter:

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

Route menghubungkan HTTP ke router tersebut. Operasi orders tetap dikerjakan di fitur. Lihat konfigurasi transport dalam [adapter Next.js oRPC](https://orpc.dev/docs/adapters/next).

Simpan link HTTP bersama di `platform`. Modul ini tidak mengimpor fitur:

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

Link mengirim request browser ke origin yang sama dengan memakai cookie sesi aplikasi. URL-nya mengikuti prefix handler. Jika deployment memakai `basePath` Next.js, sertakan prefix itu dalam URL browser.

Fitur orders menyediakan klien bertipe dan utilitas query-nya:

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

Key `orders` mengikuti router aplikasi. Klien ini hanya mengenali prosedur orders. Import dari modul server hanya mengambil tipe, sehingga implementasi prosedur tidak masuk bundle browser. oRPC mendukung tipe klien yang diturunkan dari router server. [Setup klien oRPC](https://orpc.dev/docs/client/client-side#setup)

Pembagian file-nya seperti ini:

| File | Tugas |
| --- | --- |
| `features/orders/model/order.schema.ts` | Schema input bersama dan DTO |
| `features/orders/order.rpc.ts` | Prosedur yang memverifikasi pemanggil, memvalidasi input, dan memanggil operasi fitur |
| `app/api/rpc/router.ts` | Menyusun prosedur fitur menjadi API aplikasi |
| `app/api/rpc/[...rest]/route.ts` | Menyediakan API lewat HTTP |
| `platform/rpc/client.ts` | Transport browser yang dipakai bersama |
| `features/orders/order.rpc-client.ts` | Klien orders bertipe dan utilitas TanStack Query |

Browser ikut memakai file schema, jadi file itu harus bebas dependensi khusus server. Kode server di fitur lain tetap bisa memanggil query dan use case publik langsung. Menambah API tidak membuat repository atau mapper internal menjadi publik. Keduanya tetap diakses melalui operasi fitur sesuai [aturan dependensi folder](./folder-structure#keep-operation-modules-at-the-feature-root).

#### Pakai query options yang dihasilkan oRPC {#read-through-generated-query-options}

Sebelumnya, factory options menentukan request HTTP dan query key secara manual. oRPC bisa menghasilkan keduanya. Factory sekarang cukup menyimpan pengaturan kesegaran data yang dipakai bersama:

```ts
// src/features/orders/order.query-options.ts
import { orpc } from './order.rpc-client'
import type { OrderReferenceInput } from './model/order.schema'

export function orderDetailsOptions(input: OrderReferenceInput) {
  return orpc.orders.details.queryOptions({ input, staleTime: 60_000 })
}
```

`LiveOrderDetails` tetap memanggil `useQuery(orderDetailsOptions(input))` dan menampilkan loading, error, atau data. Fungsi request dan query key sekarang disediakan oRPC. Jalur ini tidak perlu wrapper `order.api.ts`.

File `order.query-options.ts` masih berguna karena menyimpan `staleTime` bersama. Kalau query hanya dipakai satu komponen tanpa konfigurasi bersama, panggil `orpc.orders.details.queryOptions({ input })` langsung dari komponen. Integrasi ini juga menyediakan mutation options dan helper key. [Integrasi TanStack Query oRPC](https://orpc.dev/docs/integrations/tanstack-query)

#### Batalkan pesanan, lalu invalidasi query yang terpengaruh {#cancel-the-order-and-invalidate-affected-reads}

Kontrol pembatalan memanggil prosedur. Setelah update berhasil, kontrol menginvalidasi query pesanan:

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

Komponen ini menggantikan tombol API sebelumnya. Tampilkan untuk pesanan yang masih boleh dibatalkan. Jika halaman bisa berganti pesanan tanpa melepas kontrol, beri key dari ID akun dan pesanan. Use case tetap memeriksa status terbaru di database setiap kali dipanggil.

`orpc.orders.key()` mencocokkan query di bawah router orders, termasuk detail dan prosedur daftar yang ditambahkan ke router itu. Contoh sengaja menginvalidasi semua query pesanan dalam cache; query aktif yang cocok akan melakukan refetch. Persempit pilihan query saat cache membesar. Dengan menunggu invalidasi selesai, status mutasi tetap pending sampai refetch selesai. [Invalidasi mutasi TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

Mutation options hasil generasi tidak otomatis tahu query mana yang berubah. Kamu tetap harus memilih key yang terpengaruh. Key oRPC juga berbeda dari key manual `['orders', ...]` sebelumnya, jadi migrasikan prefetch, update cache, dan invalidasi bersama-sama. Query HTTP yang masih memakai key manual perlu invalidasi sendiri.

Karena baru dipakai satu kontrol, konfigurasi mutasi tetap di komponen. Pisahkan ke `order.mutation-options.ts` saat beberapa pemakai membutuhkannya. Jika mutasi juga mengubah data yang di-cache untuk render server, revalidasi cache tersebut secara terpisah. Invalidasi TanStack hanya mengurus cache query klien.

#### Tetap panggil query langsung saat rendering server {#keep-server-rendering-on-a-direct-path}

Untuk Server Component, utamakan query fitur langsung. [Contoh hydration](#prefetch-when-the-client-needs-the-same-data-afterward) tetap berlaku dengan `orderDetailsOptions` yang baru: ambil data lewat `getOrderDetails`, lalu simpan DTO dengan query key hasil generasi sebelum menjalankan dehydrate.

Membuat query options belum mengirim request. Factory URL pada link baru dijalankan saat prosedur dipanggil. Jadi, server bisa memakai key tanpa menjalankan transport browser. Untuk mendukung penggunaan ini, jangan pasang `'use client'` pada modul klien dan options.

Kalau kode server membutuhkan validasi dan middleware prosedur, gunakan `call` atau `createRouterClient` oRPC untuk memanggilnya langsung di server. Sertakan konteks request terautentikasi yang dibutuhkan prosedur. Cara ini tidak perlu request HTTP ke API aplikasi sendiri. [Klien sisi server oRPC](https://orpc.dev/docs/client/server-side)

oRPC menambah prosedur dan konfigurasi transport yang perlu dirawat. Gunakan saat panggilan browser bertipe dan perilaku API bersama memang diperlukan. Halaman yang cukup memakai query server langsung bisa tetap memanggil query fitur.

## Memilih pendekatan {#choosing-an-approach}

### Tentukan strategi data untuk proyek {#choose-a-project-wide-data-strategy}

Kalau setiap fitur memilih klien request dan aturan cache sendiri, developer harus mempelajari alur baru setiap berpindah fitur. Tetapkan strategi awal proyek dan pakai pola yang sama untuk operasi yang sejenis.

| Strategi | Cocok ketika | Contoh aplikasi | Yang perlu dirawat |
| --- | --- | --- | --- |
| **Next.js native** | Sebagian besar interaksi cukup dengan data dari server dan pengiriman form. | Situs konten, portal pelanggan, atau alat internal dengan form sederhana. | Query fitur, Server Actions, dan endpoint HTTP yang diperlukan. |
| **Next.js + React Query** | Browser perlu cache bersama, polling, refresh di latar belakang, atau update optimistis. | Dashboard operasional yang memanggil API HTTP lewat fetch atau klien bertipe seperti Eden Fetch. | Query key, update cache, dan fungsi request API. |
| **Next.js + React Query + oRPC** | Kamu mengendalikan API dan ingin memakai prosedur bersama, middleware bersama, serta query options hasil generasi. | Produk dengan aplikasi web dan mobile yang memakai operasi bisnis sama. | Kontrak prosedur, konteks request, transport, dan aturan cache klien. |

Pilih berdasarkan kebutuhan aplikasi dan backend yang tersedia. Proyek besar pun bisa cukup memakai API native Next.js. Kebutuhan pembaruan di browser atau API bersama lebih menentukan daripada ukuran proyek semata.

React Query mengurus cache data server dan status request di klien. oRPC menyediakan operasi bertipe yang terhubung ke options React Query. Keduanya bisa dipakai bersama rendering server Next.js. [Panduan rendering server TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), [integrasi oRPC](https://orpc.dev/docs/integrations/tanstack-query)

### Pakai strategi yang sama untuk kebutuhan yang sama {#apply-the-strategy-consistently}

Memilih library belum menyelesaikan semua keputusan. Tentukan juga cara mengambil data di server dan browser, mengirim mutasi, serta memperbarui data setelahnya.

Misalnya, proyek yang memilih **React Query + oRPC** bisa memakai aturan ini:

| Operasi | Pilihan awal proyek |
| --- | --- |
| Mengambil data saat rendering server | Panggil query server fitur langsung. |
| Mengambil data yang terus diperbarui di browser | Pakai React Query dengan query options oRPC. |
| Mengirim mutasi dari browser | Pakai React Query dengan mutation options oRPC. Prosedur memanggil use case fitur. |
| Memperbarui browser setelah mutasi | Invalidasi atau update query klien terkait. Revalidasi cache server secara terpisah jika ikut terpengaruh. |
| Menerima webhook | Pakai Route Handler yang memvalidasi request dan memanggil operasi fitur. |

Dengan pembagian ini, kontributor tahu jalur yang harus diikuti saat menambahkan operasi serupa di fitur lain.

Gunakan [tabel pilihan operasi](#choose-the-default-that-matches-the-caller) sesuai strategi proyek. Kalau kebutuhan baru memang memerlukan library atau transport lain, perbarui strategi dan catat bagian mana yang memakai pendekatan tersebut.

### Pilih jalur data dari kebutuhan operasinya {#choose-the-data-path-from-the-operation}

Sebelum menambahkan query atau mutasi, jawab tiga pertanyaan:

1. **Apa yang dikerjakan?** Query mengambil data. Mutasi mengubah state aplikasi atau memicu efek.
2. **Siapa yang memanggil?** Server Component, kode browser, aplikasi mobile, atau integrasi luar?
3. **Apa yang dibutuhkan setelahnya?** Satu hasil, halaman yang diperbarui, atau data yang terus berubah lewat polling, refresh di latar belakang, dan cache bersama?

Mengubah filter, halaman, atau parameter pencarian biasanya hanya memilih data lain untuk dibaca. Bedakan query dan mutasi dari dampaknya terhadap state aplikasi. Membuka menu atau mengedit field yang belum disimpan cukup ditangani state komponen.

### Sesuaikan jalur dengan pemanggilnya {#choose-the-default-that-matches-the-caller}

Terapkan [strategi proyek](#choose-a-project-wide-data-strategy) pada masing-masing pemanggil. Operasi sejenis di fitur berbeda sebaiknya mengikuti cara request dan caching yang sama.

| Kebutuhan | Jalur yang dipakai | Pendukung |
| --- | --- | --- |
| Server Component mengambil data untuk render | Query fitur langsung, dekat komponen yang membutuhkan | `cache()` React untuk query database berulang dalam satu request |
| Client Component membutuhkan data awal | Props yang bisa diserialisasi dari server | Promise dan `use()` jika streaming membantu halaman tampil lebih cepat |
| Komponen klien yang jauh di bawah memakai data awal yang sama | Context dalam fitur | Draft state untuk perubahan yang belum disimpan |
| Browser meminta data | Klien HTTP/RPC proyek, lewat TanStack Query jika itu pilihan proyek | Indikator loading dan error |
| Beberapa komponen klien perlu data bersama yang terus diperbarui | TanStack Query dengan klien HTTP/RPC proyek | Pengambilan data server dan hydration untuk render awal |
| Form atau kontrol mengirim mutasi ke aplikasi Next.js ini | Server Action, HTTP, atau RPC sesuai strategi proyek; semuanya memanggil use case fitur | Status pending, pesan kegagalan yang sudah diperkirakan, dan pembaruan data terkait |
| UI mengirim mutasi ke API yang sudah ada | Klien API tersebut, lewat TanStack Query jika itu pilihan proyek | Status mutasi dan pembaruan data terkait |
| Aplikasi mobile atau integrasi luar menjalankan mutasi | Endpoint HTTP atau prosedur RPC proyek yang memanggil use case fitur | Autentikasi dan response sesuai klien |
| Webhook mengirim event | Route Handler yang memvalidasi event dan memanggil operasi fitur | Response sesuai protokol provider |
| Interaksi hanya mengubah UI lokal | State komponen | Library state jika beberapa bagian klien perlu mengatur state bersama |

Selanjutnya: [periksa akses pada setiap query dan mutasi fitur](./protected-resources).
