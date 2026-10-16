export default defineNuxtConfig({
    compatibilityDate: '2026-10-01',
    devtools: { enabled: false },
    telemetry: false,
    devServer: { host: '127.0.0.1', port: 3000 },
    css: ['@fontsource-variable/dm-sans', '@fontsource-variable/manrope', '~/assets/main.css'],
    app: {
        head: {
            htmlAttrs: { lang: 'en' },
            title: 'Musticker Studio — Image converter',
            meta: [
                {
                    name: 'description',
                    content:
                        'Your everyday local image converter. Convert, resize, and prepare artwork for Musticker.',
                },
            ],
            link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
        },
    },
    nitro: { externals: { external: ['sharp', 'imagetracerjs'] } },
})
