# PWA Icons + Manifest — Design Spec

**Date:** 2026-05-27  
**Status:** Approved

## Goal
Replace default Next.js favicon/icons with the app logo. Configure manifest for installable PWA. App icon appears correctly when installed.

## Files
- Create: `scripts/generate-icons.mjs`
- Create: `public/manifest.json`
- Create: `public/icons/` (generated PNG files)
- Modify: `app/layout.tsx`

## Icon Generation

Script `scripts/generate-icons.mjs` reads `public/logo.svg` via `sharp` (available as Next.js transitive dep) and outputs:

| File | Size | Use |
|------|------|-----|
| `public/icons/icon-16.png` | 16×16 | Browser tab fallback |
| `public/icons/icon-32.png` | 32×32 | Favicon |
| `public/icons/icon-48.png` | 48×48 | Windows |
| `public/icons/icon-180.png` | 180×180 | Apple touch icon |
| `public/icons/icon-192.png` | 192×192 | PWA manifest |
| `public/icons/icon-512.png` | 512×512 | PWA splash / store |

Run once: `node scripts/generate-icons.mjs`

No `.ico` binary needed — modern browsers accept PNG via `<link rel="icon">`.

## manifest.json

```json
{
  "name": "Trace My Money",
  "short_name": "TMM",
  "description": "Visual money mapping canvas",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#F7F5F2",
  "theme_color": "#F7F5F2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

## layout.tsx Metadata

```ts
export const metadata: Metadata = {
  // existing fields...
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/icons/icon-180.png', sizes: '180x180' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Trace My Money',
  },
};
```

Also add to `<html>` tag: `<meta name="theme-color" content="#F7F5F2" />` via metadata.themeColor.

## Safe Areas
Already handled in TopBrandBar and BottomNav via `env(safe-area-inset-*)`. No new changes needed.

## Acceptance Criteria
- [ ] Browser tab shows app logo favicon
- [ ] iOS "Add to Home Screen" shows correct icon
- [ ] Installed PWA icon is the app logo
- [ ] manifest.json is valid and served correctly
- [ ] `display: standalone` works — no browser chrome when installed
- [ ] Theme color matches app background
