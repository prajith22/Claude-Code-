#!/usr/bin/env node
/**
 * Fetches a unique image per product from Unsplash and saves it to
 * public/products/<productId>.jpg. Idempotent — re-runs skip existing files.
 *
 * When (and only when) every product has a file on disk, it rewrites
 * data/products.json so each product's `imageUrl` points at `/products/<id>.jpg`.
 *
 * Usage:  node scripts/fetch-product-images.mjs
 * Needs:  Node 18+ (global fetch), network access to images.unsplash.com
 */

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MAPPING_PATH = join(__dirname, "product-images.json");
const PRODUCTS_PATH = join(ROOT, "data", "products.json");
const OUT_DIR = join(ROOT, "public", "products");

const PRIMARY = (photoId) =>
  `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&auto=format&q=80`;

const FALLBACK = (keywords) =>
  `https://source.unsplash.com/800x800/?${encodeURIComponent(
    keywords.split(",").map((s) => s.trim()).filter(Boolean).join(","),
  )}`;

async function exists(path) {
  try {
    const s = await stat(path);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

async function download(url, outPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`response too small (${buf.length}B)`);
  await writeFile(outPath, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mapping = JSON.parse(await readFile(MAPPING_PATH, "utf8"));
  const products = mapping.products;
  const entries = Object.entries(products);

  const downloaded = [];
  const skipped = [];
  const failed = [];

  for (const [productId, cfg] of entries) {
    const outPath = join(OUT_DIR, `${productId}.jpg`);
    if (await exists(outPath)) {
      skipped.push(productId);
      continue;
    }

    const attempts = [];
    if (cfg.photoId) attempts.push({ label: "photoId", url: PRIMARY(cfg.photoId) });
    if (cfg.keywords) attempts.push({ label: "keywords", url: FALLBACK(cfg.keywords) });

    let ok = false;
    let lastErr = "no attempts";
    for (const { label, url } of attempts) {
      try {
        const bytes = await download(url, outPath);
        console.log(`✓ ${productId} (${label}) ${(bytes / 1024).toFixed(0)} KB`);
        downloaded.push(productId);
        ok = true;
        break;
      } catch (err) {
        lastErr = `${label}: ${err.message}`;
      }
    }
    if (!ok) {
      console.log(`✗ ${productId}  ${lastErr}`);
      failed.push({ productId, error: lastErr, cfg });
    }
  }

  const total = entries.length;
  console.log("");
  console.log(`── summary ──`);
  console.log(`  downloaded: ${downloaded.length}`);
  console.log(`  skipped:    ${skipped.length} (already on disk)`);
  console.log(`  failed:     ${failed.length}`);

  if (failed.length > 0) {
    console.log("");
    console.log("Some products could not be fetched. Edit their entries in");
    console.log("scripts/product-images.json (fix `photoId` or `keywords`) then re-run.");
    console.log("");
    console.log("data/products.json was NOT rewritten (images are incomplete).");
    process.exit(1);
  }

  // All files present. Rewrite products.json so imageUrl points to local paths.
  const raw = await readFile(PRODUCTS_PATH, "utf8");
  const list = JSON.parse(raw);
  let changed = 0;
  for (const p of list) {
    const target = `/products/${p.id}.jpg`;
    if (p.imageUrl !== target) {
      p.imageUrl = target;
      changed++;
    }
  }
  await writeFile(PRODUCTS_PATH, JSON.stringify(list, null, 2) + "\n");
  console.log("");
  console.log(`✓ Wrote ${changed} imageUrl updates to data/products.json`);
  console.log(`✓ All ${total} products now reference /products/<id>.jpg`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
