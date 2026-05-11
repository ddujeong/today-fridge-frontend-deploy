'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMeApi } from "@/api/authApi";
import PropTypes from "prop-types";

const AuthContext = createContext(null);

// user 구조: { loginId: string, loginType: 'general' | 'kakao', nickname: string, userId: number | null } | null
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 새로고침 시 sessionStorage에서 복원
  useEffect(() => {
    const stored = sessionStorage.getItem("authUser");
    if (stored) {
      try {
        // Next.js Hydration Mismatch를 막기 위해 useEffect 내부 초기화가 필수적입니다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("authUser");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // 로그인 성공 후 호출: getMeApi로 닉네임 조회 후 세션/상태 업데이트
  const login = useCallback(async (loginId, loginType = "general", defaultNickname = null) => {
    let finalNickname = defaultNickname || loginId;
    let userId = null;
    try {
      const meRes = await getMeApi();
      // getMeApi는 언랩된 payload를 반환하지만, 테스트/일부 호출부 호환을 위해 중첩 포맷도 함께 처리합니다.
      const meData = meRes?.data?.data ?? meRes?.data ?? meRes ?? null;
      finalNickname = meData?.nickname ?? meData?.name ?? finalNickname;
      userId =
        meData?.userId ??
        meData?.id ??
        meData?.memberId ??
        meData?.user?.userId ??
        null;
    } catch (error) {
      console.warn("닉네임 정보를 가져오는 데 실패했습니다. loginId를 닉네임으로 사용합니다.", error);
    }
    const userData = { loginId, loginType, nickname: finalNickname, userId };
    try {
      sessionStorage.setItem("authUser", JSON.stringify(userData));
    } catch (e) {
      console.warn("sessionStorage 저장 에러:", e);
    }
    setUser(userData);
  }, []);

  // 카카오 로그인 콜백: URL 파라미터로 loginId 전달받아 세션 저장 후 nickname 조회
  useEffect(() => {
    if (globalThis.window === undefined) return;
    const params = new URLSearchParams(globalThis.window.location.search);
    const kakaoLogin = params.get("kakaoLogin");
    const kakaoError = params.get("kakaoError");

    if (kakaoLogin === "success") {
      const loginId = params.get("loginId");
      const nickname = params.get("nickname");

      const redirectPath =
        sessionStorage.getItem("redirectAfterLogin") || "/dashboard";

      sessionStorage.removeItem("redirectAfterLogin");

      if (loginId) {
        login(loginId, "kakao", nickname).then(() => {
          router.replace(redirectPath);
        });
      } else {
        router.replace(redirectPath);
      }
    } else if (kakaoError) {
      router.replace("/");
    }
  }, [pathname, router, login]);

  // 로그아웃 후 호출: 세션 초기화
  const logout = useCallback(() => {
    sessionStorage.removeItem("authUser");
    setUser(null);
    router.push("/");
  }, [router]);

  // Provider의 value 객체가 매 렌더링마다 재생성되는 것을 방지하여 성능 최적화
  const contextValue = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 훅은 AuthProvider 내부에서만 호출해야 합니다.");
  }
  return context;
};

export default AuthContext;
