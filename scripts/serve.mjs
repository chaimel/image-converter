// Server entry for Docker: load the chosen environment, then start the production build.
import './env.mjs'

await import('../.output/server/index.mjs')
