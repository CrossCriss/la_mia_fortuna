export type GalleryImage = { url: string; alt: string | null; contain?: boolean };

// Список слайдів галереї: фото товару, а фото таблиці розмірів (якщо є) - останнім
// слайдом. Обкладинкою (каталог, og:image, JSON-LD, кошик) лишається images[0]
// самого товару, тому таблицю сюди для обкладинки не використовуємо.
export function buildGalleryImages(
  images: { url: string; alt: string | null }[],
  sizeChartImageUrl: string | null | undefined,
  productName: string
): GalleryImage[] {
  const slides: GalleryImage[] = images.map((image) => ({ url: image.url, alt: image.alt }));
  if (sizeChartImageUrl) {
    slides.push({
      url: sizeChartImageUrl,
      alt: `Таблиця розмірів - ${productName}`,
      contain: true,
    });
  }
  return slides;
}

// Подія, якою кнопка "Таблиця розмірів" просить галерею показати останній слайд.
export const SHOW_SIZE_CHART_EVENT = "lmf:show-size-chart";
