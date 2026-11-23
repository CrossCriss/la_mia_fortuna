// Стиснення фото в браузері перед завантаженням в адмінці.
// Фото з телефона (до 5 МБ) зменшується до розумного розміру, тож сайт і
// завантаження працюють швидше. Будь-яка помилка - повертаємо оригінал.

const DEFAULT_MAX_SIDE = 1600;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Чиста функція: зберігає пропорції, довга сторона не більша за maxSide,
// малі картинки не збільшує, результат - цілі числа не менші за 1.
export function computeTargetSize(
  width: number,
  height: number,
  maxSide: number = DEFAULT_MAX_SIDE
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (!(longest > maxSide)) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch {
      resolve(null);
    }
  });
}

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const name = dot > 0 ? fileName.slice(0, dot) : fileName;
  return name || "photo";
}

// Тільки браузер. Ніколи не кидає виняток: при будь-якій проблемі
// повертає вихідний файл.
export async function compressImage(file: File): Promise<File> {
  if (!SUPPORTED_TYPES.has(file.type)) return file;
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = computeTargetSize(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    const draw = (fillWhite: boolean) => {
      context.clearRect(0, 0, width, height);
      if (fillWhite) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap as ImageBitmap, 0, 0, width, height);
    };

    draw(false);
    let blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    let mime = "image/webp";
    let extension = "webp";

    if (!blob || blob.type !== "image/webp") {
      // Safari не вміє webp: пробуємо jpeg, прозорість заливаємо білим.
      draw(true);
      blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
      mime = "image/jpeg";
      extension = "jpg";
      if (!blob || blob.type !== "image/jpeg") return file;
    }

    if (blob.size >= file.size) return file;

    return new File([blob], `${baseName(file.name)}.${extension}`, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    try {
      bitmap?.close();
    } catch {
      // ігноруємо
    }
  }
}
