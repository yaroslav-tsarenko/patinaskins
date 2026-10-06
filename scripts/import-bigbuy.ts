import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { catalogConfig } from "../src/config/catalog";
import { getR2Object, hasR2PublicUrl, headR2Object, isR2Configured, putR2Object, r2PublicUrl } from "../src/lib/r2";
import { loadSource } from "./lib/bigbuy-source";
import { syncImages, type ImageStore } from "./lib/catalog-images";
import { buildCategoryNodes, buildPreview, finalizeTree, selectCatalog, validateConfig, type CategoryNode, type SelectedProduct } from "./lib/catalog-select";

interface Cli {
  dryRun: boolean;
  skipImages: boolean;
  skipVariants: boolean;
  refresh: boolean;
  fixturesDir: string | null;
  limit: number | undefined;
  previewPath: string;
  concurrency: number;
}

function parseArgs(argv: string[]): Cli {
  const value = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
    const eq = argv.find((a) => a.startsWith(`${flag}=`));
    return eq ? eq.slice(flag.length + 1) : null;
  };
  const known = ["--dry-run", "--skip-images", "--self-host", "--skip-variants", "--refresh", "--fixtures", "--limit", "--preview", "--concurrency", "--help"];
  for (const a of argv) {
    if (a.startsWith("--") && !known.includes(a.split("=")[0])) throw new Error(`unknown flag ${a}`);
  }
  if (argv.includes("--help")) {
    console.log(`usage: tsx scripts/import-bigbuy.ts [--dry-run] [--skip-images] [--self-host] [--skip-variants] [--refresh] [--fixtures <dir>] [--limit <n>] [--preview <file>] [--concurrency <n>]`);
    process.exit(0);
  }
  const fixtures = value("--fixtures") || process.env.BIGBUY_FIXTURES_DIR || null;
  const limitRaw = value("--limit") || process.env.LIMIT;
  return {
    dryRun: argv.includes("--dry-run"),
    skipImages: argv.includes("--skip-images") || (catalogConfig.images.hosting === "supplier" && !argv.includes("--self-host")),
    skipVariants: argv.includes("--skip-variants"),
    refresh: argv.includes("--refresh"),
    fixturesDir: fixtures ? path.resolve(fixtures) : null,
    limit: limitRaw ? Number(limitRaw) : undefined,
    previewPath: path.resolve(value("--preview") || path.join(__dirname, "../data/catalog-preview.json")),
    concurrency: Number(value("--concurrency") || process.env.IMAGE_CONCURRENCY || catalogConfig.images.concurrency),
  };
}

const cli = parseArgs(process.argv.slice(2));
const BIGBUY_TOKEN = process.env.BIGBUY_API_PRODUCTION;
const DIRECT_URL = process.env.DIRECT_URL;
const ISO_CODE = process.env.BIGBUY_ISO_CODE || catalogConfig.source.isoCode;
const CACHE_DIR = process.env.BIGBUY_CACHE_DIR || path.join(__dirname, "../data/bigbuy-cache");
const MANIFEST_PATH = path.resolve(process.env.IMAGE_MANIFEST || path.join(__dirname, "../data/r2-image-manifest.json"));

let client: pg.Client;

function sslFor(url: string): false | { rejectUnauthorized: boolean } {
  if (/sslmode=disable/.test(url) || /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(url)) return false;
  return { rejectUnauthorized: false };
}

async function connect() {
  client = new pg.Client({ connectionString: DIRECT_URL, ssl: sslFor(DIRECT_URL!) });
  client.on("error", () => {});
  await client.connect();
}

async function query(sql: string, params?: unknown[]) {
  return client.query(sql, params);
}

function cuid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 12)}`;
}

async function insertBatched(table: string, cols: string[], rows: unknown[][], suffix = "", batch = 200): Promise<pg.QueryResult[]> {
  const results: pg.QueryResult[] = [];
  for (let i = 0; i < rows.length; i += batch) {
    const chunk = rows.slice(i, i + batch);
    const values: unknown[] = [];
    const placeholders = chunk.map((r, j) => {
      values.push(...r);
      return `(${cols.map((_, k) => `$${j * cols.length + k + 1}`).join(",")})`;
    });
    results.push(await query(`INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES ${placeholders.join(",")} ${suffix}`, values));
    process.stdout.write(`\r  ${table}: ${Math.min(i + batch, rows.length)}/${rows.length}   `);
  }
  if (rows.length) process.stdout.write("\n");
  return results;
}

function r2Store(): ImageStore {
  return {
    head: (key) => headR2Object(key),
    put: (key, body, contentType, metadata) => putR2Object(key, body, contentType, { metadata, cacheControl: "public, max-age=2592000" }),
    publicUrl: (key) => r2PublicUrl(key),
    get: (key) => getR2Object(key),
  };
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

async function writeCatalog(products: SelectedProduct[], categories: CategoryNode[], imageUrls: Map<string, string[]>, brands: Array<{ name: string; count: number }>) {
  await connect();
  const now = new Date().toISOString();
  try {
    await query("BEGIN");

    console.log("  categories...");
    const existingCats = await query('SELECT id, slug FROM "Category"');
    const catIdBySlug = new Map<string, string>(existingCats.rows.map((r: { id: string; slug: string }) => [r.slug, r.id]));
    const keepSlugs = categories.map((c) => c.slug);
    await query('DELETE FROM "ProductCategory"');
    await query('UPDATE "Category" SET "parentId" = NULL WHERE slug <> ALL($1::text[])', [keepSlugs]);
    await query('DELETE FROM "Category" WHERE slug <> ALL($1::text[])', [keepSlugs]);
    const productBySlug = new Map(products.map((p) => [p.slug, p]));
    for (const c of [...categories].sort((a, b) => Number(Boolean(a.parentSlug)) - Number(Boolean(b.parentSlug)))) {
      const art = c.artProductSlug ? productBySlug.get(c.artProductSlug) : null;
      const imageUrl = art ? imageUrls.get(art.sku)?.[0] ?? null : null;
      const parentId = c.parentSlug ? catIdBySlug.get(c.parentSlug) ?? null : null;
      const id = catIdBySlug.get(c.slug);
      if (id) {
        await query(
          `UPDATE "Category" SET name=$2, description=$3, "imageUrl"=$4, "parentId"=$5, "sortOrder"=$6, "isActive"=true, "updatedAt"=$7 WHERE id=$1`,
          [id, c.name, c.description, imageUrl, parentId, c.sortOrder, now],
        );
      } else {
        const newId = cuid();
        await query(
          `INSERT INTO "Category" (id, name, slug, description, "imageUrl", "parentId", "sortOrder", "isActive", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$8)`,
          [newId, c.name, c.slug, c.description, imageUrl, parentId, c.sortOrder, now],
        );
        catIdBySlug.set(c.slug, newId);
      }
    }

    console.log("  retiring products that left the catalog...");
    const skus = products.map((p) => p.sku);
    const stale = await query('SELECT id FROM "Product" WHERE sku <> ALL($1::text[])', [skus]);
    const staleIds: string[] = stale.rows.map((r: { id: string }) => r.id);
    const referenced = staleIds.length
      ? (await query('SELECT DISTINCT "productId" AS id FROM "OrderItem" WHERE "productId" = ANY($1::text[])', [staleIds])).rows.map((r: { id: string }) => r.id)
      : [];
    const referencedSet = new Set(referenced);
    const deletable = staleIds.filter((id) => !referencedSet.has(id));
    if (deletable.length) {
      for (const table of ["ProductImage", "ProductCategory", "Review", "WishlistItem", "ProductVariant"]) {
        await query(`DELETE FROM "${table}" WHERE "productId" = ANY($1::text[])`, [deletable]);
      }
      await query('DELETE FROM "Product" WHERE id = ANY($1::text[])', [deletable]);
    }
    if (referenced.length) {
      await query(`UPDATE "Product" SET status='ARCHIVED', quantity=0, "updatedAt"=$2 WHERE id = ANY($1::text[])`, [referenced, now]);
    }
    console.log(`  removed ${deletable.length}, archived ${referenced.length} (referenced by orders)`);

    const taken = new Set<string>(
      referenced.length ? (await query('SELECT slug FROM "Product" WHERE id = ANY($1::text[])', [referenced])).rows.map((r: { slug: string }) => r.slug) : [],
    );
    for (const p of products) {
      if (!taken.has(p.slug)) continue;
      let i = 2;
      while (taken.has(`${p.slug}-${i}`)) i++;
      p.slug = `${p.slug}-${i}`;
    }
    await query(`UPDATE "Product" SET slug = '__reslug__' || id WHERE sku = ANY($1::text[])`, [skus]);

    console.log("  products...");
    const cols = ["id", "name", "slug", "sku", "description", "shortDescription", "price", "comparePrice", "costPrice", "quantity", "weight", "status", "brand", "gtin", "ean", "mpn", "condition", "metadata", "metaTitle", "metaDescription", "createdAt", "updatedAt"];
    const rows = products.map((p) => [
      cuid(), p.name, p.slug, p.sku, p.descriptionHtml, p.shortDescription, p.price, null, p.costPrice, p.quantity, p.weight,
      "ACTIVE", p.brand, p.ean, p.ean, null, "new", JSON.stringify({ sourceRef: p.sourceId, sourceSku: p.sourceSku }), null, null, now, now,
    ]);
    const upsert = `ON CONFLICT (sku) DO UPDATE SET
      name=EXCLUDED.name, slug=EXCLUDED.slug, description=EXCLUDED.description, "shortDescription"=EXCLUDED."shortDescription",
      price=EXCLUDED.price, "costPrice"=EXCLUDED."costPrice", quantity=EXCLUDED.quantity, weight=EXCLUDED.weight, status='ACTIVE',
      brand=EXCLUDED.brand, gtin=EXCLUDED.gtin, ean=EXCLUDED.ean, condition=EXCLUDED.condition,
      metadata=COALESCE("Product".metadata, '{}'::jsonb) || EXCLUDED.metadata, "updatedAt"=EXCLUDED."updatedAt"
      RETURNING id, sku`;
    const results = await insertBatched("Product", cols, rows, upsert);
    const idBySku = new Map<string, string>();
    for (const r of results) for (const row of r.rows as Array<{ id: string; sku: string }>) idBySku.set(row.sku, row.id);
    const productIds = [...idBySku.values()];

    console.log("  images...");
    await query('DELETE FROM "ProductImage" WHERE "productId" = ANY($1::text[])', [productIds]);
    const imageRows: unknown[][] = [];
    for (const p of products) {
      const id = idBySku.get(p.sku);
      if (!id) continue;
      (imageUrls.get(p.sku) || []).forEach((url, i) => {
        imageRows.push([cuid(), url, i === 0 ? p.name : `${p.name}, view ${i + 1}`, i, id]);
      });
    }
    await insertBatched("ProductImage", ["id", "url", "alt", "sortOrder", "productId"], imageRows, "", 500);

    console.log("  category links...");
    const linkRows: unknown[][] = [];
    for (const p of products) {
      const id = idBySku.get(p.sku);
      if (!id) continue;
      for (const slug of [p.primary, p.sub]) {
        const catId = slug ? catIdBySlug.get(slug) : null;
        if (catId) linkRows.push([id, catId]);
      }
    }
    await insertBatched("ProductCategory", ["productId", "categoryId"], linkRows, "ON CONFLICT DO NOTHING", 1000);

    console.log("  brands...");
    const existingBrands = await query('SELECT id, name FROM "Brand"');
    const brandIdByName = new Map<string, string>(existingBrands.rows.map((r: { id: string; name: string }) => [r.name.toLowerCase(), r.id]));
    for (const [i, b] of brands.entries()) {
      const id = brandIdByName.get(b.name.toLowerCase());
      if (id) await query(`UPDATE "Brand" SET "isActive"=true, "sortOrder"=$2, "updatedAt"=$3 WHERE id=$1`, [id, i, now]);
      else await query(`INSERT INTO "Brand" (id, name, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES ($1,$2,true,$3,$4,$4)`, [cuid(), b.name, i, now]);
    }
    await query(`UPDATE "Brand" SET "isActive"=false, "updatedAt"=$2 WHERE lower(name) <> ALL($1::text[])`, [brands.map((b) => b.name.toLowerCase()), now]);

    await query("COMMIT");
  } catch (err) {
    await query("ROLLBACK").catch(() => {});
    throw err;
  }

  const counts: pg.QueryResult[] = [];
  for (const sql of [
    'SELECT count(*)::int as n FROM "Product" WHERE status = \'ACTIVE\'',
    'SELECT count(*)::int as n FROM "Category"',
    'SELECT count(*)::int as n FROM "Category" WHERE "parentId" IS NULL',
    'SELECT count(*)::int as n FROM "ProductImage"',
    'SELECT count(*)::int as n FROM "ProductCategory"',
    'SELECT count(*)::int as n FROM "Brand" WHERE "isActive"',
    'SELECT count(*)::int as n FROM "Category" c WHERE NOT EXISTS (SELECT 1 FROM "ProductCategory" pc WHERE pc."categoryId" = c.id)',
  ]) counts.push(await query(sql));
  await client.end();
  return {
    products: counts[0].rows[0].n as number,
    categories: counts[1].rows[0].n as number,
    topLevel: counts[2].rows[0].n as number,
    images: counts[3].rows[0].n as number,
    links: counts[4].rows[0].n as number,
    brands: counts[5].rows[0].n as number,
    emptyCategories: counts[6].rows[0].n as number,
  };
}

async function main() {
  const mode = cli.dryRun ? "preview (dry run)" : "import";
  console.log(`\n=== Brasmora catalog ${mode} — source: ${cli.fixturesDir ? `fixtures ${cli.fixturesDir}` : "supplier API"}, isoCode=${ISO_CODE} ===\n`);

  const problems = validateConfig(catalogConfig);
  if (problems.length) throw new Error(`catalog config invalid:\n  - ${problems.join("\n  - ")}`);
  if (!cli.dryRun && !DIRECT_URL) throw new Error("DIRECT_URL missing in .env");
  if (!cli.dryRun && !cli.skipImages) {
    if (!isR2Configured()) throw new Error("R2 is not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). Set images.hosting to supplier in src/config/catalog.ts to serve images from the supplier CDN.");
    if (!hasR2PublicUrl()) throw new Error("R2_PUBLIC_URL is missing or points to the private S3 endpoint; images would not be browser-accessible.");
  }

  console.log("[1/5] Loading supplier catalog...");
  const source = await loadSource({
    fixturesDir: cli.fixturesDir,
    token: BIGBUY_TOKEN,
    isoCode: ISO_CODE,
    cacheDir: CACHE_DIR,
    cacheTtlHours: catalogConfig.source.cacheTtlHours,
    refresh: cli.refresh,
    log: (line) => console.log(line),
  });
  console.log(`  products ${source.products.length}, info ${source.info.length}, image sets ${source.images.length}, taxonomies ${source.taxonomies.length}, manufacturers ${source.manufacturers.length}, stock ${source.stock ? source.stock.length : "n/a"}`);
  if (Object.keys(source.dropped).length) console.log(`  malformed records skipped: ${JSON.stringify(source.dropped)}`);

  console.log("[2/5] Selecting and filtering...");
  const selection = selectCatalog(source, catalogConfig, { limit: cli.limit });
  console.log(`  active ${selection.stats.active}, in scope ${selection.stats.inScope}, passed filters ${selection.stats.passedFilters}, selected ${selection.stats.selected}`);
  if (!selection.stats.stockKnown) console.log("  ! stock unknown: quantity set to 999 for every product");

  const meta = { generatedAt: new Date().toISOString(), source: source.origin, isoCode: ISO_CODE, mode: cli.dryRun ? "dry-run" : "import" };
  writeJson(cli.previewPath, buildPreview(selection, meta));
  console.log(`[3/5] Preview written to ${path.relative(process.cwd(), cli.previewPath)}`);

  if (cli.dryRun) {
    printSummary(selection.categories, selection.excluded, null, null);
    return;
  }
  if (!selection.products.length) throw new Error("nothing selected; refusing to wipe the catalog");

  let products = selection.products;
  let categories = selection.categories;
  const imageUrls = new Map<string, string[]>();
  let imageStats: string;
  if (cli.skipImages) {
    console.log("[4/5] Images: served from the supplier CDN (no upload)");
    for (const p of products) imageUrls.set(p.sku, p.images.map((i) => i.sourceUrl));
    imageStats = "supplier CDN URLs";
  } else {
    const variants = cli.skipVariants ? null : catalogConfig.images.variants;
    console.log(`[4/5] Self-hosting images on R2 (concurrency ${cli.concurrency}, ${variants ? `WebP variants ${variants.widths.join("/")} q${variants.quality}` : "variants skipped"})...`);
    const sync = await syncImages(products, r2Store(), {
      prefix: catalogConfig.images.keyPrefix,
      concurrency: cli.concurrency,
      timeoutMs: catalogConfig.images.timeoutMs,
      maxBytes: catalogConfig.images.maxBytes,
      manifestPath: MANIFEST_PATH,
      log: (line) => console.log(line),
      variants,
    });
    const skuBySlug = new Map(products.map((p) => [p.slug, p.sku]));
    for (const [slug, urls] of sync.urls) imageUrls.set(skuBySlug.get(slug)!, urls);
    for (const f of sync.failures.slice(0, 10)) console.log(`  ! ${f.slug} #${f.index}: ${f.error}`);
    const withoutImages = products.filter((p) => !(imageUrls.get(p.sku) || []).length);
    if (withoutImages.length) {
      console.log(`  dropping ${withoutImages.length} products whose images all failed`);
      selection.excluded["image-download-failed"] = withoutImages.length;
      products = products.filter((p) => (imageUrls.get(p.sku) || []).length);
      const tree = finalizeTree(products, catalogConfig, (reason) => {
        selection.excluded[reason] = (selection.excluded[reason] || 0) + 1;
      });
      products = tree.kept;
      categories = buildCategoryNodes(products, catalogConfig, tree.demoted);
    }
    for (const f of sync.variantFailures.slice(0, 10)) console.log(`  ! variants ${f.slug} #${f.index}: ${f.error} (original kept)`);
    imageStats = `uploaded ${sync.uploaded}, manifest hits ${sync.fromManifest}, already in bucket ${sync.alreadyInBucket}, failed ${sync.failed}, variant sets ${sync.variantsGenerated}, variant failures ${sync.variantsFailed}`;
    console.log(`  ${imageStats}`);
    if (sync.bytes.images) {
      const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`;
      const widths = Object.entries(sync.bytes.byWidth).map(([w, v]) => `w${w} ${kb(v.bytes / v.count)}`).join(", ");
      console.log(`  avg original ${kb(sync.bytes.originals / sync.bytes.images)} → ${widths}`);
    }
  }

  console.log("[5/5] Writing to Postgres (single transaction)...");
  const counts = await writeCatalog(products, categories, imageUrls, selection.brands);
  printSummary(categories, selection.excluded, counts, imageStats);
}

function printSummary(
  categories: CategoryNode[],
  excluded: Record<string, number>,
  counts: Awaited<ReturnType<typeof writeCatalog>> | null,
  imageStats: string | null,
) {
  console.log("\n=== summary ===");
  for (const c of categories.filter((x) => !x.parentSlug)) {
    console.log(`  ${c.name.padEnd(28)} ${String(c.productCount).padStart(5)}`);
    for (const s of categories.filter((x) => x.parentSlug === c.slug)) console.log(`    ${s.name.padEnd(26)} ${String(s.productCount).padStart(5)}`);
  }
  const ex = Object.entries(excluded).sort((a, b) => b[1] - a[1]);
  console.log("  excluded:");
  for (const [k, n] of ex) console.log(`    ${k.padEnd(26)} ${String(n).padStart(7)}`);
  if (imageStats) console.log(`  images: ${imageStats}`);
  if (counts) {
    console.log(`  DB → products ${counts.products}, categories ${counts.categories} (top-level ${counts.topLevel}), images ${counts.images}, links ${counts.links}, active brands ${counts.brands}, empty categories ${counts.emptyCategories}`);
  }
}

main().catch((err) => {
  console.error("\nimport failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
