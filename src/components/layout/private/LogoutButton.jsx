'use client';

import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { logoutApi } from "@/api/authApi";

export default function LogoutButton() {
    const { user, logout } = useAuth();

    const handleGeneralLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // ignore
        } finally {
            logout();
        }
    };

    const handleKakaoLogout = async () => {
        try {
            await logoutApi();
        } catch {
            // ignore
        } finally {
            logout();

            const restApiKey = "75029a3464f13bd358978e6ed88f9efd";
            const logoutRedirectUri = encodeURIComponent(window.location.origin);

            window.location.href =
                `https://kauth.kakao.com/oauth/logout?client_id=${restApiKey}&logout_redirect_uri=${logoutRedirectUri}`;
        }
    };

    if (!user) return null;

    return (
        <Button
            variant="secondary"
            is_full="true"
            handleClick={
                user.loginType === "kakao"
                    ? handleKakaoLogout
                    : handleGeneralLogout
            }
        >
            로그아웃
        </Button>
    );
}