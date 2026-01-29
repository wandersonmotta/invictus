type Area = { width: number; height: number; x: number; y: number };

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    // Allow working with object URLs / same-origin public URLs
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

/**
 * Recebe a imagem original + área em pixels e retorna um Blob já recortado (quadrado).
 * A UI pode usar crop circular, mas o arquivo final é quadrado (ideal para avatar).
 */
export async function getCroppedImageBlob(options: {
  imageSrc: string;
  cropPixels: Area;
  size?: number;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number; // only for jpeg
}) {
  const { imageSrc, cropPixels, size = 512, mimeType = "image/jpeg", quality = 0.9 } = options;
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sx = Math.max(0, cropPixels.x);
  const sy = Math.max(0, cropPixels.y);
  const sWidth = Math.max(1, cropPixels.width);
  const sHeight = Math.max(1, cropPixels.height);

  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Falha ao gerar imagem"));
        else resolve(b);
      },
      mimeType,
      mimeType === "image/jpeg" ? quality : undefined,
    );
  });

  return blob;
}
