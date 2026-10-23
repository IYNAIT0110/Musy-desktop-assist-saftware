// 启动脚本：清除 ELECTRON_RUN_AS_NODE 后启动 electron-vite
// 原因：WorkBuddy 宿主环境设置了 ELECTRON_RUN_AS_NODE=1，
// 会导致 electron 以纯 Node 模式运行（require('electron') 返回错误内容）
const { spawn } = require('child_process')
const { resolve } = require('path')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const electronViteBin = resolve(
  __dirname,
  '..',
  'node_modules',
  'electron-vite',
  'bin',
  'electron-vite.js'
)

const args = process.argv.slice(2)

const child = spawn(process.execPath, [electronViteBin, ...args], {
  stdio: 'inherit',
  env
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
