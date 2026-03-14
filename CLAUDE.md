# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

Test the wallpaper endpoint directly:
```
http://localhost:3000/api/wallpaper?birthday=1990-01-01&view=year&theme=midnight
```

## Architecture

**`app/api/wallpaper/route.ts`** — Core PNG generation. Uses `@napi-rs/canvas` (not `node-canvas`) because it bundles native binaries that work in Vercel serverless without additional build config. The route:
1. Parses query params (birthday, view, theme, device, style)
2. Creates a canvas at the target device resolution
3. Dispatches to `drawYearView` or `drawLifeView`
4. Returns `image/png` bytes with `no-cache` headers

**`app/page.tsx`** — Client component. Builds the wallpaper URL from state, renders a CSS phone mockup that loads the API image, and shows iOS Shortcut setup steps. No external UI library — all inline styles.

**`next.config.js`** — `serverComponentsExternalPackages: ['@napi-rs/canvas']` is required so Next.js doesn't try to bundle the native canvas module.

## Key design decisions

- `@napi-rs/canvas` is preferred over `satori`+`resvg-js` because it provides a full Canvas 2D API making precise dot math straightforward.
- All dot sizing uses proportional math (`width * factor`) so designs scale correctly across all four device resolutions.
- The top 22% of the canvas is reserved for the iPhone clock/status overlay on the lock screen.
- `Cache-Control: no-store` on the API ensures iOS Shortcuts always fetches a fresh image.
