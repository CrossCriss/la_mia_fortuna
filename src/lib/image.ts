// Чи можна віддати картинку через next/image оптимізатор. Правило збігається
// з images.remotePatterns у next.config.mjs: https, хост supabase.co або його
// піддомен, шлях публічного сховища. Усе інше (відносні шляхи з /public,
// http, чужі хости, сміття) рендериться з unoptimized.
const STORAGE_PATH_PREFIX = "/storage/v1/object/public/";

export function isOptimizableImage(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  const isSupabaseHost = host === "supabase.co" || host.endsWith(".supabase.co");
  if (!isSupabaseHost) return false;

  return parsed.pathname.startsWith(STORAGE_PATH_PREFIX);
}
