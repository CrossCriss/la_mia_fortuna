import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const MIN_QUERY_LENGTH = 2;

// Пошук за назвою товару та назвою категорії/підкатегорії, до якої він
// прив'язаний (без опису/принту — див. CLAUDE.md). Пагінація дзеркалить
// сторінку категорії (той самий PAGE_SIZE й "оптимістичний" запит сторінки
// в одному Promise.all із count, щоб уникнути зайвого round-trip до Supabase
// у звичайному випадку).
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = (searchParams.q ?? "").trim();
  const requestedPage = Math.max(1, Number(searchParams.page) || 1);

  if (query.length < MIN_QUERY_LENGTH) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Пошук товарів</h1>
        <p className="mt-4 text-sm text-ink-soft">Введіть щонайменше 2 символи.</p>
      </div>
    );
  }

  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { category: { name: { contains: query, mode: "insensitive" } } },
    ],
  };

  const [totalCount, optimisticProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        variants: { include: { size: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      relationLoadStrategy: "join",
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const rawProducts =
    page === requestedPage
      ? optimisticProducts
      : await prisma.product.findMany({
          where,
          include: {
            images: { orderBy: { position: "asc" }, take: 2 },
            variants: { include: { size: true, color: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          relationLoadStrategy: "join",
        });

  const products = rawProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    isNew: product.isNew,
    isPromo: product.isPromo,
    images: product.images,
    variants: product.variants
      .slice()
      .sort((a, b) => a.size.sortOrder - b.size.sortOrder)
      .map((variant) => ({
        id: variant.id,
        size: variant.size.value,
        color: variant.color.name,
        colorHex: variant.color.hex,
        stock: variant.stock,
      })),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">
        Результати пошуку за запитом «{query}»
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {totalCount === 0 ? "Нічого не знайдено" : `Знайдено товарів: ${totalCount}`}
      </p>

      {totalCount === 0 ? (
        <div className="mt-8 flex flex-col items-start gap-4">
          <p className="text-sm text-ink-soft">За вашим запитом нічого не знайдено.</p>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-bold text-white transition duration-150 ease-out hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/25"
          >
            Повернутися до каталогу
          </Link>
        </div>
      ) : (
        <div className="mt-8 animate-fade-in-up">
          <ProductGrid products={products} />
          <CatalogPagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={{ q: query, page: searchParams.page }}
          />
        </div>
      )}
    </div>
  );
}
