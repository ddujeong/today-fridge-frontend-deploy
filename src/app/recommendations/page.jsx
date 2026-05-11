"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PrivateLayout from "@/components/layout/private/PrivateLayout";
import Section from "@/components/ui/Section";
import Recipe from "@/components/ui/Recipe";
import { getRecommendations } from "@/api/recommendApi";
import Pagination from "@/components/ui/Pagination";

export default function RecommendationsPage() {
    const router = useRouter();

    const [recipes, setRecipes] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const data = await getRecommendations(page, 9);
                setRecipes(data.content);
                console.log(data);
                setTotalPages(data.pageInfo.totalPages);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [page]);

    if (loading) {
        return (
            <PrivateLayout>
                <Section>추천 불러오는 중...</Section>
            </PrivateLayout>
        );
    }

    if (!recipes.length) {
        return (
            <PrivateLayout>
                <Section>추천 결과가 없습니다.</Section>
            </PrivateLayout>
        );
    }

    return (
        <PrivateLayout>
            <Section>
                <div className="grid gap-4 md:grid-cols-3">
                    {recipes.map((recipe) => (
                        <Recipe
                            key={recipe.recipeId}
                            recipeId={recipe.recipeId}
                            name={recipe.title}
                            time={recipe.cookTimeText || "정보 없음"}
                            difficulty={recipe.difficultyLevel || "보통"}
                            imageURL={recipe.thumbnailUrl}
                            variant="recommend"
                            matchRate={recipe.matchRate}
                            reason={recipe.reason}
                            conditionTags={recipe.conditionTags}
                            missingIngredients={recipe.missingIngredients}
                            substituteSuggestions={recipe.substituteSuggestions}
                            warnings={recipe.warnings}
                            ownedIngredients={recipe.ownedIngredients}
                            handleClick={() => router.push(`/recipes/${recipe.recipeId}`)}
                        />
                    ))}
                </div>
                <Pagination
                    page={page + 1}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                />
            </Section>
        </PrivateLayout>
    );
}
