import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const TILE = "#3B2620";
const INK = "#F1F3F2";

const full = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><polygon points="61.44,0 450.56,0 512,61.44 512,450.56 450.56,512 61.44,512 0,450.56 0,61.44" fill="${TILE}"/><path transform="translate(142.25 367) scale(0.36)" fill="${INK}" d="M0 0V-10H1Q36 -10 58.5 -30.5Q81 -51 81 -84V-666Q79 -700 57.5 -720Q36 -740 1 -740H0V-750H297Q378 -750 437.5 -729Q497 -708 530 -670.5Q563 -633 563 -582Q563 -524 513.5 -482Q464 -440 384 -430Q458 -426 513.5 -400.5Q569 -375 600.5 -332Q632 -289 632 -232Q632 -164 592.5 -111.5Q553 -59 481 -29.5Q409 0 311 0ZM235 -437H297Q348 -437 379.5 -477.5Q411 -518 411 -586Q411 -655 379.5 -696Q348 -737 297 -737H235ZM311 -13Q385 -13 428.5 -69Q472 -125 472 -220Q472 -311 424.5 -366.5Q377 -422 297 -422H235V-84Q235 -13 311 -13Z"/><rect x="96" y="367" width="320" height="16" fill="${INK}"/><rect x="96" y="407" width="320" height="8" fill="${INK}" fill-opacity="0.5"/></svg>`;

const small = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="4,0 28,0 32,4 32,28 28,32 4,32 0,28 0,4" fill="${TILE}"/><path transform="translate(8.42 24) scale(0.024)" fill="${INK}" stroke="${INK}" stroke-width="34" stroke-linejoin="round" d="M0 0V-10H1Q36 -10 58.5 -30.5Q81 -51 81 -84V-666Q79 -700 57.5 -720Q36 -740 1 -740H0V-750H297Q378 -750 437.5 -729Q497 -708 530 -670.5Q563 -633 563 -582Q563 -524 513.5 -482Q464 -440 384 -430Q458 -426 513.5 -400.5Q569 -375 600.5 -332Q632 -289 632 -232Q632 -164 592.5 -111.5Q553 -59 481 -29.5Q409 0 311 0ZM235 -437H297Q348 -437 379.5 -477.5Q411 -518 411 -586Q411 -655 379.5 -696Q348 -737 297 -737H235ZM311 -13Q385 -13 428.5 -69Q472 -125 472 -220Q472 -311 424.5 -366.5Q377 -422 297 -422H235V-84Q235 -13 311 -13Z"/><rect x="6" y="24" width="20" height="2" fill="${INK}"/></svg>`;

const tiny = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><polygon points="2,0 14,0 16,2 16,14 14,16 2,16 0,14 0,2" fill="${TILE}"/><path fill="${INK}" fill-rule="evenodd" d="M4 3H9.6C11.3 3 12.1 4 12.1 5.3C12.1 6.4 11.5 7.2 10.6 7.5C11.8 7.8 12.5 8.7 12.5 10C12.5 11.8 11.3 13 9.4 13H4ZM6.2 4.8V6.9H9C9.6 6.9 10 6.5 10 5.85C10 5.2 9.6 4.8 9 4.8ZM6.2 8.6V11.2H9.3C9.9 11.2 10.3 10.7 10.3 9.9C10.3 9.1 9.9 8.6 9.3 8.6Z"/></svg>`;

const targets = [
  { size: 16, name: "favicon-16x16.png", source: tiny },
  { size: 32, name: "favicon-32x32.png", source: small },
  { size: 180, name: "apple-touch-icon.png", source: full },
  { size: 192, name: "android-chrome-192x192.png", source: full },
  { size: 512, name: "android-chrome-512x512.png", source: full },
];

async function render(source, size) {
  return sharp(Buffer.from(source), { density: Math.max(72, Math.ceil((72 * size) / 32)) })
    .resize(size, size)
    .png()
    .toBuffer();
}

for (const { size, name, source } of targets) {
  await writeFile(join(publicDir, name), await render(source, size));
  console.log("Generated", name);
}

const icoImages = [
  { size: 16, data: await render(tiny, 16) },
  { size: 32, data: await render(small, 32) },
  { size: 48, data: await render(small, 48) },
];

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);

let offset = 6 + icoImages.length * 16;
const entries = icoImages.map(({ size, data }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

await writeFile(join(publicDir, "favicon.ico"), Buffer.concat([header, ...entries, ...icoImages.map((i) => i.data)]));
console.log("Generated favicon.ico (16, 32, 48)");
