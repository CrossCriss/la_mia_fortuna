import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// POST /api/admin/upload — завантажує фото товару в Supabase Storage,
// повертає публічний URL, який далі зберігається в ProductImage.url.
export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Завантаження фото не налаштовано: відсутні SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Можна завантажувати тільки зображення" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Файл більший за 5 МБ" }, { status: 400 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
