import type { LocaleSpecificConfig, DefaultTheme } from 'vitepress'

export const indonesian: LocaleSpecificConfig<DefaultTheme.Config> & { label: string } = {
  label: 'Bahasa Indonesia',
  lang: 'id',
  description: 'Panduan arsitektur React full-stack untuk aplikasi Next.js. Pelajari cara menempatkan kode, mengatur alur data, dan memeriksa hak akses.',
  themeConfig: {
    nav: [
      { text: 'Panduan', link: '/id/background' },
      { text: 'GitHub', link: 'https://github.com/ishk-sftckz/RFAStack' },
    ],
    sidebar: [{
      text: 'React Fullstack Architecture',
      items: [
        {
          text: 'Pengantar', link: '/id/background', collapsed: false,
          items: [{ text: 'Latar Belakang & Motivasi', link: '/id/background' }],
        },
        {
          text: 'Dasar Arsitektur', link: '/id/concepts', collapsed: false,
          items: [
            { text: 'Konsep', link: '/id/concepts' },
            { text: 'Struktur Folder', link: '/id/folder-structure' },
          ],
        },
        { text: 'Pengambilan Data & Mutasi', link: '/id/data-fetching-and-mutation' },
        { text: 'Perlindungan Resource', link: '/id/protected-resources' },
        { text: 'Caching', link: '/id/caching' },
        { text: 'Contoh Aplikasi', link: '/id/examples' },
      ],
    }],
    outline: { level: [2, 3], label: 'Di halaman ini' },
    editLink: {
      pattern: 'https://github.com/ishk-sftckz/RFAStack/edit/main/docs/:path',
      text: 'Edit halaman ini',
    },
    lastUpdated: { text: 'Diperbarui', formatOptions: { dateStyle: 'medium' } },
    docFooter: { prev: 'Bab sebelumnya', next: 'Bab berikutnya' },
    footer: {
      message: 'Kode: MIT · Tulisan, diagram, dan aset visual: CC BY 4.0',
      copyright: 'RFAStack oleh Ishk · © 2026',
    },
    returnToTopLabel: 'Kembali ke atas',
    sidebarMenuLabel: 'Menu',
    langMenuLabel: 'Pilih bahasa',
    skipToContentLabel: 'Langsung ke konten',
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Gunakan tema terang',
    darkModeSwitchTitle: 'Gunakan tema gelap',
  },
}

export const indonesianSearch = {
  translations: {
    button: { buttonText: 'Cari', buttonAriaLabel: 'Cari dokumentasi' },
    modal: {
      displayDetails: 'Tampilkan detail',
      resetButtonTitle: 'Hapus pencarian',
      backButtonTitle: 'Tutup pencarian',
      noResultsText: 'Tidak ada hasil untuk',
      footer: {
        selectText: 'pilih', selectKeyAriaLabel: 'enter',
        navigateText: 'navigasi', navigateUpKeyAriaLabel: 'panah atas',
        navigateDownKeyAriaLabel: 'panah bawah', closeText: 'tutup', closeKeyAriaLabel: 'escape',
      },
    },
  },
}
