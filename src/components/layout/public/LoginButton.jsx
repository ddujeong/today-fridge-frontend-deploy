'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { loginApi } from "@/api/authApi";
import LogoutButton from "@/components/layout/private/LogoutButton";

export default function LoginButton() {
    const { user, login } = useAuth();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    // 이메일 인증 완료 후 리다이렉트 시 ?emailVerified=true 표시용
    const [emailVerifiedMsg, setEmailVerifiedMsg] = useState(
        typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("emailVerified") === "true"
            ? "이메일 인증이 완료되었습니다. 로그인해주세요."
            : ""
    );

    const handleClose = () => {
        setIsOpen(false);
        setLoginId("");
        setPassword("");
        setShowPassword(false);
        setError("");
    };

    const handleLogin = async () => {
        setError("");
        if (!loginId || !password) {
            setError("아이디와 비밀번호를 입력해주세요.");
            return;
        }
        try {
            await loginApi(loginId, password);
            // AuthContext의 login 함수를 호출합니다. 닉네임 조회는 login 함수 내부에서 처리됩니다.
            await login(loginId, "general");

            const redirectPath =
                sessionStorage.getItem("redirectAfterLogin") || "/dashboard";

            sessionStorage.removeItem("redirectAfterLogin");

            handleClose();

            router.replace(redirectPath);
        } catch (err) {
            setError(err.message || "로그인에 실패했습니다.");
        }
    };

    const handleKakaoLogin = () => {
        const apiBase = (
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "/api"
        ).replace(/\/$/, "");

        window.location.href = `${apiBase}/v1/auth/kakao/login`;
    };

    if (user) return <LogoutButton />;

    return (
        <>
            <Button variant="secondary" handleClick={() => setIsOpen(true)}>
                로그인
            </Button>
            {/* 모달로 로그인(일반/회원가입) 창 띄우기, 히원가입은 페이지 이동 */}
            <Modal
                isOpen={isOpen}
                title="로그인"
                onClose={handleClose}
                showFooter={false}
                variant="login"
            >
                <div className="flex flex-col gap-4">
                    {emailVerifiedMsg && (
                        <p className="rounded-lg bg-green-50 px-4 py-3 text-xs text-green-700">
                            {emailVerifiedMsg}
                        </p>
                    )}
                    <input
                        id="loginId"
                        name="loginId"
                        type="text"
                        placeholder="아이디"
                        autoComplete="username"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="w-full rounded-lg border border-[var(--border)] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="비밀번호"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            className="w-full rounded-lg border border-[var(--border)] px-4 py-3 pr-11 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text-main)]"
                            tabIndex={-1}
                            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                        >
                            {/* 비밀번호 보기/ 숨기기 아이콘 svg */}
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <Button variant="primary" handleClick={handleLogin} is_full>
                        로그인
                    </Button>
                    <div className="flex items-center gap-3 text-[var(--text-sub)]">
                        <hr className="flex-1 border-[var(--border)]" />
                        <span className="text-xs">또는</span>
                        <hr className="flex-1 border-[var(--border)]" />
                    </div>
                    {/* 카카오 로그인 — RestApiKey 설정 후 활성화 */}
                    <button
                        type="button"
                        onClick={handleKakaoLogin}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3 text-sm font-semibold text-[#3C1E1E] transition hover:opacity-90"
                    >
                        <span>🍫</span> 카카오로 로그인
                    </button>
                </div>
                {/* 회원가입은 회원가입 페이지로 이동 */}
                <p className="mt-4 text-center text-xs text-[var(--text-sub)]">
                    계정이 없으신가요?{" "}
                    <Link
                        href="/signup"
                        onClick={handleClose}
                        className="font-semibold text-[var(--primary)] underline"
                    >
                        회원가입
                    </Link>
                </p>
            </Modal>
        </>
    );
}
