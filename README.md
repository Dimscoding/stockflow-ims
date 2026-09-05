# StockFlow IMS

StockFlow is a responsive inventory management system built as a portfolio project by **Dimas Riyanto**. It presents a realistic workspace for monitoring stock, recording movements, mapping warehouse zones, and reviewing operational reports.

## Current features

- Inventory dashboard with stock, valuation, and movement summaries
- Searchable item table with low-stock and out-of-stock states
- Add-item workflow with device-local demo persistence
- Incoming, outgoing, transfer, and adjustment activity views
- Interactive warehouse map powered by tldraw
- Browser voice-command demo with a prepared Whisper service boundary
- Light and dark themes
- Responsive navigation and layouts for desktop and mobile
- Search-engine metadata, robots, and sitemap routes

## Technology

- Next.js 16 and React 19
- TypeScript
- Recharts
- Lucide icons
- tldraw
- Vercel deployment

## Run locally

```bash
npm install
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Integration notes

See [INTEGRATIONS.md](./INTEGRATIONS.md) for the role and licensing notes of No AI Slop, tldraw, OpenAI Whisper, and OpenSEO.

The current release is a front-end portfolio demo. Multi-user authentication, durable cloud storage, role permissions, and audit logs are planned for the database-backed release.
