import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import baseManifest from './manifest.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const clientId = env.VITE_GMAIL_CLIENT_ID?.trim()

  const manifest = {
    ...baseManifest,
    ...(clientId
      ? { oauth2: { ...baseManifest.oauth2, client_id: clientId } }
      : {}),
  }

  // Remove oauth2 block entirely if no client ID — avoids broken OAuth in dev builds
  if (!clientId && 'oauth2' in manifest) {
    delete (manifest as { oauth2?: unknown }).oauth2
  }

  return {
    plugins: [react(), crx({ manifest })],
    build: {
      rollupOptions: {
        input: {
          popup: 'index.html',
        },
      },
    },
  }
})
