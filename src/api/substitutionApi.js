import api from "@/config/axios";

export const getSubstitutionSuggestions = async (
    recipeId,
    ownedIngredients = []
) => {
    const response = await api.post(
        "/v1/substitutions/suggest",
        {
            recipeId,
            ownedIngredients,
        }
    );

    return response.data.data;
};