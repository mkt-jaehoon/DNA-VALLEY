import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve("public/images");

const sources = [
  {
    name: "hero-desktop",
    url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1600&q=85",
    width: 1200,
    height: 675,
    fit: "cover",
    position: "center",
    quality: 72,
  },
  {
    name: "hero-mobile",
    url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=85",
    width: 720,
    height: 1280,
    fit: "cover",
    position: "center",
    quality: 70,
  },
  {
    name: "swab-banner",
    url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=85",
    width: 1200,
    height: 675,
    fit: "cover",
    position: "center",
    quality: 72,
  },
  {
    name: "dna-banner",
    url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=85",
    width: 1200,
    height: 675,
    fit: "cover",
    position: "center",
    quality: 72,
  },
  {
    name: "lab",
    url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=85",
    width: 800,
    height: 800,
    fit: "cover",
    position: "center",
    quality: 70,
  },
];

await fs.mkdir(outputDir, { recursive: true });

for (const source of sources) {
  const response = await fetch(source.url);

  if (!response.ok) {
    throw new Error(`Failed to download ${source.name}: ${response.status}`);
  }

  const input = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(outputDir, `${source.name}.webp`);

  await sharp(input)
    .resize({
      width: source.width,
      height: source.height,
      fit: source.fit,
      position: source.position,
      withoutEnlargement: true,
    })
    .webp({ quality: source.quality, effort: 6 })
    .toFile(outputPath);

  const stat = await fs.stat(outputPath);
  console.log(`${source.name}.webp ${Math.round(stat.size / 1024)}KB`);
}
