---
title: Latar Belakang & Motivasi
description: Mengapa aplikasi Next.js butuh aturan yang konsisten untuk menempatkan kode dan menghubungkan fitur.
---

# Latar Belakang & Motivasi

Aplikasi Next.js biasanya makin sulit dirawat karena keputusan kecil yang menumpuk. Awalnya masuk akal: taruh logika di sini dulu, salin sedikit kode di sana. Lama-lama, kita tidak yakin lagi logika bisnis harus ditaruh di mana atau perubahan kecil akan berdampak ke bagian mana. RFAStack menawarkan pola arsitektur yang bisa diikuti sebelum codebase sampai ke titik itu.

## Next.js tidak menentukan semua keputusan aplikasi {#next-js-leaves-some-decisions-to-your-application}

[React](https://react.dev/) menyediakan dasar untuk membuat UI. [Next.js](https://nextjs.org/docs/app) menambahkan routing, rendering, eksekusi kode di server, dan konvensi untuk membangun aplikasi full-stack.

Dokumentasinya menjelaskan cara kerja masing-masing bagian. Tapi saat menyusun aplikasi, masih ada keputusan yang harus kamu ambil sendiri.

Logika bisnis ditaruh di mana? Bolehkah halaman langsung membaca database? Untuk mutasi, pakai Server Action atau Route Handler? Validasi dan otorisasi dilakukan di mana? Kalau beberapa bagian membutuhkan operasi yang sama, kode mana yang sebaiknya dipakai bersama?

Jawabannya bergantung pada aplikasi yang sedang kamu bangun. Karena itu, kamu perlu aturan tentang cara fitur-fiturnya bekerja sama.

## Sama-sama jalan, polanya bisa berbeda {#working-code-can-still-drift}

Saat aplikasi masih kecil, kita cenderung memilih cara tercepat agar fitur bisa dipakai. Halaman butuh data, jadi langsung panggil database. Mutasi hanya dipakai satu form, jadi taruh di Server Action. Belum tahu helper ini masuk ke mana, jadi simpan di `utils`.

Semua itu bisa berjalan di Next.js. Meski begitu, tentukan tempat untuk setiap tanggung jawab sejak fitur pertama, lalu gunakan aturan yang sama pada fitur berikutnya.

Masalah mulai terasa ketika setiap fitur punya cara sendiri. Satu halaman membaca database langsung, halaman lain lewat endpoint HTTP internal. Satu mutasi menyimpan aturan bisnis di fitur, yang lain menaruhnya di route atau komponen. Validasi pun tersebar mengikuti kebutuhan masing-masing implementasi.

Developer berikutnya akhirnya menyalin contoh terdekat, walaupun kebutuhan awalnya berbeda. Semakin banyak fitur, semakin banyak pula pola yang harus dipelajari.

Otorisasi dan caching membuat dampaknya lebih terasa. Pemeriksaan akses harus selalu dijalankan sebelum operasi yang dilindungi. Query yang memakai cache juga harus punya jalur invalidasi saat datanya berubah. Kalau tempat query, mutasi, dan aturan bisnis belum jelas, setiap kebutuhan baru menambah bagian yang harus ditelusuri.

## Utang teknis dimulai dari rasa ragu saat mengubah kode {#technical-debt-begins-as-uncertainty}

Perubahan yang terlihat kecil pun jadi sulit dimulai.

Sebelum mengedit, kamu harus mencari implementasi mana yang menjadi acuan. Lalu cek siapa saja yang mengulang aturan itu dan bagian lain yang mungkin ikut terpengaruh.

Code review mulai membahas selera masing-masing karena contoh yang ada tidak konsisten. Developer baru belajar lewat trial and error. Aturan yang hanya diingat satu orang pun sulit diikuti saat orang itu tidak bisa ditanya.

Aplikasinya masih berjalan, tapi perubahan sehari-hari membutuhkan terlalu banyak penelusuran. Waktu pengembangan bertambah, kesalahan yang sama terulang, dan setiap perubahan terasa berisiko. Ketidakpastian seperti ini juga bagian dari utang teknis.

## Tentukan pola untuk keputusan yang sering berulang {#give-recurring-decisions-a-default}

Gunakan rekomendasi dalam panduan ini sebagai acuan untuk keputusan yang tidak diatur oleh framework.

Setiap kode perlu jelas tanggung jawabnya. Arah dependensi harus bisa dijelaskan. Cara membaca dan mengubah data harus sesuai dengan kode yang memanggilnya dan tempat kode itu berjalan. Route dan action menangani request serta response, sedangkan pekerjaan bisnis dijalankan oleh operasi server di fitur terkait. Terapkan pembagian ini saat membuat operasinya.

Aturan itu tidak berhenti pada struktur folder. Gunakan juga untuk menentukan cara data masuk ke fitur, tempat operasi dijalankan, serta lokasi pemeriksaan akses dan invalidasi cache.

Fitur dan kontributor baru seharusnya bisa ditambahkan tanpa membuat setiap perubahan makin sulit ditelusuri. Pola yang konsisten membantu orang memahami keputusan arsitektur dengan membaca kodenya.

## Terapkan aturan sejak fitur pertama {#apply-the-rules-from-the-first-feature}

Mulai dari fitur kecil pun, ikuti aturan penempatan kode dan dependensi yang sama. Fitur yang hanya menampilkan data mungkin cukup punya komponen dan query server. Fitur pembatalan pesanan sudah membutuhkan operasi bisnis untuk memeriksa aturan pembatalan, walaupun baru satu form yang memanggilnya.

Buat modul sesuai kebutuhan yang ada. Tambahkan repository ketika beberapa operasi perlu berbagi kode akses database atau menggantinya saat pengujian. Pisahkan mapper DTO ketika proses mapping memang perlu tempat sendiri. Sebelum itu, query atau use case boleh mengakses database dan memilih field hasilnya langsung.

Ukuran fitur tidak mengubah tempat aturan bisnisnya atau file mana yang boleh diimpor dari luar. Saat menambah query, mengubah mutasi, atau melindungi resource, gunakan aturan yang sama untuk menentukan tempat implementasi dan memahami dampaknya.

Selanjutnya: [pelajari dasar pembagian tanggung jawab dan arah dependensi](./concepts).
