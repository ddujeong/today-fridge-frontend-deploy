"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addPostLike, removePostLike, getPostLikeStatus, addPostReport, getPostReportStatus } from '@/api/postApi';

export default function PostCard({ postId, title, author, authorUserId, date, desc, imageSrc }) {
    const router = useRouter();
    
    // 상태 관리
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    
    const [isReported, setIsReported] = useState(false);
    const [isReportLoading, setIsReportLoading] = useState(false);
    
    const [currentUser, setCurrentUser] = useState(null);

    // 1. 세션에서 유저 정보 로드
    useEffect(() => {
        const authUserStr = sessionStorage.getItem('authUser');
        if (authUserStr) {
            try {
                const parsedUser = JSON.parse(authUserStr);
                setCurrentUser(parsedUser);
            } catch (e) {
                console.error("세션 파싱 오류", e);
            }
        }
    }, []);

    // 💡 본인 글인지 판별 (프롭스로 ID가 오지 않을 경우를 대비해 닉네임/로그인ID와도 교차 비교)
    const isAuthor = currentUser && (
        (authorUserId && currentUser.userId === authorUserId) ||
        currentUser.loginId === author ||
        currentUser.nickname === author
    );

    // 2. 게시글별 좋아요 및 신고 상태 로드
    useEffect(() => {
        if (!currentUser || !postId) return;

        const fetchStatus = async () => {
            try {
                // 본인 글이 아닐 때만 좋아요 및 신고 상태 조회 (불필요한 API 호출 방지)
                if (!isAuthor) {
                    const likeData = await getPostLikeStatus(postId, currentUser.userId);
                    setIsLiked(likeData.isLiked);
                    setLikeCount(Number(likeData.likeCount ?? likeData.like_count ?? 0));

                    const reportData = await getPostReportStatus(postId, currentUser.userId);
                    setIsReported(reportData.isReported);
                }
            } catch (error) {
                console.error("상태 로드 실패:", error);
            }
        };
        fetchStatus();
    }, [postId, currentUser, isAuthor]);

    // 3. 좋아요 토글 핸들러
    const handleLikeToggle = async (e) => {
        e.stopPropagation(); // 카드 클릭 이벤트 방지
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (isLikeLoading) return;

        setIsLikeLoading(true);
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

        try {
            if (isLiked) {
                await removePostLike(postId, currentUser.userId);
            } else {
                await addPostLike(postId, currentUser.userId);
            }
        } catch (error) {
            setIsLiked(isLiked);
            setLikeCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
            alert("좋아요 처리에 실패했습니다.");
        } finally {
            setIsLikeLoading(false);
        }
    };

    // 4. 신고 핸들러
    const handleReport = async (e) => {
        e.stopPropagation(); // 카드 클릭 이벤트 방지
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (isReported) {
            alert("이미 신고된 게시글입니다.");
            return;
        }
        if (isReportLoading) return;

        if (confirm("정말 이 게시글을 신고하시겠습니까?")) {
            setIsReportLoading(true);
            try {
                await addPostReport(postId, currentUser.userId);
                setIsReported(true);
                alert("신고가 접수되었습니다.");
            } catch (error) {
                alert("신고 처리에 실패했습니다.");
            } finally {
                setIsReportLoading(false);
            }
        }
    };

    return (
        <div className="card-box flex flex-col border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition bg-white">
            {/* 이미지 영역 */}
            <div 
                className="relative aspect-[16/10] overflow-hidden cursor-pointer" 
                onClick={() => router.push(`/community/detail/${postId}`)}
            >
                <img 
                    src={imageSrc} 
                    alt={title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                />
            </div>
            
            {/* 텍스트 영역 */}
            <div className="p-4 flex flex-col flex-1">
                <div 
                    className="flex justify-between items-start mb-2 cursor-pointer" 
                    onClick={() => router.push(`/community/detail/${postId}`)}
                >
                    <h3 className="font-bold text-lg line-clamp-1">{title}</h3>
                </div>
                <div className="text-sm text-[var(--text-sub)] mb-3 flex items-center gap-2">
                    <span>{author}</span>
                    <span>·</span>
                    <span>{date}</span>
                </div>
                <p 
                    className="text-sm text-[var(--text-sub)] line-clamp-2 mb-4 flex-1 cursor-pointer" 
                    onClick={() => router.push(`/community/detail/${postId}`)}
                >
                    {desc}
                </p>
                
                {/* 💡 하단 버튼 영역 */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-[var(--border)]">
                    <button 
                        className="btn btn-primary px-3 py-1.5 text-sm flex items-center gap-1.5 whitespace-nowrap"
                        onClick={() => router.push(`/community/detail/${postId}`)}
                    >
                        상세 보기
                    </button>

                    {/* 💡 본인 글이 아닐 때만 좋아요 버튼 렌더링 */}
                    {!isAuthor && (
                        <button 
                            className={`btn px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all duration-300 active:scale-95 whitespace-nowrap ${
                                isLiked ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'btn-outline'
                            }`}
                            onClick={handleLikeToggle}
                            disabled={isLikeLoading}
                        >
                            <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                <svg className={`w-full h-full transition-transform duration-300 ${isLiked ? 'scale-110 text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </span>
                            좋아요 {likeCount > 0 ? likeCount : ''}
                        </button>
                    )}

                    {/* 💡 본인 글이 아닐 때만 신고 버튼 렌더링 */}
                    {!isAuthor && (
                        <button 
                            className={`btn px-3 py-1.5 text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                isReported ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 border-red-500 active:scale-95'
                            }`}
                            onClick={handleReport}
                            disabled={isReportLoading}
                        >
                            <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </span>
                            {isReported ? '신고됨' : '신고하기'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}