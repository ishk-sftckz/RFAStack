import { useData, withBase } from 'vitepress'

export function useLocale() {
  const { lang } = useData()
  const t = (english: string, indonesian: string) => lang.value === 'id' ? indonesian : english
  const localeLink = (path: string) => withBase(`${t('', '/id')}${path}`)
  return { t, localeLink }
}
