'use client';

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function CTASection() {
    const router = useRouter();

    return (
        <section className="py-24">
            <div className="rounded-[32px] bg-[#f3eee7] px-8 py-14 text-center md:px-16">
                <p className="mb-3 text-sm font-medium tracking-wide text-[#7c8a6a]">
                    START TODAY
                </p>

                <h2 className="text-4xl font-semibold leading-tight text-[#3f3a36]">
                    오늘의 냉장고와 함께
                    <br />
                    더 편안한 식탁을 시작해보세요
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6b645f]">
                    냉장고 속 재료를 더 효율적으로 관리하고,
                    지금 만들 수 있는 요리를 쉽고 따뜻하게 찾아보세요.
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                    <Button handleClick={() => router.push("/signup")}>
                        시작하기
                    </Button>

                    <button
                        className="rounded-full border border-[#d9d0c7] bg-white px-6 py-3 text-sm font-medium text-[#5b554f] transition hover:bg-[#faf6f1]"
                        onClick={() => router.push("/recipes")}
                    >
                        레시피 둘러보기
                    </button>
                </div>
            </div>
        </section>
    );
}