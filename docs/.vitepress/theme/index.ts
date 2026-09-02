import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ArchitectureMap from './components/ArchitectureMap.vue'
import HomePage from './components/HomePage.vue'
import FieldManualLayout from './components/FieldManualLayout.vue'
import './styles.css'

export default {
  extends: DefaultTheme,
  Layout: FieldManualLayout,
  enhanceApp({ app }) {
    app.component('ArchitectureMap', ArchitectureMap)
    app.component('HomePage', HomePage)
  },
} satisfies Theme
