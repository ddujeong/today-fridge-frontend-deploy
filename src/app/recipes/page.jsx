"use client";

import { useEffect, useState } from "react";
import { getAllRecipes } from "@/api/recipeApi";
import { checkBookmarkStatus } from "@/api/bookmarkApi";
import { getMeApi } from "@/api/authApi";
import Section from "@/components/ui/Section";
import Recipe from "@/components/ui/Recipe";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import FilterTabs from "./components/FilterTabs";
import Select from "@/components/ui/Select";
import PublicLayout from "@/components/layout/public/PublicLayout";


export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [cookingType, setCookingType] = useState("ALL");
    const [sort, setSort] = useState("default");

    const cookingTypeOptions = [
        { label: "전체", value: "ALL" },
        { label: "국/탕", value: "SOUP" },
        { label: "찌개/전골", value: "STEW" },
        { label: "볶음", value: "STIR_FRY" },
        { label: "조림", value: "BRAISED" },
        { label: "무침", value: "SEASONED" },
        { label: "전/부침", value: "PANCAKE" },
        { label: "기타", value: "UNKNOWN" },
    ];
    const sortOptions = [
        { label: "기본순", value: "default" },
        { label: "조리시간순", value: "time_asc" },
        { label: "난이도순", value: "difficulty_asc" },
        { label: "이름순", value: "name" },
    ];
    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const result = await getAllRecipes(page, 12, cookingType, sort);
                setRecipes(result?.content ?? []);
                setTotalPages(result?.pageInfo?.totalPages ?? 0);
            } catch (e) {
                console.error(e);
                setRecipes([]);
                setTotalPages(0);
            }
        };

        fetchRecipes();
    }, [page, cookingType, sort]);

    return (
        <PublicLayout>
            <Section>
                <div className="mb-6 flex items-center justify-between">
                    <FilterTabs
                        options={cookingTypeOptions}
                        value={cookingType}
                        onChange={(value) => {
                            setCookingType(value);
                            setPage(0);
                        }}
                    />

                    <Select
                        options={sortOptions}
                        setText={sort}
                        getText={(value) => {
                            setSort(value);
                            setPage(0);
                        }}
                        placeholder="정렬"
                    />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {recipes.map(recipe => (
                        console.log(recipe),
                        <Recipe
                            key={recipe.recipeId}
                            recipeId={recipe.recipeId}
                            name={recipe.title}
                            time={recipe.cookTimeText}
                            difficulty={recipe.difficulty || "보통"}
                            handleClick={() =>
                                router.push(`/recipes/${recipe.recipeId}`)
                            }
                            imageURL={recipe.thumbnailUrl}
                        />
                    ))}
                </div>
                <Pagination
                    page={page + 1}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p - 1)}
                />
            </Section>
        </PublicLayout>
    )
}
