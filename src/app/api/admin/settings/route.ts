import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteSettingsFormSchema } from "@/lib/admin/site-settings-schema";

export const dynamic = "force-dynamic";

// Синглтон-налаштування сайту (банер + сезонна колекція на головній).
// GET/PUT завжди працюють з першим (і єдиним) рядком SiteSettings —
// немає окремого "id" в URL, бо сторінка в адмінці теж одна.

export async function GET() {
  const settings = await prisma.siteSettings.findFirst();
  return NextResponse.json(
    settings ?? {
      id: null,
      heroImageUrl: null,
      heroImageAlt: null,
      seasonalLabel: "Нова колекція",
      seasonalCategoryId: null,
    }
  );
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = siteSettingsFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректні дані", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.siteSettings.findFirst();
  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.siteSettings.create({ data: parsed.data });

  return NextResponse.json(settings);
}
