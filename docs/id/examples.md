---
title: Contoh Aplikasi
description: Jalankan salah satu contoh, lalu ikuti alur request dari UI sampai ke database.
---

# Contoh Aplikasi

Pilih contoh yang kebutuhannya paling dekat dengan aplikasimu. Setelah berjalan di lokal, ikuti satu request dari UI sampai datanya tersimpan. Dari situ, kamu bisa melihat hubungan antara route, kode fitur, dan database.

## Pilih contoh {#choose-an-example}

| Aplikasi | Yang bisa dipelajari | Source dan cara menjalankan |
| --- | --- | --- |
| Portal pesanan pelanggan | Halaman dan form dengan query server serta Server Actions bawaan Next.js. | [Next.js native](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/next-native) |
| Dashboard pengiriman | Antrean polling dengan React Query, Eden Fetch, dan backend Elysia terpisah dalam workspace Turborepo. | [React Query + HTTP](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-http) |
| Pemesanan B2B | Operasi API dengan tipe input dan hasil yang dipakai bersama oleh browser dan klien command-line. | [React Query + oRPC](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-orpc) |

Mulai dari portal pelanggan kalau kebutuhan utamanya halaman dan form. Pilih dashboard kalau browser perlu terus mengambil pembaruan dari layanan HTTP. Contoh B2B cocok untuk mempelajari API bertipe yang dipakai beberapa klien. Alasannya dijelaskan dalam [panduan pengambilan data](./data-fetching-and-mutation#choose-the-default-that-matches-the-caller).

Dashboard menempatkan Next.js di `apps/web`, Elysia di `apps/api`, dan schema bersama di `packages/contracts`. [Eden Fetch](https://elysiajs.com/eden/fetch) memeriksa tipe request berdasarkan route Elysia, sementara React Query mengelola polling dan cache hasilnya. [Turborepo](https://turborepo.dev/docs/core-concepts/internal-packages) mengatur task antar-package. Mutasi dari browser melewati Next.js agar cache server bisa diinvalidasi sebelum respons dikirim.

## Jalankan di lokal {#run-it-locally}

README tiap contoh berisi perintah setup dan akun demo. Siapkan Bun 1.4.0, Docker Compose, serta Node.js 22 atau lebih baru untuk menjalankan alat pengujian. Instal dependensi dari folder contoh yang dipilih. Instalasi di root repositori hanya untuk situs dokumentasi.

Masing-masing aplikasi punya database PostgreSQL, port, dan test sendiri. Proses pengiriman barang disimulasikan, jadi tidak perlu kredensial layanan luar atau setup pembayaran. Contoh ini belum mencakup registrasi publik, pengiriman email, dan hosting produksi.

## Ikuti satu request {#follow-one-request}

Ketiga aplikasi memakai pembagian yang sama: route di `app`, aturan bisnis di `features`, setup integrasi di `platform`, dan kode umum di `shared`. Aturan dependensinya ada di [panduan struktur folder](./folder-structure).

Pilih salah satu alur berikut:

- **Portal pelanggan:** ikuti `checkout.actions.ts` ke `create-order.use-case.ts`. Server mengambil harga produk lalu menyimpan pesanan.
- **Dashboard pengiriman:** mulai dari `apps/web/src/features/fulfillment/fulfillment.api.ts`, lalu buka `apps/api/src/features/fulfillment`. Sebelum mengubah pengiriman, backend memeriksa gudang yang boleh diakses operator.
- **Pemesanan B2B:** ikuti `order.rpc.ts` ke `decide-order.use-case.ts`. Use case memeriksa keanggotaan perusahaan, izin approver, dan status pesanan.

Untuk melihat pemeriksaan akses yang dipakai bersama, buka [query pesanan](https://github.com/ishk-sftckz/RFAStack/blob/main/examples/next-native/src/features/orders/order.queries.ts) di portal pelanggan. Query daftar, detail, dan pengiriman berada dalam satu file. Semuanya memakai `withMembership` dari modul query membership, sehingga pemeriksaan keanggotaan tetap dijalankan pada setiap operasi. [Contoh wrapper membership](./folder-structure#share-membership-checks-through-the-query-module) membahas polanya.

Coba ubah aturan bisnis di fitur terkait, lalu jalankan test contoh itu. README-nya juga menjelaskan cara mengamati cache setelah data berubah. Untuk memahami apa yang perlu diperiksa, lanjutkan ke [perlindungan resource](./protected-resources) dan [caching](./caching).
