import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { type PluginOption, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss() as PluginOption],
  server: {
    host: true,
  },
})
