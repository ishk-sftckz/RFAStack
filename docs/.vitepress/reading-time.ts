import type { MarkdownRenderer } from 'vitepress'

export function readingTime(markdown: MarkdownRenderer) {
  markdown.core.ruler.push('reading-time', (state) => {
    const layout = state.env.frontmatter?.layout
    if (layout && layout !== 'doc') return

    const titleEnd = state.tokens.findIndex(
      (token) => token.type === 'heading_close' && token.tag === 'h1',
    )
    if (titleEnd === -1) return

    const text = state.tokens.flatMap((token) => {
      if (token.type === 'inline') {
        return (token.children ?? [])
          .filter((child) => child.type === 'text' || child.type === 'code_inline')
          .map((child) => child.content)
      }
      if (token.type === 'code_block' || (token.type === 'fence' && token.info.trim() !== 'mermaid')) {
        return [token.content]
      }
      return []
    }).join(' ')

    // Estimate prose and code reading at 200 words per minute, excluding markup and diagrams.
    const words = text.match(/\S+/g)?.length ?? 0
    const minutes = Math.max(1, Math.ceil(words / 200))
    const label = new state.Token('html_block', '', 0)
    const isIndonesian = state.env.relativePath?.startsWith('id/')
    const textLabel = isIndonesian ? `Sekitar ${minutes} menit baca` : `About ${minutes} min read`
    label.content = `<div class="reading-time">${textLabel}</div>\n`
    state.tokens.splice(titleEnd + 1, 0, label)
  })
}
