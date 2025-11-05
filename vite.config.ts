import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { vuestic } from '@vuestic/compiler/vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    vuestic({ devtools: false }),
    vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/locales/**'),
    }),
  ],
  server: {
    proxy: {
      // 🔁 Proxy Braiins API to bypass CORS
      '/braiins-api': {
        target: 'https://insights.braiins.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/braiins-api/, ''),
      },
    },
  },
})
