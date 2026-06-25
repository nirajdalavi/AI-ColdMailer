import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const release = join(root, 'release')

rmSync(release, { recursive: true, force: true })
mkdirSync(release, { recursive: true })

const zipPath = join(release, 'ai-coldmailer.zip')
execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: 'inherit' })

writeFileSync(
  join(release, 'UPLOAD.txt'),
  `Upload ai-coldmailer.zip to the Chrome Web Store Developer Dashboard:
https://chrome.google.com/webstore/devconsole

See PUBLISHING.md for the full checklist.
`,
)

console.log(`\nReady for Chrome Web Store: ${zipPath}`)
