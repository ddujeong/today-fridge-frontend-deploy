'use client';

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LoginButton from "@/components/layout/public/LoginButton";
import LogoutButton from "@/components/layout/private/LogoutButton";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMyPageOpen, setIsMyPageOpen] = useState(false);

    const mainMenus = [
        { name: "홈", path: user ? "/dashboard" : "/" },
        { name: "전체레시피", path: "/recipes" },
        { name: "커뮤니티", path: "/community" },

        ...(user
            ? [
                { name: "맞춤추천", path: "/recommendations" },
                { name: "내 냉장고", path: "/fridge" },
                { name: "가격비교", path: "/ingredients-price" },
            ]
            : []),
    ];

    const mypageMenus = [
        { name: "마이페이지", path: "/mypage" },
        { name: "활동 기록", path: "/log" },
        { name: "북마크", path: "/bookmark" },
    ];

    const isActive = (path) => {
        if (path.includes("#")) return false;
        if (path === "/") return pathname === "/";
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    const isMyPageActive =
        pathname.startsWith("/mypage") ||
        pathname.startsWith("/bookmark") ||
        pathname.startsWith("/log");

    const userName =
        user?.nickname ||
        user?.name ||
        user?.username ||
        "사용자";

    const userInitial = userName[0] || "유";

    return (
        <header
            className="sticky top-0 z-50 border-b backdrop-blur"
            style={{
                backgroundColor: "rgba(255,250,243,0.92)",
                borderColor: "var(--border)",
            }}
        >
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
                <Link
                    href={user ? "/dashboard" : "/"}
                    className="flex shrink-0 items-center gap-3"
                >
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                    >
                        냉
                    </div>

                    <p
                        className="text-base font-semibold"
                        style={{ color: "var(--text-main)" }}
                    >
                        오늘의 냉장고
                    </p>
                </Link>

                <nav
                    className="hidden items-center gap-6 text-sm md:flex"
                    style={{ color: "var(--text-sub)" }}
                >
                    {mainMenus.map((menu) => (
                        <Link
                            key={menu.path}
                            href={menu.path}
                            className="transition hover:font-semibold"
                            style={{
                                color: isActive(menu.path)
                                    ? "var(--primary)"
                                    : "var(--text-sub)",
                                fontWeight: isActive(menu.path) ? 700 : 500,
                            }}
                        >
                            {menu.name}
                        </Link>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-3">
                    {!user && (
                        <>
                            <Button handleClick={() => router.push("/signup")}>
                                시작하기
                            </Button>

                            <LoginButton />
                        </>
                    )}

                    {user && (
                        <div
                            className="relative"
                            onMouseEnter={() => setIsMyPageOpen(true)}
                            onMouseLeave={() => setIsMyPageOpen(false)}
                        >
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-full px-3 py-2 transition hover:bg-orange-50"
                                style={{
                                    color: isMyPageActive
                                        ? "var(--primary)"
                                        : "var(--text-main)",
                                    fontWeight: isMyPageActive ? 700 : 500,
                                }}
                            >
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{ backgroundColor: "var(--primary)" }}
                                >
                                    {userInitial}
                                </div>

                                <span className="text-sm">
                                    {userName} 님
                                </span>

                                <span className="text-xs">▾</span>
                            </button>

                            {isMyPageOpen && (
                                <div
                                    className="absolute right-0 top-12 w-44 rounded-2xl border p-2 shadow-lg"
                                    style={{
                                        backgroundColor: "#fff",
                                        borderColor: "var(--border)",
                                    }}
                                >
                                    {mypageMenus.map((menu) => (
                                        <Link
                                            key={menu.path}
                                            href={menu.path}
                                            className="block rounded-xl px-4 py-2 text-sm hover:bg-orange-50"
                                            style={{ color: "var(--text-main)" }}
                                        >
                                            {menu.name}
                                        </Link>
                                    ))}

                                    <div
                                        className="mt-1 border-t pt-2"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        <LogoutButton />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}