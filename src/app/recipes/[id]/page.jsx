"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import RecipeIngredients from "@/components/recipe/RecipeIngredients";
import RecipeInfoTable from "@/components/recipe/RecipeInfoTable";
import RecipeStep from "@/components/recipe/RecipeStep";
import CookRecipeButton from "@/components/recipe/CookRecipeButton";
import BookmarkButton from "@/components/recipe/BookmarkButton";
import styles from "./Recipe.module.css";
import { getRecipeDetail } from "@/api/recipeApi";
import { notFound, useParams } from 'next/navigation';
import PublicLayout from "@/components/layout/public/PublicLayout";

export default function RecipePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id;

  console.log(`[Step 1] 레시피 상세 페이지 컴포넌트 로드 시작 (ID: ${id})`);

  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      console.log(`[Step 2] ID가 없어 데이터 fetching을 건너뜁니다.`);
      return;
    }

    const fetchData = async () => {
      console.log(`[Step 2] 데이터 fetching 시작 (ID: ${id})`);
      setLoading(true);
      try {
        const response = await getRecipeDetail(id);
        console.log(`[Step 3] API 응답 성공:`, {
          title: response?.title,
          ingredientsCount: response?.recipeIngredients?.length
        });
        setRecipeData(response);
      } catch (err) {
        console.error("[Step 3] API 호출 중 오류 발생:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    console.log(`[Step 4] 로딩 화면 렌더링 중...`);
    return (
      <PublicLayout>
        <div className="flex justify-center items-center h-80">
          <div className={styles.loader}></div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !recipeData) {
    console.log("[Step 4] 에러 발생 또는 데이터 없음 - 404 페이지로 이동");
    return notFound();
  }

  console.log("[Step 5] 데이터 가공 시작 (영양 성분 및 메타데이터)");
  // 난이도 별점 렌더링
  const renderStars = (rating) => {
    let stars = 0;
    if (rating == "초급") stars = 2;
    else if (rating == "중급") stars = 3;
    else if (rating == "고급") stars = 4;
    else if (rating == "아무나") stars = 1;
    else return (<span>정보 없음</span>);

    return (
      <span className={styles.starRating}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </span>
    );
  };

  // 영양 성분 데이터 가공
  const nutritionData = [
    { label: "열량", value: `${recipeData.calories ?? 0} kcal` },
    { label: "단백질", value: `${recipeData.protein ?? 0} g` },
    { label: "지방", value: `${recipeData.fat ?? 0} g` },
    { label: "탄수화물", value: `${recipeData.carbs ?? 0} g` },
    { label: "당류", value: `${recipeData.sugar ?? 0} g` },
    { label: "나트륨", value: `${recipeData.sodium ?? 0} mg` },
    { label: "콜레스테롤", value: `${recipeData.cholesterol ?? 0} mg` },
  ];

  // 요리 정보 데이터 가공
  const metadata = [
    { label: "조리 시간", value: recipeData.cookTimeText || "정보 없음" },
    { label: "분량", value: recipeData.servingsText || "정보 없음" },
    { label: "난이도", value: renderStars(recipeData.difficultyLevel) || "정보 없음" },
  ];

  // 업데이트 날짜 가공
  const formattedUpdatedAt = recipeData.updatedAt
    ? recipeData.updatedAt.split('T')[0]
    : "정보 없음";

  console.log("[Step 6] 페이지 최종 렌더링 시작");

  return (
    <PublicLayout>
      <div className={styles.recipeContainer}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={styles.recipeSubHeader}>{recipeData.title}</h2>
          <div className="flex gap-3">
            <BookmarkButton recipeId={recipeData.recipeId} />
            <CookRecipeButton
              recipeId={recipeData.recipeId}
              recipeIngredients={recipeData.recipeIngredients}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
              <img
                src={recipeData.thumbnailUrl || "https://via.placeholder.com/400"}
                alt={recipeData.title}
                className="w-full h-[400px] object-cover"
              />
            </div>

            <RecipeIngredients recipeIngredients={recipeData.recipeIngredients} />

            <RecipeInfoTable
              title="영양 성분"
              data={nutritionData}
              columns={2}
              emptyMessage="영양 성분 정보가 없습니다."
            />
            <span className={styles.updatedAt}>업데이트 날짜: {formattedUpdatedAt}</span>

            <RecipeInfoTable
              title="요리 정보"
              data={metadata}
              columns={2}
              renderValue={(item) => item.isStars ? renderStars(item.value) : item.value}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7">
            <div className="space-y-6">
              {recipeData.recipeSteps?.map((step) => (
                <RecipeStep
                  key={step.stepNo}
                  number={step.stepNo}
                  content={step.instructionText}
                  image={step.stepImageUrl}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
