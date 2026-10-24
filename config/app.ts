// App settings read from the environment, like Laravel's config/app.php. Loading this file loads
// the root .env, then environments/<ENV>.env (ENV=docker or ENV=production). Used by nuxt.config.ts.
import '../scripts/env.mjs'

export default {
    // Domains allowed besides localhost, comma-separated.
    allowedHosts: process.env.NUXT_ALLOWED_HOSTS || '',
    // Public address of the live site, used for canonical and social-preview links.
    siteUrl: (process.env.NUXT_PUBLIC_SITE_URL || 'https://image-converter.tukod.dev').replace(/\/$/, ''),
}
