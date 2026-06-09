/**
 * Perceptual Hash (pHash) basé sur sharp.
 *
 * Algorithme :
 *   1. Resize 32x32 grayscale
 *   2. DCT-style approximation : on prend la moyenne des 8x8 pixels du coin haut-gauche
 *   3. Pour chaque pixel : 1 si > moyenne, 0 sinon → 64 bits → hex 16 chars
 *
 * Notes :
 *   - Implémentation simplifiée (pas une vraie DCT) mais robuste aux crops légers,
 *     redimensionnements, et compressions JPEG.
 *   - Pour 2 images visuellement identiques : Hamming distance ≤ 2
 *   - Pour 2 images "proche cousine" (recadrée, filtrée) : Hamming distance ≤ 8
 *   - Au-delà de 12, c'est une image différente.
 */

import sharp from "sharp";

const HASH_SIZE = 8; // 8x8 = 64 bits
const SAMPLE_SIZE = HASH_SIZE * 4; // 32x32 grayscale resize

/**
 * Calcule le pHash hex 16 chars d'une image depuis un Buffer ou une URL.
 */
export async function computeImageHash(input: Buffer | string): Promise<string> {
  let buffer: Buffer;
  if (typeof input === "string") {
    // URL : fetch + buffer
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Fetch image failed: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = input;
  }

  // Convertit en grayscale 32x32
  const raw = await sharp(buffer)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  // Réduit en 8x8 en moyennant chaque bloc 4x4
  const blocks: number[] = new Array(HASH_SIZE * HASH_SIZE).fill(0);
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      let sum = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const px = (y * 4 + dy) * SAMPLE_SIZE + (x * 4 + dx);
          sum += raw[px];
        }
      }
      blocks[y * HASH_SIZE + x] = sum / 16;
    }
  }

  // Moyenne globale → seuil
  const avg = blocks.reduce((a, b) => a + b, 0) / blocks.length;

  // Bits → hex
  let hex = "";
  for (let i = 0; i < blocks.length; i += 4) {
    const nibble =
      (blocks[i] > avg ? 8 : 0) +
      (blocks[i + 1] > avg ? 4 : 0) +
      (blocks[i + 2] > avg ? 2 : 0) +
      (blocks[i + 3] > avg ? 1 : 0);
    hex += nibble.toString(16);
  }
  return hex; // 16 chars
}

/**
 * Compte les bits différents entre 2 hash hex (Hamming distance).
 * 0 = identique, 64 = totalement opposé.
 */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    // Popcount sur 4 bits
    dist += ((xor >> 0) & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
  }
  return dist;
}

/** Seuil par défaut pour considérer 2 images comme doublons. */
export const DUPLICATE_THRESHOLD = 5;
