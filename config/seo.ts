// Search and social-preview copy for the page head. Used by nuxt.config.ts. Keep public/llms.txt and
// public/sitemap.xml in step with these when the wording or address changes.
import type { NuxtConfig } from 'nuxt/schema'
import config from './app'

type AppHead = NonNullable<NonNullable<NuxtConfig['app']>['head']>

const title = 'Image Converter — Accurate, Lossless PNG, WebP, JPG & SVG'
const description =
    'Free image converter that keeps every detail. Convert PNG, WebP, JPG, SVG, AVIF, GIF, TIFF and ICO ' +
    'with lossless defaults. Files are never stored.'
const url = `${config.siteUrl}/`
const image = `${config.siteUrl}/og-image.png`
const imageAlt = 'Image Converter: accurate, lossless image conversion'

// schema.org description of the tool, shown to search engines as JSON-LD.
const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Image Converter',
    url,
    description,
    image,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
        'Lossless WebP, AVIF, PNG and TIFF by default',
        '16-bit color kept for 16-bit PNG and TIFF sources',
        'JPEG at quality 95 with full 4:4:4 color',
        'SVG export that keeps vectors, or traces images to paths',
        'Batch conversion of up to 50 images, folders and ZIP files',
        'Images are converted in memory and never stored',
    ],
}

const head: AppHead = {
    title,
    meta: [
        { name: 'description', content: description },
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { name: 'theme-color', content: '#20242c' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Image Converter' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: image },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: imageAlt },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
        { name: 'twitter:image:alt', content: imageAlt },
    ],
    link: [
        { rel: 'canonical', href: url },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData) }],
}

export default head
