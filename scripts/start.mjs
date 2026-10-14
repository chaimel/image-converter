import { existsSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

process.chdir(fileURLToPath(new URL('..', import.meta.url)))
const port = Number(process.env.PORT || 3000)
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('PORT must be a number from 1024 to 65535.')
const url = `http://127.0.0.1:${port}`
const openBrowser = () => {
  if (process.argv.includes('--no-open')) return
  const command =
    process.platform === 'win32'
      ? ['cmd.exe', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
  const opener = spawn(command[0], command[1], { stdio: 'ignore', windowsHide: true })
  opener.on('error', () => console.log(`Open ${url} in your browser.`))
  opener.unref()
}
async function isOurServer() {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(800) })
    return (await response.json()).app === 'musticker-image-converter'
  } catch {
    return false
  }
}
if (await isOurServer()) {
  console.log(`Musticker Studio is already running at ${url}`)
  openBrowser()
} else {
  if (!existsSync('node_modules/nuxt')) {
    console.error('First run: install dependencies with npm install, then run this launcher again.')
    process.exit(1)
  }
  if (!existsSync('.output/server/index.mjs')) {
    console.log('Preparing your local converter. This first build can take a minute…')
    const build = spawnSync(
      process.platform === 'win32' ? 'cmd.exe' : 'npm',
      process.platform === 'win32' ? ['/d', '/c', 'npm.cmd run build'] : ['run', 'build'],
      { stdio: 'inherit', windowsHide: true },
    )
    if (build.status !== 0) process.exit(build.status || 1)
  }
  const server = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1',
      PORT: String(port),
      NITRO_PORT: String(port),
    },
    stdio: 'inherit',
    windowsHide: true,
  })
  let exited = false
  server.on('exit', (code) => {
    exited = true
    process.exitCode = code || 0
  })
  server.on('error', (error) => {
    exited = true
    console.error(error.message)
    process.exitCode = 1
  })
  process.on('SIGINT', () => server.kill('SIGINT'))
  process.on('SIGTERM', () => server.kill('SIGTERM'))
  for (let attempt = 0; attempt < 40 && !exited; attempt++) {
    if (await isOurServer()) {
      console.log(
        `\nMusticker Studio: ${url}\nKeep this window open while converting. Press Ctrl+C to stop.\n`,
      )
      openBrowser()
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}
