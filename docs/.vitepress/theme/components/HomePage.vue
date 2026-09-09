<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../locale'
import ArchitectureMap from './ArchitectureMap.vue'

const { t, localeLink } = useLocale()

const chapters = computed(() => [
  ['01', t('Background & Motivation', 'Latar Belakang & Motivasi'), t('Why working Next.js applications become harder to change when each feature follows a different rule.', 'Mengapa aplikasi Next.js yang berjalan baik makin sulit diubah ketika setiap fitur mengikuti aturan berbeda.'), '/background'],
  ['02', t('Architecture Foundations', 'Dasar Arsitektur'), t('How feature ownership, public interfaces, and dependency direction decide where code belongs.', 'Cara kepemilikan fitur, antarmuka publik, dan arah dependensi menentukan tempat kode.'), '/concepts'],
  ['03', t('Data Fetching & Mutation', 'Pengambilan Data & Mutasi'), t('How to choose a path for reads and mutations across server code, browser state, and external callers.', 'Cara memilih jalur pembacaan dan mutasi untuk kode server, state browser, dan pemanggil eksternal.'), '/data-fetching-and-mutation'],
  ['04', t('Protected Resources', 'Perlindungan Resource'), t('Protect reads and mutations with session verification, resource access checks, and safe returned data.', 'Lindungi pembacaan dan mutasi dengan verifikasi sesi, pemeriksaan akses resource, dan data hasil yang aman.'), '/protected-resources'],
  ['05', t('Caching', 'Caching'), t('Understand what each cache reuses, where feature cache policy belongs, and how writes reach the server and browser views.', 'Pahami hasil yang digunakan ulang setiap cache, tempat kebijakan cache fitur, dan cara penulisan memperbarui tampilan server serta browser.'), '/caching'],
  ['06', t('Runnable Examples', 'Contoh Aplikasi'), t('Run a customer portal, a fulfillment dashboard, or a B2B ordering app and trace its requests through the source.', 'Jalankan portal pelanggan, dashboard pemenuhan pesanan, atau aplikasi pemesanan B2B, lalu telusuri request melalui kode sumbernya.'), '/examples'],
] as const)

const concerns = computed(() => [
  ['01', t('Start with the operation', 'Mulai dari operasinya'), t('Decide what the code must do and who needs it before choosing a Server Action, Route Handler, or client-side library.', 'Tentukan pekerjaan kode dan siapa yang membutuhkannya sebelum memilih Server Action, Route Handler, atau library sisi klien.')],
  ['02', t('Business rules belong to features', 'Aturan bisnis menjadi milik fitur'), t('Put the rule in one feature, then let pages, actions, and handlers call it instead of rewriting it.', 'Tempatkan aturan dalam satu fitur, lalu biarkan halaman, action, dan handler memanggilnya tanpa menulis ulang.')],
  ['03', t('Reads and mutations should be traceable', 'Pembacaan dan mutasi harus bisa ditelusuri'), t('You should be able to follow the caller to the feature, then follow the feature to the database or outside service.', 'Anda harus bisa menelusuri pemanggil ke fitur, lalu mengikuti fitur sampai database atau layanan luar.')],
  ['04', t('Extra structure needs a requirement', 'Struktur tambahan perlu alasan'), t('Keep the direct path until the browser, an external caller, or protected data requires another boundary.', 'Pertahankan jalur langsung sampai browser, pemanggil eksternal, atau data terlindungi membutuhkan batas lain.')],
] as const)
</script>

<template>
  <main class="manual-home">
    <section class="manual-hero">
      <div class="manual-hero__copy">
        <p class="manual-index">REACT FULLSTACK ARCHITECTURE / NEXT.JS</p>
        <h1>RFAStack</h1>
        <p class="manual-tagline">An Opinionated React Fullstack Architecture for Next.js Applications</p>
        <p class="manual-lede">{{ t('A Next.js application rarely becomes hard to maintain overnight. It happens one reasonable shortcut at a time, until nobody is sure where business logic belongs or what a small change might break. RFAStack gives you an opinionated architecture to follow before the codebase reaches that point.', 'Aplikasi Next.js jarang menjadi sulit dirawat dalam semalam. Biasanya, ini terjadi karena jalan pintas yang satu per satu terasa masuk akal, sampai akhirnya tidak ada yang yakin di mana logika bisnis seharusnya berada atau apa yang bisa rusak akibat perubahan kecil. RFAStack memberi Anda arsitektur dengan pilihan yang tegas untuk diikuti sebelum basis kode mencapai titik itu.') }}</p>
        <div class="manual-actions">
          <a class="manual-button" :href="localeLink('/background')">{{ t('Read the docs', 'Baca panduan') }}</a>
          <a class="manual-text-link" href="https://github.com/ishk-sftckz/RFAStack">{{ t('View on GitHub →', 'Lihat di GitHub →') }}</a>
        </div>
      </div>
    </section>

    <section class="positioning-section" aria-labelledby="why-rfastack">
      <header class="section-heading">
        <p class="manual-index">{{ t('THE GAP / APPLICATION DECISIONS', 'KEBUTUHAN / KEPUTUSAN APLIKASI') }}</p>
        <h2 id="why-rfastack">{{ t('You can know the Next.js APIs and still be unsure where your code belongs', 'Memahami API Next.js belum tentu membuat Anda tahu di mana kode harus ditempatkan') }}</h2>
        <p>{{ t('The documentation can show you how a Server Component, Server Action, or Route Handler works. Your application still needs rules for when to use each one, where business logic lives, and what several callers should share.', 'Dokumentasi dapat menunjukkan cara kerja Server Component, Server Action, atau Route Handler. Aplikasi Anda tetap membutuhkan aturan tentang kapan menggunakannya, tempat logika bisnis berada, dan bagian yang digunakan bersama oleh beberapa pemanggil.') }}</p>
      </header>
      <div class="problem-ledger">
        <article>
          <p class="ledger-index">{{ t('01 / THE FIRST FEATURE', '01 / FITUR PERTAMA') }}</p>
          <p>{{ t('A page reads from the database. A mutation stays in a Server Action. A helper goes into ', 'Halaman membaca database. Mutasi berada dalam Server Action. Fungsi bantu masuk ke ') }}<code>utils</code>{{ t('. Each choice works for the feature in front of you.', '. Setiap pilihan bekerja untuk fitur yang sedang Anda buat.') }}</p>
        </article>
        <article>
          <p class="ledger-index">{{ t('02 / THE PATTERNS DRIFT', '02 / POLA MULAI BERBEDA') }}</p>
          <p>{{ t('Another page calls an internal endpoint for the same kind of read. Another mutation keeps its checks somewhere else. Each implementation works, but the next developer has no clear pattern to follow.', 'Halaman lain memanggil endpoint internal untuk jenis pembacaan yang sama. Mutasi lain menyimpan pemeriksaan di tempat berbeda. Setiap implementasi berjalan, tetapi developer berikutnya tidak punya pola yang jelas untuk diikuti.') }}</p>
        </article>
        <article class="problem-ledger__answer">
          <p class="ledger-index">{{ t('03 / THE SHARED RULE', '03 / ATURAN BERSAMA') }}</p>
          <p>{{ t('Keep business rules with the feature that owns them. Pages, Server Actions, and Route Handlers can call the same operation through the boundary they need.', 'Simpan aturan bisnis bersama fitur pemiliknya. Halaman, Server Action, dan Route Handler dapat memanggil operasi yang sama melalui batas yang dibutuhkannya.') }}</p>
        </article>
      </div>
    </section>

    <section class="outcome-section" aria-labelledby="local-reasoning">
      <p class="manual-index">{{ t('THE COST / UNCERTAINTY', 'DAMPAK / KETIDAKPASTIAN') }}</p>
      <div class="outcome-statement">
        <h2 id="local-reasoning">{{ t('A small change should not begin with a repository-wide search', 'Perubahan kecil seharusnya tidak dimulai dengan pencarian di seluruh repositori') }}</h2>
        <p>{{ t('You should be able to find the feature, see where its rules live, and follow each read or mutation to the data it touches. When two paths do the same work and nobody can explain why, every change starts with investigation. That uncertainty slows reviews, encourages repeated mistakes, and becomes technical debt.', 'Anda harus bisa menemukan fitur, melihat tempat aturannya, dan menelusuri setiap pembacaan atau mutasi sampai data yang disentuh. Ketika dua jalur melakukan pekerjaan yang sama tanpa alasan yang jelas, setiap perubahan dimulai dengan penelusuran. Ketidakpastian itu memperlambat review, memicu kesalahan berulang, dan menjadi utang teknis.') }}</p>
      </div>
    </section>

    <section class="model-section" aria-labelledby="full-stack-model">
      <header class="section-heading">
        <p class="manual-index">{{ t('THE APPROACH / DEFAULTS WITH BOUNDARIES', 'PENDEKATAN / PILIHAN DENGAN BATAS') }}</p>
        <h2 id="full-stack-model">{{ t('Give every business rule an owner and every data path a reason', 'Tetapkan pemilik setiap aturan bisnis dan alasan untuk setiap jalur data') }}</h2>
        <p>{{ t('The folder tree, server code, and the way data moves should support the same decisions. Start with the direct path, then add structure when the application gives you a reason.', 'Pohon folder, kode server, dan cara data bergerak harus mendukung keputusan yang sama. Mulai dengan jalur langsung, lalu tambahkan struktur ketika aplikasi membutuhkannya.') }}</p>
      </header>
      <ol class="concern-grid" :aria-label="t('RFAStack architectural concerns', 'Pokok arsitektur RFAStack')">
        <li v-for="([number, title, copy]) in concerns" :key="title">
          <span class="concern-card__index">{{ number }}</span>
          <h3>{{ title }}</h3>
          <p>{{ copy }}</p>
        </li>
      </ol>
    </section>

    <section class="manual-map-section" aria-labelledby="architecture-at-a-glance">
      <header class="section-heading">
        <p class="manual-index">{{ t('ARCHITECTURE FOUNDATIONS / OWNERSHIP', 'DASAR ARSITEKTUR / KEPEMILIKAN') }}</p>
        <h2 id="architecture-at-a-glance">{{ t('The folder tree should show where product behavior belongs', 'Pohon folder harus menunjukkan tempat perilaku produk berada') }}</h2>
        <p>{{ t('A neat folder tree is easy to copy and easy to misuse. ', 'Pohon folder yang rapi mudah disalin dan mudah disalahgunakan. ') }}<code>src/app</code>{{ t(' contains Next.js entry points. ', ' berisi entry point Next.js. ') }}<code>src/features</code>{{ t(' owns product behavior. ', ' memiliki perilaku produk. ') }}<code>src/platform</code>{{ t(' handles databases and outside services. ', ' menangani database dan layanan luar. ') }}<code>src/shared</code>{{ t(' holds code with no product-specific rule. Copy the names without the ownership rules and you get four new junk drawers.', ' menyimpan kode tanpa aturan khusus produk. Menyalin nama tanpa aturan kepemilikannya hanya menghasilkan empat tempat penumpukan kode baru.') }}</p>
      </header>
      <ArchitectureMap />
    </section>

    <section class="reading-path" aria-labelledby="documentation">
      <header class="section-heading">
        <p class="manual-index">{{ t('READING PATH / RFASTACK', 'URUTAN BACA / RFASTACK') }}</p>
        <h2 id="documentation">{{ t('From code ownership to data flow', 'Dari kepemilikan kode sampai alur data') }}</h2>
        <p>{{ t('Follow the decisions that shape a Next.js application across features, framework boundaries, server code, and data sources.', 'Ikuti keputusan yang membentuk aplikasi Next.js, dari fitur dan batas framework sampai kode server serta sumber data.') }}</p>
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
