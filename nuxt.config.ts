import config from './config/app'
import seo from './config/seo'

export default defineNuxtConfig({
    compatibilityDate: '2026-10-01',
    devtools: { enabled: false },
    telemetry: false,
    devServer: { host: '127.0.0.1', port: 3000 },
    // Built in from config/app.ts; NUXT_ALLOWED_HOSTS still overrides it when the server starts.
    runtimeConfig: { allowedHosts: config.allowedHosts },
    css: ['@fontsource-variable/dm-sans', '@fontsource-variable/manrope', '~/assets/main.css'],
    app: {
        head: {
            htmlAttrs: { lang: 'en' },
            // Title, description, social cards, canonical link and JSON-LD live in config/seo.ts.
            ...seo,
        },
    },
    nitro: { externals: { external: ['sharp', 'imagetracerjs'] } },
})
