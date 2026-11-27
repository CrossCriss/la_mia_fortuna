import { notFound } from "next/navigation";

// Перехоплює невідомі адреси, щоб вони показували 404 з шапкою і підвалом сайту.
export default function CatchAllPage() {
  notFound();
}
