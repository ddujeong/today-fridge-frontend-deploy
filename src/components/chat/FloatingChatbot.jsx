"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { getChatRecommendations } from "@/api/chatApi";

export default function FloatingChatbot() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [botMessage, setBotMessage] = useState("");
    const router = useRouter();

    const handleSend = async () => {
        if (!message.trim()) return;

        try {
            setLoading(true);

            const data = await getChatRecommendations(
                message,
                ["양배추", "두부"] // TODO: 회원 냉장고 재료로 교체
            );

            const explanationMessage = data
                .map((recipe, index) => {
                    const explanation =
                        recipe.llmExplanation ||
                        recipe.reason ||
                        "요청하신 조건과 잘 맞는 레시피입니다.";

                    return `${index + 1}. ${recipe.title}\n${explanation}`;
                })
                .join("\n\n");

            setBotMessage(explanationMessage);
            setRecommendations(data);
        } catch (e) {
            console.error(e);
            setBotMessage("추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#7c8a6a] px-5 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(80,70,60,0.18)] transition hover:scale-[1.02] hover:opacity-95"
                >
                    <span className="text-lg">🥘</span>

                    <div className="flex flex-col items-start leading-tight">
                        <span>오늘 뭐 해먹지?</span>
                        <span className="text-[11px] font-normal text-white/80">
                            AI 레시피 추천
                        </span>
                    </div>
                </button>
            )}

            {open && (
                <div className="fixed bottom-6 right-6 z-50 flex max-h-[680px] w-[440px] flex-col overflow-hidden rounded-[28px] border border-[#eee7df] bg-white shadow-[0_24px_70px_rgba(80,70,60,0.18)]">
                    <div className="flex items-center justify-between border-b border-[#eee7df] bg-[#f8f3ed] px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7c8a6a] text-lg text-white">
                                🥘
                            </div>

                            <div>
                                <div className="font-semibold text-[#3f3a36]">
                                    오늘의 냉장고 AI 추천
                                </div>
                                <div className="text-xs text-[#8b837c]">
                                    조건과 보유 재료를 기준으로 추천해드려요
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-[#8b837c] transition hover:bg-white hover:text-[#3f3a36]"
                            aria-label="챗봇 닫기"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <div className="rounded-2xl bg-[#fdfaf6] px-4 py-3 text-sm leading-6 text-[#6b645f]">
                            원하는 조건을 말해보세요.
                            <br />
                            예: 두부로 간단한 저녁 추천해줘
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSend();
                                }}
                                placeholder="예) 두부로 간단한 저녁 추천해줘"
                                className="flex-1 rounded-2xl border border-[#e5ddd4] bg-[#fcfaf7] px-4 py-3 text-sm text-[#3f3a36] outline-none transition placeholder:text-[#aaa19a] focus:border-[#7c8a6a]"
                            />

                            <Button
                                variant="secondary"
                                handleClick={handleSend}
                            >
                                전송
                            </Button>
                        </div>

                        <div className="flex max-h-[430px] flex-col gap-4 overflow-y-auto pr-1">
                            {loading && (
                                <div className="rounded-2xl bg-[#f8f3ed] px-4 py-3 text-sm text-[#6b645f]">
                                    AI가 냉장고 재료를 분석하고 있어요...
                                </div>
                            )}

                            {botMessage && !loading && (
                                <div className="max-w-[92%] whitespace-pre-line rounded-2xl bg-[#f8f3ed] px-4 py-3 text-sm leading-6 text-[#5b554f]">
                                    {botMessage}
                                </div>
                            )}

                            {!!recommendations.length && !loading && (
                                <div>
                                    <div className="mb-2 text-xs font-semibold text-[#8b837c]">
                                        추천 레시피
                                    </div>

                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {recommendations.map((recipe) => (
                                            <button
                                                key={recipe.recipeId}
                                                onClick={() => router.push(`/recipes/${recipe.recipeId}`)}
                                                className="min-w-[230px] max-w-[230px] overflow-hidden rounded-3xl border border-[#eee7df] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                            >
                                                <div className="h-32 overflow-hidden bg-[#f3eee7]">
                                                    <img
                                                        src={recipe.thumbnailUrl || "/next.svg"}
                                                        alt={recipe.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>

                                                <div className="p-3">
                                                    <div className="line-clamp-2 text-sm font-bold text-[#3f3a36]">
                                                        {recipe.title}
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="rounded-full bg-[#eef3e8] px-2 py-1 text-[11px] text-[#5f7350]">
                                                            추천 매칭
                                                        </span>

                                                        <span className="text-xs font-semibold text-[#7c8a6a]">
                                                            {recipe.matchRate ?? 0}%
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 text-xs text-[#8b837c]">
                                                        {recipe.cookTimeText || "조리시간 정보 없음"}
                                                    </div>

                                                    {recipe.reason && (
                                                        <div className="mt-2 line-clamp-2 text-xs leading-5 text-[#6b645f]">
                                                            {recipe.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}