# Waktu+

Prayer times, Al-Quran & Islamic calendar for Malaysia. Free, no ads, no signup.

## Development

```bash
pnpm install
pnpm dev
```

## Deploy to Cloudflare Workers

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed via `pnpm install`)

### Environment variables

Create `.dev.vars` for local preview (optional):

```
NEXTJS_ENV=development
```

For Cloudflare Web Analytics, set `NEXT_PUBLIC_CF_BEACON_TOKEN` in your Cloudflare Pages/Workers env or `.dev.vars`. Get the token from [Cloudflare Web Analytics](https://dash.cloudflare.com/?to=/:account/web-analytics).

### Build and deploy

```bash
pnpm install
pnpm run deploy
```

Or build and preview locally:

```bash
pnpm run preview
```

Then open the URL shown (e.g. `http://localhost:8787`).

**Note:** `pnpm run preview` may fail on Windows due to Wrangler path handling. Use WSL for local preview, or deploy to Cloudflare and test there.

### API endpoints

- `GET /api/locate?lat=&lng=` – Get zone from GPS
- `GET /api/prayer?zone=WLY01&year=&month=` – Prayer times
- `GET /api/quran?endpoint=surah/1` – Quran data proxy
- `GET /api/time` – Server time (Asia/Kuala_Lumpur)
