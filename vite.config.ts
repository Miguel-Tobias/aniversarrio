import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBase(raw: string | undefined): string {
  if (raw === undefined || raw === '' || raw === '/') return '/'
  let b = raw.trim()
  if (!b.startsWith('/')) b = `/${b}`
  if (!b.endsWith('/')) b = `${b}/`
  return b
}

export default defineConfig({
  base: normalizeBase(process.env.VITE_BASE_URL),
  plugins: [react()],
})
