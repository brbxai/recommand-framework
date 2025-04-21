import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { FileBasedRouterPlugin } from './lib/vite-plugins/file-based-router'
import tailwindcss from '@tailwindcss/vite'
import DynamicAliasPlugin from './lib/vite-plugins/dynamic-alias'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    FileBasedRouterPlugin(),
    DynamicAliasPlugin(),
  ],
  root: "./app",
  resolve: {
    alias: {
      "@recommand": __dirname,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost"],
    hmr: {
      clientPort: 5173,
    },
  },
})
