---
title: Latar Belakang & Motivasi
description: Mengapa aplikasi full-stack Next.js membutuhkan aturan bersama untuk penempatan kode dan kerja antarbagian.
---

# Latar Belakang & Motivasi

Aplikasi Next.js jarang menjadi sulit dirawat dalam semalam. Biasanya, ini terjadi karena jalan pintas yang satu per satu terasa masuk akal, sampai akhirnya tidak ada yang yakin di mana logika bisnis seharusnya berada atau apa yang bisa rusak akibat perubahan kecil. RFAStack memberi Anda arsitektur dengan pilihan yang tegas untuk diikuti sebelum basis kode mencapai titik itu.

## Next.js menyerahkan sebagian keputusan kepada aplikasi Anda {#next-js-leaves-some-decisions-to-your-application}

[React](https://react.dev/) menyediakan komponen dasar untuk membangun antarmuka pengguna. [Next.js](https://nextjs.org/docs/app) menambahkan routing, rendering, eksekusi di server, dan konvensi lain untuk membangun aplikasi full-stack.

Dokumentasinya menjelaskan cara kerja bagian-bagian tersebut. Setelah menggabungkannya dalam aplikasi, Anda masih harus mengambil sejumlah keputusan.

Di mana logika bisnis ditempatkan? Apakah halaman boleh membaca database secara langsung? Apakah mutasi menggunakan Server Action atau Route Handler? Di mana validasi dan otorisasi dilakukan? Jika beberapa pemanggil membutuhkan operasi yang sama, bagian mana yang harus mereka gunakan bersama?

Next.js tidak bisa menjawab pertanyaan itu tanpa mengetahui aplikasi Anda. Anda membutuhkan aturan sendiri tentang cara fitur-fiturnya bekerja bersama.

## Kode yang berjalan pun bisa kehilangan konsistensi {#working-code-can-still-drift}

Saat aplikasi masih kecil, Anda biasanya memilih jalur terpendek agar fitur berjalan. Halaman membaca database karena membutuhkan data. Mutasi berada di dalam Server Action karena hanya satu formulir yang menggunakannya. Fungsi bantu masuk ke `utils` karena belum jelas tempatnya.

Next.js mengizinkan susunan tersebut. Tetapkan tempat yang konsisten untuk setiap tanggung jawab sejak fitur pertama.

Masalah muncul ketika setiap fitur menjawab pertanyaan yang sama dengan cara berbeda. Satu halaman membaca database langsung, sementara halaman lain memanggil endpoint HTTP internal. Satu mutasi menyimpan aturannya di dalam fitur, sementara yang lain menaruhnya di route atau komponen. Validasi ditempatkan di mana pun implementasi saat itu membutuhkannya.

Developer berikutnya tidak punya aturan yang jelas untuk diikuti. Mereka menyalin contoh terdekat, meskipun contoh itu dibuat untuk kebutuhan berbeda. Seiring penambahan fitur, perbedaan tersebut menjadi bagian dari aplikasi.

Otorisasi dan caching membuat ketidakkonsistenan ini semakin sulit diabaikan. Operasi yang dilindungi membutuhkan tempat pemeriksaan yang bisa diandalkan. Pembacaan yang menggunakan cache membutuhkan jalur mutasi yang mengetahui kapan data berubah. Jika pembacaan, mutasi, dan aturan bisnis tidak punya pemilik yang jelas, setiap kebutuhan baru menambah tempat yang harus diperiksa.

## Utang teknis bermula dari ketidakpastian {#technical-debt-begins-as-uncertainty}

Dampak pertamanya adalah keraguan.

Perubahan terdengar kecil, tetapi Anda tidak tahu harus mulai dari mana. Sebelum mengedit kode, Anda menelusuri repositori untuk mencari implementasi mana yang menjadi acuan, pemanggil mana yang mengulang aturan yang sama, dan bagian lain yang mungkin bergantung pada perilaku itu.

Code review mulai memperdebatkan selera pribadi karena kode yang ada memberi jawaban yang bertentangan. Developer baru mempelajari aplikasi dengan mencoba dan melakukan kesalahan. Aturan yang hanya ada di kepala seseorang hilang ketika orang tersebut tidak tersedia.

Aplikasi mungkin masih berjalan dengan benar, tetapi perubahan biasa membutuhkan penelusuran lebih banyak dari yang seharusnya. Ketidakpastian itu menjadi utang teknis: pengembangan melambat, kesalahan berulang, dan Anda terus khawatir tentang apa yang bisa rusak akibat suatu perubahan.

## Tetapkan pilihan awal untuk keputusan yang berulang {#give-recurring-decisions-a-default}

Gunakan rekomendasi dalam panduan ini sebagai titik awal untuk keputusan yang diserahkan framework kepada Anda.

Kode harus punya pemilik yang jelas. Dependensi harus mengikuti arah yang bisa dijelaskan. Pembacaan dan mutasi harus menempuh jalur yang sesuai dengan pemanggil dan runtime-nya. Route dan action menyesuaikan request serta response; operasi server milik fitur menangani pekerjaan bisnis. Terapkan batas tersebut saat memperkenalkan operasi.

Struktur folder adalah bagian dari arsitektur itu, tetapi penalaran yang sama harus berlanjut di luar folder. Penalaran itu juga harus memandu cara data mencapai fitur, tempat operasi berjalan, serta tempat aturan seperti otorisasi atau invalidasi cache berada.

Aplikasi yang bisa berkembang harus dapat menerima fitur dan kontributor baru tanpa membuat setiap perubahan semakin sulit ditelusuri. Pilihan awal dalam panduan ini membantu menjaga alasan di balik keputusan tetap terlihat dalam basis kode.

## Terapkan aturan sejak fitur pertama {#apply-the-rules-from-the-first-feature}

Ikuti aturan kepemilikan fitur, penempatan file, dan dependensi sejak awal. Fitur yang hanya membaca data dapat dimulai dengan komponen dan query server. Fitur pembatalan membutuhkan operasi bisnis untuk menegakkan aturannya, meskipun hanya satu formulir yang memanggilnya.

Buat modul yang dibutuhkan oleh tanggung jawab tersebut. Tambahkan abstraksi repository saat perilaku persistensi perlu dibagikan atau diganti, dan mapper DTO terpisah saat pemetaan membutuhkan modul sendiri. Query atau use case dapat mengakses database dan memilih field hasil yang aman sebelum kedua abstraksi itu ada.

Ukuran fitur tidak mengubah tempat aturan bisnisnya atau modul mana yang boleh diimpor pemanggil. Saat Anda menambahkan pembacaan, mengubah mutasi, atau melindungi resource, aturan yang sama menunjukkan tempat implementasi dimulai dan kode lain yang bisa terpengaruh.

Selanjutnya: [pelajari dasar arsitektur di balik kepemilikan dan arah dependensi](./concepts).
