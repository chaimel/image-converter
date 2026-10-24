import dotenv from 'dotenv'

// The root .env (optional) picks ENV, e.g. ENV=docker or ENV=production; then environments/<ENV>.env
// is loaded. Variables that are already set win.
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })
const name = process.env.ENV
if (name) {
    if (!/^[\w-]+$/.test(name)) {
        console.error(`ENV must be a simple name such as docker or production, not "${name}".`)
        process.exit(1)
    }
    const { error } = dotenv.config({
        path: new URL(`../environments/${name}.env`, import.meta.url),
        quiet: true,
    })
    if (error) {
        console.error(`ENV=${name}, but environments/${name}.env could not be read.`)
        process.exit(1)
    }
    console.log(`Environment: ${name}`)
}
