/**
 * Spring 정적 매핑 `/uploads/**` + DB `file_asset.storage_path` (예: vision/uuid.jpg) → 브라우저 URL
 * `.env`에 `NEXT_PUBLIC_BACKEND_ORIGIN`를 두면 API base와 무관하게 고정 가능
 */
export function fileAssetPublicUrl(imageStoragePath, imageStoredName) {
    const path = imageStoragePath || imageStoredName;
    if (!path) return null;
    const explicit =
        typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_ORIGIN
            ? String(process.env.NEXT_PUBLIC_BACKEND_ORIGIN).replace(/\/$/, "")
            : null;
    const apiBase =
        typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
            ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/api\/?$/i, "")
            : null;
    const origin =
        typeof window !== "undefined" && window.location?.origin
            ? window.location.origin
            : "";
    const isDev = process.env.NODE_ENV !== "production";
    const devFallback = isDev ? "http://localhost:8080" : "";
    const base = explicit || apiBase || origin || devFallback || "";
    const clean = String(path).replace(/^\/+/, "");
    const uploadPath = clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean}`;
    return `${base}${uploadPath}`;
}
