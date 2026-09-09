<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../locale'
import ArchitectureMap from './ArchitectureMap.vue'

const { t, localeLink } = useLocale()

const chapters = computed(() => [
  ['01', t('Background & Motivation', 'Latar Belakang & Motivasi'), t('Why working Next.js applications become harder to change when each feature follows a different rule.', 'Mengapa fitur yang sama-sama berjalan baik bisa membuat aplikasi Next.js makin sulit diubah.'), '/background'],
  ['02', t('Architecture Foundations', 'Dasar Arsitektur'), t('How feature ownership, public interfaces, and dependency direction decide where code belongs.', 'Tentukan tanggung jawab fitur, operasi yang boleh dipanggil dari luar, dan arah dependensinya.'), '/concepts'],
  ['03', t('Data Fetching & Mutation', 'Pengambilan Data & Mutasi'), t('How to choose a path for reads and mutations across server code, browser state, and external callers.', 'Pilih cara mengambil dan mengubah data sesuai kebutuhan server, browser, dan aplikasi lain.'), '/data-fetching-and-mutation'],
  ['04', t('Protected Resources', 'Perlindungan Resource'), t('Protect reads and mutations with session verification, resource access checks, and safe returned data.', 'Periksa sesi dan izin akses sebelum membaca atau mengubah data. Kembalikan hanya field yang boleh dilihat pengguna.'), '/protected-resources'],
  ['05', t('Caching', 'Caching'), t('Understand what each cache reuses, where feature cache policy belongs, and how writes reach the server and browser views.', 'Pahami cache yang dipakai aplikasi dan apa yang harus diperbarui setelah data berubah.'), '/caching'],
  ['06', t('Runnable Examples', 'Contoh Aplikasi'), t('Run a customer portal, a fulfillment dashboard, or a B2B ordering app and trace its requests through the source.', 'Jalankan portal pelanggan, dashboard pengiriman, atau aplikasi pemesanan B2B. Lalu ikuti alur request di kodenya.'), '/examples'],
] as const)

const concerns = computed(() => [
  ['01', t('Start with the operation', 'Mulai dari kebutuhan operasi'), t('Decide what the code must do and who needs it before choosing a Server Action, Route Handler, or client-side library.', 'Tentukan dulu apa yang harus dilakukan kode dan siapa yang memakainya. Setelah itu, pilih Server Action, Route Handler, atau library klien.')],
  ['02', t('Business rules belong to features', 'Simpan aturan bisnis di fitur terkait'), t('Put the rule in one feature, then let pages, actions, and handlers call it instead of rewriting it.', 'Tulis aturannya di satu tempat. Halaman, action, dan handler cukup memanggil operasi yang sama.')],
  ['03', t('Reads and mutations should be traceable', 'Alur query dan mutasi harus jelas'), t('You should be able to follow the caller to the feature, then follow the feature to the database or outside service.', 'Dari kode yang memanggil operasi, kamu harus bisa mengikuti alurnya sampai ke fitur, database, atau layanan luar.')],
  ['04', t('Extra structure needs a requirement', 'Tambah struktur saat dibutuhkan'), t('Keep the direct path until the browser, an external caller, or protected data requires another boundary.', 'Mulai dari panggilan langsung. Tambahkan batas baru ketika browser, aplikasi lain, atau kebutuhan akses data mengharuskannya.')],
] as const)
</script>

<template>
  <main class="manual-home">
    <section class="manual-hero">
      <div class="manual-hero__copy">
        <p class="manual-index">REACT FULLSTACK ARCHITECTURE / NEXT.JS</p>
        <h1>RFAStack</h1>
        <p class="manual-tagline">An Opinionated React Fullstack Architecture for Next.js Applications</p>
        <p class="manual-lede">{{ t('A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.', 'Aplikasi Next.js biasanya makin sulit dirawat karena keputusan kecil yang menumpuk. Awalnya masuk akal: taruh logika di sini dulu, salin sedikit kode di sana. Lama-lama, kita tidak yakin lagi logika bisnis harus ditaruh di mana atau perubahan kecil akan berdampak ke bagian mana. RFAStack menawarkan pola arsitektur yang bisa diikuti sebelum codebase sampai ke titik itu.') }}</p>
        <div class="manual-actions">
          <a class="manual-button" :href="localeLink('/background')">{{ t('Read the docs', 'Baca panduan') }}</a>
          <a class="manual-text-link" href="https://github.com/ishk-sftckz/RFAStack">{{ t('View on GitHub →', 'Lihat di GitHub →') }}</a>
        </div>
      </div>
    </section>

    <section class="positioning-section" aria-labelledby="why-rfastack">
      <header class="section-heading">
        <p class="manual-index">{{ t('THE GAP / APPLICATION DECISIONS', 'KEPUTUSAN DI LUAR FRAMEWORK') }}</p>
        <h2 id="why-rfastack">{{ t('You can know the Next.js APIs and still be unsure where your code belongs', 'Paham API Next.js belum tentu tahu harus menaruh kode di mana') }}</h2>
        <p>{{ t('The documentation can show you how a Server Component, Server Action, or Route Handler works. Your application still needs rules for when to use each one, where business logic lives, and what several callers should share.', 'Dokumentasi menjelaskan cara kerja Server Component, Server Action, dan Route Handler. Tapi kamu tetap perlu menentukan kapan memakainya, di mana logika bisnis ditulis, dan kode mana yang dipakai bersama.') }}</p>
      </header>
      <div class="problem-ledger">
        <article>
          <p class="ledger-index">{{ t('01 / THE FIRST FEATURE', '01 / FITUR PERTAMA') }}</p>
          <p>{{ t('A page reads from the database. A mutation stays in a Server Action. A helper goes into ', 'Halaman langsung membaca database. Mutasi ditaruh di Server Action. Helper masuk ke ') }}<code>utils</code>{{ t('. Each choice works for the feature in front of you.', '. Semuanya cukup untuk membuat fitur pertama berjalan.') }}</p>
        </article>
        <article>
          <p class="ledger-index">{{ t('02 / THE PATTERNS DRIFT', '02 / POLA MULAI BERBEDA') }}</p>
          <p>{{ t('Another page calls an internal endpoint for the same kind of read. Another mutation keeps its checks somewhere else. Each implementation works, but the next developer has no clear pattern to follow.', 'Halaman berikutnya mengambil data serupa lewat endpoint internal. Mutasi lain punya pemeriksaan di tempat berbeda. Semuanya jalan, tapi developer berikutnya tidak tahu pola mana yang harus diikuti.') }}</p>
        </article>
        <article class="problem-ledger__answer">
          <p class="ledger-index">{{ t('03 / THE SHARED RULE', '03 / ATURAN BERSAMA') }}</p>
          <p>{{ t('Keep business rules with the feature that owns them. Pages, Server Actions, and Route Handlers can call the same operation through the boundary they need.', 'Simpan aturan bisnis di fitur yang mengurusnya. Halaman, Server Action, dan Route Handler tinggal memanggil operasi itu lewat jalur yang sesuai.') }}</p>
        </article>
      </div>
    </section>

    <section class="outcome-section" aria-labelledby="local-reasoning">
      <p class="manual-index">{{ t('THE COST / UNCERTAINTY', 'WAKTU HABIS UNTUK MENELUSURI') }}</p>
      <div class="outcome-statement">
        <h2 id="local-reasoning">{{ t('A small change should not begin with a repository-wide search', 'Perubahan kecil seharusnya tidak perlu membongkar seluruh repositori') }}</h2>
        <p>{{ t('You should be able to find the feature, see where its rules live, and follow each read or mutation to the data it touches. When two paths do the same work and nobody can explain why, every change starts with investigation. That uncertainty slows reviews, encourages repeated mistakes, and becomes technical debt.', 'Kamu seharusnya bisa membuka fitur, menemukan aturannya, lalu mengikuti query atau mutasi sampai ke datanya. Kalau dua jalur melakukan pekerjaan yang sama tanpa alasan yang jelas, setiap perubahan harus dimulai dengan mencari tahu ulang. Review jadi lebih lama dan kesalahan yang sama mudah terulang.') }}</p>
      </div>
    </section>

    <section class="model-section" aria-labelledby="full-stack-model">
      <header class="section-heading">
        <p class="manual-index">{{ t('THE APPROACH / DEFAULTS WITH BOUNDARIES', 'ATURAN DASAR DAN BATASNYA') }}</p>
        <h2 id="full-stack-model">{{ t('Give every business rule an owner and every data path a reason', 'Perjelas tanggung jawab fitur dan alasan di balik alur datanya') }}</h2>
        <p>{{ t('The folder tree, server code, and the way data moves should support the same decisions. Start with the direct path, then add structure when the application gives you a reason.', 'Struktur folder, kode server, dan alur data harus mengikuti aturan yang sama. Mulai dari cara yang langsung, lalu tambahkan struktur ketika kebutuhannya muncul.') }}</p>
      </header>
      <ol class="concern-grid" :aria-label="t('RFAStack architectural concerns', 'Prinsip arsitektur RFAStack')">
        <li v-for="([number, title, copy]) in concerns" :key="title">
          <span class="concern-card__index">{{ number }}</span>
          <h3>{{ title }}</h3>
          <p>{{ copy }}</p>
        </li>
      </ol>
    </section>

    <section class="manual-map-section" aria-labelledby="architecture-at-a-glance">
      <header class="section-heading">
        <p class="manual-index">{{ t('ARCHITECTURE FOUNDATIONS / OWNERSHIP', 'TEMPAT KODE DAN TANGGUNG JAWABNYA') }}</p>
        <h2 id="architecture-at-a-glance">{{ t('The folder tree should show where product behavior belongs', 'Dari struktur folder, harus jelas kode ini mengurus apa') }}</h2>
        <p>{{ t('A neat folder tree is easy to copy and easy to misuse. ', 'Pohon folder yang rapi mudah disalin, tapi nama folder saja belum cukup. ') }}<code>src/app</code>{{ t(' contains Next.js entry points. ', ' berisi entry point Next.js. ') }}<code>src/features</code>{{ t(' owns product behavior. ', ' mengurus perilaku bisnis aplikasi. ') }}<code>src/platform</code>{{ t(' handles databases and outside services. ', ' menangani koneksi database dan layanan luar. ') }}<code>src/shared</code>{{ t(' holds code with no product-specific rule. Copy the names without the ownership rules and you get four new junk drawers.', ' berisi kode umum yang tidak terikat aturan bisnis. Tanpa pembagian tanggung jawab, keempat folder itu tetap bisa menjadi tempat menumpuk kode.') }}</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="reading-path" aria-labelledby="documentation">
      <header class="section-heading">
        <p class="manual-index">{{ t('READING PATH / RFASTACK', 'URUTAN BACA / RFASTACK') }}</p>
        <h2 id="documentation">{{ t('From code ownership to data flow', 'Dari penempatan kode ke alur data') }}</h2>
        <p>{{ t('Follow the decisions that shape a Next.js application across features, framework boundaries, server code, and data sources.', 'Mulai dari pembagian tanggung jawab fitur, lalu ikuti cara data bergerak melalui kode server, browser, dan sumber datanya.') }}</p>
      </header>
      <ol class="chapter-list" :aria-label="t('RFAStack reading path', 'Urutan baca RFAStack')">
        <li v-for="chapter in chapters" :key="chapter[0]">
          <a :href="localeLink(chapter[3])">
            <span class="chapter-list__index">{{ chapter[0] }}</span>
            <span class="chapter-list__body"><strong>{{ chapter[1] }}</strong><small>{{ chapter[2] }}</small></span>
            <svg class="chapter-list__arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </li>
      </ol>
    </section>
  </main>
</template>
