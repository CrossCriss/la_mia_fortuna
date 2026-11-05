import { NextResponse } from "next/server";
import { importRequestSchema } from "@/lib/admin/import-schema";
import { runImport } from "@/lib/admin/import-service";

export const dynamic = "force-dynamic";

// POST /api/admin/import — приймає вже розпарсений та зіставлений по колонках
// файл (парсинг Excel відбувається у браузері, сюди йдуть тільки дані рядків).
// dryRun: true повертає лише зведення (для превʼю перед фінальним імпортом).
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = importRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await runImport(parsed.data);
  return NextResponse.json(result);
}
