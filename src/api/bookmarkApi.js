import api from "@/config/axios";
import { unwrapApiData } from "@/api/utils";

// GET /v1/bookmarks
// 현재 로그인 사용자 기준 북마크 목록 조회
export const getBookmarkedRecipes = async () => {
    const response = await api.get("/v1/bookmarks");
    return unwrapApiData(response, []);
};

// POST /v1/bookmarks/{recipeId}
// 현재 로그인 사용자 기준 북마크 추가
export const addBookmark = async (recipeId) => {
    const response = await api.post(`/v1/bookmarks/${recipeId}`);
    return unwrapApiData(response, null);
};

// DELETE /v1/bookmarks/{recipeId}
// 현재 로그인 사용자 기준 북마크 해제
export const removeBookmark = async (recipeId) => {
    const response = await api.delete(`/v1/bookmarks/${recipeId}`);
    return unwrapApiData(response, null);
};

// GET /v1/bookmarks/{recipeId}
// 현재 로그인 사용자 기준 북마크 여부(Boolean) 조회
export const checkBookmarkStatus = async (recipeId) => {
    const toBookmarkFlag = (payload) => {
        if (typeof payload === "boolean") return payload;
        if (typeof payload?.isBookmarked === "boolean") return payload.isBookmarked;
        return false;
    };

    try {
        const response = await api.get(`/v1/bookmarks/${recipeId}`);
        return toBookmarkFlag(unwrapApiData(response, null));
    } catch (error) {
        // Backward compatibility: some deployments expose bookmark status at /status.
        const fallbackResponse = await api.get(`/v1/bookmarks/${recipeId}/status`);
        return toBookmarkFlag(unwrapApiData(fallbackResponse, null));
    }
};

export const toggleBookmark = async (recipeId) => {
    const status = await checkBookmarkStatus(recipeId);
    return status;
};
