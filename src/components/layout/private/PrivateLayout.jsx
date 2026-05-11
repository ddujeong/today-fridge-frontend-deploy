"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/public/Header";
import FloatingChatbot from "@/components/chat/FloatingChatbot";
import Modal from "@/components/ui/Modal";
import LoginButton from "@/components/layout/public/LoginButton";
import { useAuth } from "@/context/AuthContext";

export default function PrivateLayout({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
        }
    }, [loading, user, pathname]);

    if (loading) {
        return null;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#fdfaf6] text-[#3f3a36]">
                <Header />

                <Modal
                    isOpen={true}
                    title="로그인이 필요합니다"
                    showFooter={false}
                    closeOnOverlay={false}
                    onClose={() => { }}

                >
                    <div className="flex flex-col items-center gap-4 py-2">
                        <p
                            className="text-center text-sm leading-6"
                            style={{ color: "var(--text-sub)" }}
                        >
                            로그인하면 냉장고 재료 관리, 맞춤 추천, 북마크 기능을 이용할 수 있어요.
                        </p>

                        <LoginButton />
                    </div>
                </Modal>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfaf6] text-[#3f3a36]">
            <Header />

            <main className="mx-auto w-full max-w-7xl px-6 py-6">
                {children}
            </main>

            <FloatingChatbot />
        </div>
    );
}