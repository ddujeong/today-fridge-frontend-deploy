import { useEffect, useState } from "react";
import Button from "./Button";
import BookMarkButton from "./BookMarkButton";
import CustomTag from "./Tag";
import { Tooltip } from "antd";
import { addBookmark, removeBookmark, checkBookmarkStatus } from "@/api/bookmarkApi";
import { getSubstitutionSuggestions } from "@/api/substitutionApi";
import Modal from "./Modal";
import { useAuth } from "@/context/AuthContext";

const conditionTagMap = {
    DIABETES_LOW_SUGAR: { label: "당뇨 주의", variant: "accent" },
    DIET_LOW_CALORIE: { label: "다이어트 추천", variant: "primary" },
    BABY_STAGE1: { label: "이유식", variant: "secondary" },
    ALLERGY_EGG: { label: "계란 알레르기", variant: "accent" },
};

export default function Recipe({
    recipeId,
    name,
    time,
    quantity,
    difficulty,
    imageURL,
    handleClick,
    llmExplanation,
    semanticScore,
    tagScore,
    hybridScore,
    variant = "list",
    matchRate,
    reason,
    conditionTags = [],
    missingIngredients = [],
    substituteSuggestions = [],
    warnings = [],
    ownedIngredients = [],
    onBookmarkToggle
}) {
    const { user } = useAuth();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [substitutionData, setSubstitutionData] = useState(null);
    const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);
    const [isSubstitutionLoading, setIsSubstitutionLoading] = useState(false);

    useEffect(() => {
        const fetchBookmarkStatus = async () => {
            try {
                if (!recipeId) {
                    setIsBookmarked(false);
                    return;
                }

                const userId = user?.userId;

                if (!userId) {
                    setIsBookmarked(false);
                    return;
                }

                const status = await checkBookmarkStatus(recipeId);
                setIsBookmarked(
                    status === true || status?.isBookmarked === true
                );
            } catch (error) {
                console.error("북마크 상태 확인 실패:", error);
                setIsBookmarked(false);
            }
        };

        fetchBookmarkStatus();
    }, [recipeId, user?.userId]);

    const handleBookmarkToggle = async (nextBookmarked) => {
        try {
            if (!recipeId) return false;

            const userId = user?.userId;
            if (!userId) return false;

            if (nextBookmarked === false) {
                await removeBookmark(recipeId);
                setIsBookmarked(false);
                onBookmarkToggle?.(false);
                return false;
            }

            await addBookmark(recipeId);
            setIsBookmarked(true);
            onBookmarkToggle?.(true);
            return true;
        } catch (error) {
            console.error("북마크 토글 실패:", error);
            return false;
        }
    };
    const handleSubstitutionClick = async (e) => {
        e.stopPropagation();

        if (substitutionData) {
            setIsSubstitutionOpen(true);
            return;
        }

        try {
            setIsSubstitutionLoading(true);

            const data = await getSubstitutionSuggestions(
                recipeId,
                ownedIngredients
            );

            setSubstitutionData(data);
            setIsSubstitutionOpen(true);
        } catch (error) {
            console.error("대체재 추천 조회 실패:", error);
        } finally {
            setIsSubstitutionLoading(false);
        }
    };
    const decisionTypeStyles = {
        SUBSTITUTE_AVAILABLE:
            "bg-green-100 text-green-700 border border-green-200",

        OPTIONAL:
            "bg-amber-100 text-amber-700 border border-amber-200",

        REQUIRED:
            "bg-rose-100 text-rose-700 border border-rose-200",
    };

    const decisionTypeLabels = {
        SUBSTITUTE_AVAILABLE: "대체 가능",
        OPTIONAL: "생략 가능",
        REQUIRED: "필수 재료",
    };
    return (
        <div className="w-full overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 flex flex-col">

            <div className="h-48 overflow-hidden">
                <img
                    src={imageURL || "/next.svg"}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex flex-col gap-3 p-4">

                {/* title */}
                <div>
                    <div className="text-lg font-bold text-gray-800 line-clamp-2">
                        {name}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                        소요 시간: {time} | 난이도: {difficulty}
                    </div>
                </div>


                {variant === "recommend" && (
                    <>
                        {/* 요약 상태 chips */}
                        <div className="flex flex-wrap items-center gap-2">

                            {conditionTags.map(tag => {
                                const mapped = conditionTagMap[tag] || {
                                    label: tag,
                                    variant: "secondary",
                                };

                                return (
                                    <CustomTag
                                        key={tag}
                                        variant={mapped.variant}
                                    >
                                        {mapped.label}
                                    </CustomTag>
                                );
                            })}

                            {warnings.map(warning => (
                                <CustomTag
                                    key={warning.conditionCode}
                                    variant="accent"
                                >
                                    {warning.conditionName} 주의
                                </CustomTag>
                            ))}

                            <CustomTag variant="primary">
                                일치 {matchRate}%
                            </CustomTag>


                            {/* 부족 재료 hover */}
                            <Tooltip
                                placement="top"
                                color="#ffffff"
                                styles={{
                                    body: {
                                        color: "#374151",
                                        borderRadius: "12px",
                                        padding: "10px 12px",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                    },
                                }}
                                title={
                                    missingIngredients.length ? (
                                        <div className="min-w-32">
                                            <div className="mb-2 text-xs font-semibold text-gray-700">
                                                부족 재료
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                {missingIngredients.slice(0, 8).map((item, index) => (
                                                    <span
                                                        key={`${item}-${index}`}
                                                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}

                                                {missingIngredients.length > 8 && (
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                                                        +{missingIngredients.length - 8}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : "부족 재료 없음"
                                }
                            >
                                <span className="inline-flex items-center">
                                    <CustomTag
                                        variant={missingIngredients.length ? "accent" : "primary"}
                                    >
                                        부족 {missingIngredients.length}개
                                    </CustomTag>
                                </span>
                            </Tooltip>


                            {missingIngredients.length > 0 && (
                                <CustomTag
                                    variant="action"
                                    onClick={handleSubstitutionClick}
                                >
                                    {isSubstitutionLoading
                                        ? "확인 중..."
                                        : "대체재 보기"}
                                </CustomTag>
                            )}

                        </div>

                        {/* 추천 이유 */}
                        {reason && (
                            <div className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                💡 {reason}
                            </div>
                        )}
                        {llmExplanation && (
                            <div className="rounded-xl bg-white/70 p-3 text-sm text-gray-700 leading-relaxed">
                                <div className="mb-1 text-xs font-semibold text-gray-500">
                                    AI 추천 설명
                                </div>
                                {llmExplanation}
                            </div>
                        )}
                        {isSubstitutionOpen && substitutionData && (
                            <Modal
                                isOpen={isSubstitutionOpen}
                                title="대체재 추천"
                                description="보유 재료를 기준으로 부족 재료의 대체 가능성을 판단했어요."
                                onClose={() => setIsSubstitutionOpen(false)}
                                showFooter={false}
                            >
                                <div className="flex flex-col gap-3">
                                    {substitutionData?.results?.map((item, index) => (
                                        <div
                                            key={`${item.missingIngredient}-${index}`}
                                            className="rounded-xl border border-gray-100 bg-white p-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-sm font-bold text-gray-800">
                                                    {item.missingIngredient}
                                                </div>

                                                <span
                                                    className={`
        rounded-full
        px-2 py-1
        text-xs font-semibold
        ${decisionTypeStyles[item.decisionType]}
    `}
                                                >
                                                    {decisionTypeLabels[item.decisionType]}
                                                </span>
                                            </div>

                                            {item.decisionType === "SUBSTITUTE_AVAILABLE" && (
                                                <div className="mt-2 text-sm text-gray-700">
                                                    대체재:{" "}
                                                    <span className="font-semibold">
                                                        {item.substituteIngredient}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-2 text-xs leading-relaxed text-gray-500">
                                                {item.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Modal>
                        )}

                    </>
                )}
                <div className="flex flex-row items-center gap-2">                {variant === "recommend" && (
                    <div>
                        {/* semantic {semanticScore ?? "-"} · tag {tagScore ?? "-"} · hybrid {hybridScore ?? "-"} */}
                    </div>
                )}
                    <Button
                        is_full={true}
                        variant="secondary"
                        handleClick={handleClick}
                    >
                        레시피 보기
                    </Button>
                    <BookMarkButton
                        initialBookmarked={isBookmarked}
                        onToggle={handleBookmarkToggle}
                    />
                </div>

            </div>
        </div>
    );
}
