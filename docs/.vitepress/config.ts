import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { readingTime } from './reading-time'

const siteUrl = 'https://ishk-sftckz.github.io/RFAStack/'
const tagline = 'An Opinionated React Fullstack Architecture for Next.js Applications'

export default withMermaid(
  defineConfig({
    base: '/RFAStack/',
    lang: 'en-US',
    title: 'RFAStack',
    titleTemplate: ':title · RFAStack',
    description: tagline,
    cleanUrls: true,
    lastUpdated: true,
    ignoreDeadLinks: false,
    sitemap: { hostname: siteUrl },
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/RFAStack/favicon.svg' }],
      ['link', { rel: 'apple-touch-icon', href: '/RFAStack/apple-touch-icon.png' }],
      ['link', { rel: 'manifest', href: '/RFAStack/manifest.webmanifest' }],
      ['meta', { name: 'theme-color', content: '#f3efe3' }],
      ['meta', { name: 'mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-title', content: 'RFAStack' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'RFAStack' }],
      ['meta', { property: 'og:title', content: `RFAStack — ${tagline}` }],
      ['meta', { property: 'og:description', content: tagline }],
      ['meta', { property: 'og:image', content: `${siteUrl}social-preview.png` }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ],
    transformHead({ pageData }) {
      const path = pageData.relativePath === 'index.md' ? '' : pageData.relativePath.replace(/\.md$/, '')
      return [['link', { rel: 'canonical', href: `${siteUrl}${path}` }]]
    },
    vite: {
      optimizeDeps: {
        include: ['fastdom', 'fastdom/extensions/fastdom-promised.js'],
      },
    },
    markdown: {
      config: readingTime,
      lineNumbers: true,
      theme: {
        light: 'github-light-high-contrast',
        dark: 'github-dark-high-contrast',
      },
    },
    mermaid: {
      theme: 'base',
      themeVariables: {
        fontFamily: 'Geist Variable, sans-serif',
        primaryColor: '#e9edff',
        primaryTextColor: '#181713',
        primaryBorderColor: '#244bd8',
        lineColor: '#244bd8',
        secondaryColor: '#f3efe3',
        tertiaryColor: '#fa6a4a',
      },
    },
    themeConfig: {
      siteTitle: false,
      logo: { light: '/wordmark.svg', dark: '/wordmark-dark.svg', alt: 'RFAStack' },
      nav: [
        { text: 'Docs', link: '/background' },
        { text: 'GitHub', link: 'https://github.com/ishk-sftckz/RFAStack' },
      ],
      sidebar: [
        {
          text: 'React Fullstack Architecture',
          items: [
            {
              text: 'Introduction',
              link: '/background',
              collapsed: false,
              items: [
                { text: 'Background & Motivation', link: '/background' },
              ],
            },
            {
              text: 'Architecture Foundations',
              link: '/concepts',
              collapsed: false,
              items: [
                { text: 'Concepts', link: '/concepts' },
                { text: 'Folder Structure', link: '/folder-structure' },
              ],
            },
            {
              text: 'Data Fetching & Mutation',
              link: '/data-fetching-and-mutation',
            },
            {
              text: 'Protected Resources',
              link: '/protected-resources',
            },
            {
              text: 'Caching',
              link: '/caching',
            },
            { text: 'Runnable Examples', link: '/examples' },
          ],
        },
      ],
      search: { provider: 'local', options: { detailedView: true } },
      outline: { level: [2, 3], label: 'On this page' },
      editLink: {
        pattern: 'https://github.com/ishk-sftckz/RFAStack/edit/main/docs/:path',
        text: 'Edit this page',
      },
      lastUpdated: { text: 'Revised', formatOptions: { dateStyle: 'medium' } },
      docFooter: { prev: 'Previous chapter', next: 'Next chapter' },
      socialLinks: [{ icon: 'github', link: 'https://github.com/ishk-sftckz/RFAStack' }],
      footer: {
        message: 'Code: MIT · Writing, diagrams, and visual assets: CC BY 4.0',
        copyright: 'RFAStack by Ishk · © 2026',
      },
      returnToTopLabel: 'Return to top',
      sidebarMenuLabel: 'Menu',
    },
  }),
)
