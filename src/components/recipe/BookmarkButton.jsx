"use client";

import { useState, useEffect } from "react";
import { addBookmark, removeBookmark, checkBookmarkStatus } from "@/api/bookmarkApi";
import { useAuth } from "@/context/AuthContext";
import styles from "./BookmarkButton.module.css";

export default function BookmarkButton({ recipeId }) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialCheck, setInitialCheck] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (user && user.userId) {
        try {
          const status = await checkBookmarkStatus(recipeId);
          setIsBookmarked(status === true || status?.isBookmarked === true);
        } catch (error) {
          console.error("북마크 상태 확인 실패:", error);
        } finally {
          setInitialCheck(false);
        }
      } else {
        setInitialCheck(false);
      }
    };

    fetchStatus();
  }, [recipeId, user]);

  const handleToggle = async () => {
    if (!user || !user.userId) {
      alert("북마크 기능을 사용하려면 로그인이 필요합니다.");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(recipeId);
        setIsBookmarked(false);
      } else {
        await addBookmark(recipeId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("북마크 처리 중 오류 발생:", error);
      alert(error.message || "북마크 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`${styles.bookmarkButton} ${isBookmarked ? styles.active : ""}`}
      onClick={handleToggle}
      disabled={loading || initialCheck}
    >
      {loading ? (
        <span className={styles.loader}></span>
      ) : isBookmarked ? (
        <>
          <span>❤️</span>
          <span>찜 완료</span>
        </>
      ) : (
        <>
          <span>🤍</span>
          <span>찜하기</span>
        </>
      )}
    </button>
  );
}
