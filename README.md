# Image Converter

A free local tool for preparing project images. No accounts, API keys, paid services, or cloud uploads. Fonts, icons, sample artwork, and conversion libraries are bundled locally.

## Open it

On Windows, double-click **Start Image Converter.cmd**. It opens `http://127.0.0.1:3000` in your browser. Keep the launcher window open while using the converter; press Ctrl+C or close the window to stop it.

Alternatively, run `npm start` in this folder. The launcher builds the app if no production build exists. To use a different port in PowerShell: `$env:PORT=3001; npm.cmd start`.

Dependencies are installed in this workspace. On a new machine, install Node.js 22.12+ (Node 24 recommended), run `npm install`, then `npm start`. In Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`. Internet is needed for the initial dependency download, not for conversion.

## Run with Docker

Install Docker (Docker Desktop on Windows). Copy `.env.example` to `.env` if there is no `.env` yet, then in this folder run:

```sh
docker compose up -d --build   # Build the image and start the converter in the background
docker compose logs -f         # Watch its output
docker compose down            # Stop it
```

Open `http://localhost:3000`. Run `docker compose up -d --build` again after changing source code.

The container listens only on this machine (`127.0.0.1:3000`). Its filesystem is read-only and `/tmp` lives in memory, so uploaded images never touch the disk. It may use at most 1 GB of RAM and no extra swap (`mem_limit` and `memswap_limit` in `compose.yaml`); if it hits the limit, Docker restarts it. The image includes basic fonts (DejaVu, Liberation) for SVG text.

**Environments:** `ENV` in the root `.env` picks the environment, and its settings in `environments/<ENV>.env` are loaded with dotenv. `.env` is not committed, so each machine keeps its own: `ENV=docker` on your PC, `ENV=production` on your server. Docker Compose and the launcher both read it; without `.env`, Docker uses `docker` and the launcher loads nothing (localhost only). Variables already set in the shell take priority over both files. `config/app.ts` reads these values, like Laravel's `config/app.php`, and `nuxt.config.ts` uses it; add new settings there. The `environments/` files are committed, so keep passwords and API keys out of them. Leave `HOST` and `PORT` out of the files used by Docker; the container sets them itself.

| File                          | Used for              | `NUXT_ALLOWED_HOSTS`            |
| ----------------------------- | --------------------- | ------------------------------- |
| `environments/docker.env`     | Docker on this PC     | Empty: localhost only           |
| `environments/production.env` | Docker on your server | Your domain(s), comma-separated |

**Putting it on a server:** replace `example.com` in `environments/production.env` with your domain. On the server, copy `.env.example` to `.env`, set `ENV=production`, then run `docker compose up -d --build`. Requests for any other address are rejected. Point a reverse proxy such as nginx or Caddy at `127.0.0.1:3000` for your domain and HTTPS. The proxy must pass the original `Host` header (`proxy_set_header Host $host;` in nginx) and accept uploads up to 40 MB (`client_max_body_size 40M;`).

## Use it

1. Drop images, folders, or ZIP files onto the page, including several together. **Browse files** accepts multiple images and ZIPs; **Choose folder** includes images from its subfolders. You can also try the included sample.
2. Choose the output format and optional quality, size, and background settings.
3. Click **Convert images**. Download individual files or the whole batch as a ZIP.
4. Click an image thumbnail to compare the source and result. Use **Fit** for an overview or **100%** to inspect export pixels; scroll inside the export to see more.

Changing export settings clears the previous results and makes the batch ready to convert again. Source files are never modified. ZIP downloads contain a flat list of images, with duplicate output names numbered so no image is overwritten. Refreshing or closing the page clears the batch.

**Folders and ZIPs:** The app finds supported images in subfolders and expands ZIPs locally in your browser. Non-image files and macOS metadata are skipped. Folder paths appear beneath image names so files with the same name remain distinguishable. Password-protected or encrypted ZIPs and ZIPs nested inside another ZIP are not supported. Dropping folders depends on your browser; if dragging a folder does not work, use **Choose folder**, or add a ZIP when folder selection is unavailable.

| Format     | Import | Export | Notes                                              |
| ---------- | ------ | ------ | -------------------------------------------------- |
| PNG        | Yes    | Yes    | Lossless, supports alpha transparency              |
| WebP       | Yes    | Yes    | Quality control or lossless; supports transparency |
| JPG / JPEG | Yes    | Yes    | Quality control; selected solid background         |
| SVG        | Yes    | Yes    | Preserve vectors, trace, or embed on output        |
| AVIF       | Yes    | Yes    | Quality control or lossless; supports transparency |
| GIF        | Yes    | Yes    | First frame only; limited palette                  |
| TIFF       | Yes    | Yes    | First page only; lossless LZW output               |
| ICO        | No     | Yes    | Single PNG-based icon, up to 256 × 256             |

**Quality defaults:** WebP and AVIF use lossless compression by default. PNG and TIFF also use lossless compression, with 16-bit channels retained for 16-bit sources. JPEG starts at quality 95 with full color resolution, but is always lossy. Color-managed raster images are converted to sRGB for consistent viewing. Resizing or choosing a lossy format can change pixels even when the source looks sharp.

**SVG to PNG and other raster formats:** Small SVGs render directly at a 2048 px longest edge by default. This prevents tiny SVG icons from becoming tiny, blurry-looking downloads when used at larger sizes. Choose original dimensions, 1024, 2048, or 4096 px, or enter a custom width/height. Larger source SVGs keep their original size unless custom dimensions are supplied. Pure vector artwork scales cleanly; embedded bitmap images still have their original detail, and text depends on locally installed fonts. Each file shows its intended export dimensions before conversion.

**SVG output:** “Keep original appearance” preserves existing SVG vectors with transparency and aspect ratio retained. Adding a solid background or stretching the artwork embeds a PNG so original CSS, opacity, and letterboxing render correctly. Raster inputs are also embedded without tracing. These embedded images keep their raster appearance but do not become editable vector paths. “Trace to vector paths” creates actual paths, best for logos and flat sticker art; it approximates shapes, edges, and colors, including when the input is already SVG. Tracing defaults to 32 colors at a maximum of 1024 px, with 512/1024/1536 px detail choices, while retaining the requested output dimensions. “Embed image in SVG” explicitly rasterizes any input. External SVG images must first be embedded; active content and external dependencies are rejected.

**Transparency:** Keeping transparency preserves an existing alpha channel; it does not remove a background. JPG always flattens to your selected color. GIF has limited transparency. TIFF downloads are valid images but cannot be previewed directly in most browsers.

**Resizing:** Aspect ratio is preserved by fitting inside the supplied dimensions. Turn it off to stretch when both dimensions are set. Smaller raster images are not enlarged unless enabled; SVG vectors always render at the requested size. Enlarging a raster image cannot restore missing detail. ICO uses a square canvas up to 256 × 256 with centered artwork and padding. The sticker preset exports transparent PNG within 2048 × 2048; the web preset deliberately uses lossy WebP at quality 82 within 1600 × 1600 for smaller files.

**Limits:** 40 MB per image, 40 megapixels per image, 8192 px per requested dimension, and 50 images / 200 MB of image data per batch. A ZIP file can be up to 200 MB compressed; the images inside must fit the remaining batch count and size limits, and each extracted image must be at most 40 MB. A ZIP that exceeds these limits is rejected as a whole with an explanation. Animated and multipage files export only their first frame or page. This is not a universal document or GPU texture converter: HEIC, PDF, PSD, EPS, BMP, and ETC2 are not supported.

## Local processing

The browser sends image bytes only to this machine's loopback server. Processing happens in memory using [Sharp](https://sharp.pixelplumbing.com/) and [ImageTracer](https://github.com/jankovicsandras/imagetracerjs). ZIP import and download use fflate in the browser. Only extracted image bytes are sent to the local conversion server. The app does not save uploaded images, retain conversion history, or contact an online conversion service. Downloaded files are saved by your browser.

The launcher binds to `127.0.0.1`. Image endpoints reject cross-origin requests and any host other than localhost or the domains listed in `NUXT_ALLOWED_HOSTS`. Nuxt devtools and telemetry are disabled.

## Development and checks

The frontend follows the same feature-based organization as `cloud/frontend`:

```text
app/
    app.vue                            # Nuxt layout/page shell
    pages/index.vue                    # Route entry
    layouts/default.vue                # Shared studio layout
    components/
        base/                          # MButton, MModal
        layout/                        # Topbar
        features/converter/
            Index.vue                  # Feature composition and presentation state
            Banner.vue, Presets.vue, Upload.vue
            Actions.vue, Preview.vue, FormatGuide.vue
            queue/                     # Queue and file item
            settings/                  # Format, dimensions, background
    composables/features/converter/    # Batch lifecycle, requests, presets, downloads
    data/features/converter.ts         # Format, preset, and guide definitions
    types/features/converter.ts        # Typed frontend contracts
    utils/                             # Formatting, browser download, folder and ZIP import/export
    assets/main.css                    # Stylesheet entry point
    assets/css/                        # Tokens, reset, typography, shared controls
shared/image-settings.mjs              # Shared export defaults and dimensions
server/                                # Local conversion endpoints and image engine
config/app.ts                          # App settings read from the environment, used by nuxt.config.ts
environments/                          # docker.env and production.env, chosen by ENV in .env
scripts/                               # Windows launcher (start.mjs), Docker entry (serve.mjs), env loader
```

Pages compose features, and features explicitly import their sections. Component-specific styles are scoped beside their templates; global CSS contains foundations and shared controls. `useImageConverter` owns each page's in-memory batch, cancels requests on teardown, ignores stale responses, and releases generated file URLs. Dialog, drag, and preview state stays in the feature UI. The shared export settings remain the source of truth for both the frontend and conversion engine.

```sh
npm run dev        # Local development with hot reload
npm run typecheck  # Vue and server TypeScript checks
npm run build      # Rebuild after changing source code
npm start          # Run the production build and open the browser
```

`npm start -- --no-open` starts without opening a browser. Restart an already running launcher after rebuilding to load the new version.

The workspace uses a compact top bar, a file area with quick presets, and a separate export panel. The layout stacks on smaller screens. Prettier, EditorConfig, and VS Code settings use four spaces for indentation.

The dependency audit currently reports inherited Nuxt tooling advisories involving simple-git, node-forge, and braces. Devtools are disabled, and these tools are not used by conversion endpoints. Do not run `npm audit fix --force`: its suggested Nuxt downgrade would replace the current framework major version. Recheck upstream updates before any deployment beyond localhost.
