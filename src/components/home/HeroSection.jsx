'use client';

import { useRouter } from "next/navigation";

export default function HeroSection() {
    const router = useRouter();

    return (
        <section className="grid min-h-[calc(100vh-160px)] items-center gap-12 py-10 md:grid-cols-2">
            <div>
                <p className="mb-4 inline-block rounded-full bg-[#f3eee7] px-4 py-2 text-sm text-[#7c8a6a]">
                    오늘의 냉장고 · 맞춤 레시피 추천 서비스
                </p>

                <h1 className="text-5xl font-semibold leading-tight tracking-tight text-[#3f3a36] md:text-6xl">
                    냉장고 속 재료로
                    <br />
                    지금 만들 수 있는
                    <br />
                    레시피를 추천받아보세요
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-[#6b645f]">
                    보유한 식재료를 기반으로 만들 수 있는 레시피를 추천받고,
                    부족한 재료와 커뮤니티 후기를 함께 확인해보세요.
                    개인 맞춤 추천과 건강 리포트 기능으로
                    더 효율적인 식단 관리를 도와드립니다.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                    <button
                        onClick={() => router.push("/signup")}
                        className="rounded-full bg-[#7c8a6a] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                    >
                        시작하기
                    </button>

                    <button
                        onClick={() => router.push("/recipes")}
                        className="rounded-full border border-[#d9d0c7] bg-white px-6 py-3 text-sm font-medium text-[#5b554f] transition hover:bg-[#faf6f1]"
                    >
                        레시피 둘러보기
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-[#efe7db]" />
                <div className="absolute -right-6 bottom-8 h-32 w-32 rounded-full bg-[#e6ecdf]" />

                <div className="relative overflow-hidden rounded-[32px] border border-[#eee7df] bg-white p-6 shadow-[0_20px_60px_rgba(80,70,60,0.08)]">
                    <div className="rounded-[24px] bg-[#f8f3ed] p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-[#8b837c]">
                                    오늘의 추천 레시피
                                </p>

                                <h2 className="mt-3 text-3xl font-semibold text-[#3f3a36]">
                                    토마토 달걀볶음
                                </h2>
                            </div>

                            <div className="rounded-full bg-[#e6ecdf] px-4 py-2 text-xs font-semibold text-[#5f7350]">
                                추천률 92%
                            </div>
                        </div>

                        <p className="mt-4 leading-7 text-[#6b645f]">
                            냉장고에 있는 토마토와 달걀로 간단하게 만들 수 있는
                            한 끼 메뉴예요. 부담 없이 만들 수 있고,
                            재료 활용도도 높은 레시피입니다.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-white px-4 py-3">
                                <p className="text-xs text-[#8b837c]">
                                    조리 시간
                                </p>

                                <p className="mt-1 text-lg font-semibold text-[#3f3a36]">
                                    15분
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white px-4 py-3">
                                <p className="text-xs text-[#8b837c]">
                                    난이도
                                </p>

                                <p className="mt-1 text-lg font-semibold text-[#3f3a36]">
                                    초급
                                </p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-medium text-[#5b554f]">
                                추천 이유
                            </p>

                            <div className="mt-3 flex flex-col gap-2">
                                <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#6b645f]">
                                    ✓ 보유 재료 75% 활용 가능
                                </div>

                                <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#6b645f]">
                                    ✓ 간단한 한 끼 메뉴 추천
                                </div>

                                <div className="rounded-xl bg-white px-4 py-3 text-sm text-[#6b645f]">
                                    ✓ 저칼로리 식단 기반 추천
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-medium text-[#5b554f]">
                                보유 재료
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-white px-3 py-2 text-sm text-[#6b645f]">
                                    토마토
                                </span>

                                <span className="rounded-full bg-white px-3 py-2 text-sm text-[#6b645f]">
                                    달걀
                                </span>

                                <span className="rounded-full bg-white px-3 py-2 text-sm text-[#6b645f]">
                                    양파
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm font-medium text-[#5b554f]">
                                부족 재료
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-[#fff7e8] px-3 py-2 text-sm text-[#9a7440]">
                                    식용유
                                </span>

                                <span className="rounded-full bg-[#fff7e8] px-3 py-2 text-sm text-[#9a7440]">
                                    소금
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}