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

async function defaultContent(page) {
  const socket = new WebSocket(page.webSocketDebuggerUrl)
  try {
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
    const response = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Default content check timed out')), 5000)
      socket.addEventListener('message', event => {
        const message = JSON.parse(event.data)
        if (message.id !== 1) return
        clearTimeout(timeout)
        if (message.error || message.result.exceptionDetails) reject(new Error('Renderer evaluation failed'))
        else resolve(message.result.result.value)
      })
    })
    socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `JSON.stringify({links: JSON.parse(localStorage.getItem('musy.links') || '[]').length, prompts: JSON.parse(localStorage.getItem('musy.prompts') || '[]').map(p => ({id:p.id,parentId:p.parentId,image:p.image?.startsWith('data:image/svg+xml')}))})`,
      returnByValue: true
    } }))
    const data = JSON.parse(await response)
    if (data.links !== 64 || data.prompts.length !== 3 || data.prompts.filter(p => p.parentId).length !== 1 || data.prompts.some(p => !p.id.startsWith('example-') || !p.image)) {
      throw new Error('Unexpected first-run content: ' + JSON.stringify(data))
    }
  } finally { socket.close() }
}

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
        const page = pages.find((page) => page.type === 'page' && /index\.html#floatbar/.test(page.url))
        if (page) {
          await defaultContent(page)
          console.log('Installer, first renderer startup, 64 public sites and 3 original examples passed')
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
