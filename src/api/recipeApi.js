import api from "@/config/axios";
import { unwrapApiData } from "@/api/utils";

export const getAllRecipes = async (
    page = 0,
    size = 12,
    cookingType = "ALL",
    sort = "default"
) => {
    const response = await api.get("/v1/recipes", {
        params: { page, size, cookingType, sort },
    });

    return response.data?.data ?? response.data ?? { content: [], pageInfo: { totalPages: 0 } };
};

export const getRecipeDetail = async (id) => {
    const response = await api.get(`/v1/recipes/${id}`);
    return unwrapApiData(response);
};

export const cookRecipe = async (id) => {
    const response = await api.post(`/v1/recipes/${id}/cooked`);
    return unwrapApiData(response);
};
