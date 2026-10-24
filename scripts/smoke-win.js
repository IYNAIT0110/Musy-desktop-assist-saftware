// Runs only on a disposable Windows CI runner. Installs the generated NSIS package
// and checks that the installed Electron renderer starts from a fresh data folder.
const { spawn, spawnSync } = require('node:child_process')
const { existsSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const root = process.env.RUNNER_TEMP || tmpdir()
const installDir = join(root, 'MusySmokeInstall')
const dataDir = join(root, 'MusySmokeData')
const setup = join(process.cwd(), 'dist', `musy-desktop-assist-${require('../package.json').version}-setup.exe`)
const exe = join(installDir, 'Musy.exe')
const port = 19341

async function main() {
  if (!existsSync(setup)) throw new Error(`Installer missing: ${setup}`)
  mkdirSync(dataDir, { recursive: true })
  const install = spawnSync(setup, ['/S', `/D=${installDir}`], {
    encoding: 'utf8', timeout: 120000
  })
  if (install.error || install.status !== 0 || !existsSync(exe)) {
    throw new Error(`Installer failed: ${install.error || install.stderr || install.status}`)
  }
  const app = spawn(exe, [`--remote-debugging-port=${port}`, '--disable-gpu'], {
    env: { ...process.env, MUSY_USER_DATA: dataDir },
    stdio: 'ignore', windowsHide: true
  })
  try {
    for (let i = 0; i < 30; i++) {
      if (app.exitCode !== null) throw new Error(`App exited early: ${app.exitCode}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`)
        const pages = await response.json()
        if (pages.some((page) => page.type === 'page' && /index\.html#floatbar/.test(page.url))) {
          console.log('Installer and first renderer startup passed')
          return
        }
      } catch { /* Electron is still starting */ }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error('Installed renderer did not become available in 30 seconds')
  } finally {
    spawnSync('taskkill', ['/PID', String(app.pid), '/T', '/F'], { stdio: 'ignore' })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
