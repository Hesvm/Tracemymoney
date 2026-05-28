# PWA Icons + Manifest Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace default Next.js favicon/icons with app logo. Configure manifest.json for installable PWA.

**Architecture:** Script reads `public/logo.svg` via `sharp`, outputs PNG icons. `public/manifest.json` declares PWA metadata. `app/layout.tsx` updated with proper icon/manifest metadata.

**Tech Stack:** Next.js 15, sharp (transitive dep), Node.js

---

### Task 1: Create icon generation script

**Files:**
- Create: `scripts/generate-icons.mjs`

- [ ] **Step 1: Check that logo.svg exists**

```bash
ls public/logo.svg
```

Expected: file exists.

- [ ] **Step 2: Create scripts directory if needed**

```bash
mkdir -p scripts
```

- [ ] **Step 3: Create generate-icons.mjs**

```mjs
// scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "logo.svg");
const OUT = join(ROOT, "public", "icons");

mkdirSync(OUT, { recursive: true });

const sizes = [16, 32, 48, 180, 192, 512];

for (const size of sizes) {
  await sharp(SRC)
    .resize(size, size)
    .png()
    .toFile(join(OUT, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

console.log("Done.");
```

- [ ] **Step 4: Run the script**

```bash
cd /Users/hesam/Code-Projects/Trace-My-Money && node scripts/generate-icons.mjs
```

Expected: 6 lines of `✓ icon-<n>.png` + "Done."

- [ ] **Step 5: Verify icons exist**

```bash
ls public/icons/
```

Expected: `icon-16.png icon-32.png icon-48.png icon-180.png icon-192.png icon-512.png`

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-icons.mjs public/icons/
git commit -m "feat(pwa): add icon generation script and generated PNG icons"
```

---

### Task 2: Create manifest.json

**Files:**
- Create: `public/manifest.json`

- [ ] **Step 1: Create manifest.json**

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

- [ ] **Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "feat(pwa): add manifest.json for installable PWA"
```

---

### Task 3: Update app/layout.tsx metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Read layout.tsx**

Read `app/layout.tsx` to see current metadata export.

- [ ] **Step 2: Update metadata**

Find the `export const metadata: Metadata = {` block. Add/update:
- `manifest: '/manifest.json'`
- `icons` with `icon` array (32px, 16px) and `apple` (180px)
- `appleWebApp` with `capable: true`, `statusBarStyle: 'default'`, `title: 'Trace My Money'`

- [ ] **Step 3: Add theme-color meta**

In the metadata object, add:
```ts
themeColor: '#F7F5F2',
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(pwa): configure icons, manifest, and apple web app metadata"
```
