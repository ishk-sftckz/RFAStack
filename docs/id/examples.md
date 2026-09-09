---
title: Contoh Aplikasi
description: Pilih aplikasi, jalankan secara lokal, lalu telusuri request melalui kode fiturnya.
---

# Contoh Aplikasi

Contoh aplikasi menunjukkan bagaimana route, kode fitur, dan database bekerja bersama. Pilih aplikasi yang paling dekat dengan kebutuhan Anda, jalankan secara lokal, lalu telusuri request dari UI sampai hasilnya tersimpan.

## Pilih contoh {#choose-an-example}

| Aplikasi | Pelajari | Kode sumber dan penyiapan |
| --- | --- | --- |
| Portal pesanan pelanggan | Halaman yang dirender di server dan formulir dengan query serta Server Actions bawaan Next.js. | [Next.js native](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/next-native) |
| Dashboard pemenuhan pesanan | Antrean dengan polling menggunakan React Query dan backend terpisah melalui HTTP. | [React Query + HTTP](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-http) |
| Pemesanan B2B | Operasi bertipe yang digunakan bersama oleh browser dan klien command-line. | [React Query + oRPC](https://github.com/ishk-sftckz/RFAStack/tree/main/examples/react-query-orpc) |

Mulai dari portal pelanggan untuk halaman dan formulir. Gunakan dashboard ketika browser membutuhkan pembaruan berkelanjutan dari layanan HTTP, atau pemesanan B2B ketika Anda ingin berbagi API bertipe antarklien. [Panduan pengambilan data](./data-fetching-and-mutation#choose-the-default-that-matches-the-caller) menjelaskan pilihan tersebut.

## Jalankan secara lokal {#run-it-locally}

Buka README contoh yang dipilih untuk melihat perintah penyiapan dan akun demo. Anda membutuhkan Bun 1.4.0, Docker Compose, serta Node.js 22 atau lebih baru untuk alat pengujian. Instal dependensi di dalam contoh tersebut; instalasi di root hanya mencakup situs dokumentasi.

Setiap aplikasi memiliki database PostgreSQL, port, dan pengujiannya sendiri. Pengiriman disimulasikan, jadi Anda tidak membutuhkan kredensial eksternal atau penyiapan pembayaran. Contoh ini tidak mencakup pendaftaran publik, pengiriman email, dan hosting produksi.

## Telusuri satu request {#follow-one-request}

Setiap aplikasi menempatkan route di `app`, aturan bisnis di `features`, penyiapan integrasi di `platform`, dan kode generik di `shared`. Lihat [panduan struktur folder](./folder-structure) untuk aturan dependensinya.

Pilih satu alur untuk ditelusuri:

- **Portal pelanggan:** ikuti `checkout.actions.ts` ke `create-order.use-case.ts`. Server membaca harga produk dan menyimpan pesanan.
- **Dashboard pemenuhan pesanan:** mulai dari `fulfillment.api.ts`, lalu buka `backend/features/fulfillment`. Backend memeriksa gudang operator sebelum mengubah pengiriman.
- **Pemesanan B2B:** ikuti `order.rpc.ts` ke `decide-order.use-case.ts`. Use case memeriksa keanggotaan perusahaan, izin pemberi persetujuan, dan status pesanan.

Untuk menelusuri otorisasi bersama, buka [query pesanan](https://github.com/ishk-sftckz/RFAStack/blob/main/examples/next-native/src/features/orders/order.queries.ts) pada portal pelanggan. Pembacaan daftar, detail, dan pengiriman berada dalam satu file dan menggunakan `withMembership` dari modul query keanggotaan. [Contoh wrapper keanggotaan](./folder-structure#share-membership-checks-through-the-query-module) menjelaskan cara pemeriksaan itu tetap melekat pada setiap operasi.

Ubah aturan di fitur pemiliknya, lalu jalankan pemeriksaan contoh tersebut. Setiap README memuat perintah pengujian dan cara mengamati pembacaan cache setelah penulisan. Untuk memahami alasan di balik pemeriksaan itu, baca [perlindungan resource](./protected-resources) dan [caching](./caching).
