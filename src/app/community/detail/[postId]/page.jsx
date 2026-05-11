"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPostDetail, deletePost, addPostLike, removePostLike, getPostLikeStatus, addPostReport, getPostReportStatus, addFollow, removeFollow, checkFollowStatus } from '@/api/postApi';
import { addBookmark, removeBookmark, checkBookmarkStatus } from '@/api/bookmarkApi';

export default function CommunityDetailPage() {
    const { postId } = useParams();
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0); 
    
    // 상태 관리
    const [isBookmarked, setIsBookmarked] = useState(false); 
    const [isBookmarkLoading, setIsBookmarkLoading] = useState(false); 
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isReported, setIsReported] = useState(false);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    // 💡 로그인 유저 ID 상태 관리
    const [currentUserId, setCurrentUserId] = useState(null);

    // 1. 컴포넌트 마운트 시 세션스토리지에서 유저 정보 가져오기
    useEffect(() => {
        const authUserStr = sessionStorage.getItem('authUser');
        if (authUserStr) {
            try {
                const authUser = JSON.parse(authUserStr);
                
                // 체크용 콘솔 출력
                console.log("상세보기기준 세션에서 로드된 유저 정보 (loginId):", authUser.loginId);
                console.log("상세보기기준 세션에서 로드된 유저 정보 (userId):", authUser.userId);
                
                setCurrentUserId(authUser.userId);
            } catch (error) {
                console.error("세션 데이터 파싱 오류:", error);
            }
        } else {
            alert("로그인이 필요한 서비스입니다.");
            router.push('/login'); 
        }
    }, [router]);

    // 2. 유저 ID가 확인된 후 게시글 상세 정보 및 상태 로드하기
    useEffect(() => {
        if (!currentUserId) return;

        const fetchDetail = async () => {
            try {
                const data = await getPostDetail(postId);
                setPost(data);
                
                // 타인의 글일 경우 북마크, 신고, 팔로우 상태 조회
                if (data.authorUserId !== currentUserId) {
                    if (data.recipeId) {
                        // 💡 수정됨: 파라미터 순서를 (recipeId, userId)로 변경
                        const bookmarkData = await checkBookmarkStatus(data.recipeId);
                        setIsBookmarked(
                            bookmarkData === true || bookmarkData?.isBookmarked === true
                        );
                    }
                    const reportData = await getPostReportStatus(postId, currentUserId);
                    setIsReported(reportData.isReported);
                    
                    const followData = await checkFollowStatus(data.authorUserId, currentUserId);
                    setIsFollowing(followData.isFollowing);
                }

                // 좋아요 상태 조회
                const likeData = await getPostLikeStatus(postId, currentUserId);
                setIsLiked(likeData.isLiked);
                const fetchedCount = likeData.likeCount ?? likeData.like_count ?? 0;
                setLikeCount(Number(fetchedCount));

            } catch (error) {
                console.error("게시글 로드 실패:", error);
            }
        };
        fetchDetail();
    }, [postId, currentUserId]); 

    const handleDelete = async () => {
        if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            await deletePost(postId);
            alert("삭제되었습니다.");
            router.push('/community');
        }
    };

    const handleReport = async () => {
        if (isReported) { alert("이미 검토중인 글입니다."); return; }
        if (isReportLoading) return;
        if (confirm("정말 이 게시글을 신고하시겠습니까?")) {
            setIsReportLoading(true);
            try {
                await addPostReport(postId, currentUserId);
                setIsReported(true);
                alert("신고가 접수되었습니다.");
                router.push('/community');
            } catch (error) {
                alert("신고 처리에 실패했습니다.");
            } finally {
                setIsReportLoading(false);
            }
        }
    };

    const handleBookmarkToggle = async () => {
        if (!post.recipeId || isBookmarkLoading) return;
        setIsBookmarkLoading(true);
        try {
            if (isBookmarked) {
                // 💡 수정됨: 파라미터 순서를 (recipeId, userId)로 변경
                await removeBookmark(post.recipeId);
                setIsBookmarked(false);
            } else {
                // 💡 수정됨: 파라미터 순서를 (recipeId, userId)로 변경
                await addBookmark(post.recipeId);
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error("북마크 처리 실패:", error);
        } finally {
            setIsBookmarkLoading(false);
        }
    };

    const handleLikeToggle = async () => {
        if (isLikeLoading) return;
        setIsLikeLoading(true);
        setIsLiked(!isLiked);
        setLikeCount(prev => {
            const current = Number(prev) || 0; 
            return isLiked ? Math.max(0, current - 1) : current + 1;
        });

        try {
            if (isLiked) {
                await removePostLike(postId, currentUserId);
            } else {
                await addPostLike(postId, currentUserId);
            }
        } catch (error) {
            setIsLiked(isLiked);
            setLikeCount(prev => {
                const current = Number(prev) || 0;
                return isLiked ? current + 1 : Math.max(0, current - 1);
            });
            alert("좋아요 처리에 실패했습니다.");
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!post.authorUserId || isFollowLoading) return;
        setIsFollowLoading(true);

        try {
            if (isFollowing) {
                await removeFollow(post.authorUserId, currentUserId);
                setIsFollowing(false);
            } else {
                await addFollow(post.authorUserId, currentUserId);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("팔로우 처리 실패:", error);
            alert("팔로우 처리에 실패했습니다.");
        } finally {
            setIsFollowLoading(false);
        }
    };

    if (!post) return <div className="p-10 text-center">로딩 중...</div>;

    const isAuthor = post.authorUserId === currentUserId;
    const images = post.images || [];
    const hasMultipleImages = images.length > 1;

    const handlePrev = () => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    const handleNext = () => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

    return (
        <main className="layout-container py-8">
            <article className="card-box post-card">
                <div className="post-header flex justify-between items-center mb-4">
                    <strong className="text-xl">{post.title}</strong>
                    <span className="post-meta">{post.authorLoginId} · {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="image-box image-rounded thumb-16-10 mb-5 relative group">
                    <img 
                        className="image-cover w-full h-full object-cover transition-all duration-300" 
                        src={images[currentImageIndex] ? `https://www.todayfridge.today/uploads/community/${images[currentImageIndex].storedName}` : "/placeholder.svg"} 
                        alt={`상세 이미지 ${currentImageIndex + 1}`} 
                    />
                    {hasMultipleImages && (
                        <>
                            <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
                
                <p className="card-desc mb-6 whitespace-pre-wrap">{post.content}</p>
                
                <div className="card-actions flex justify-between items-center w-full mt-6">
                    <div className="flex flex-wrap gap-2">
                        {isAuthor ? (
                            <>
                                <button className="btn btn-outline flex items-center gap-1.5 whitespace-nowrap" onClick={() => router.push(`/community/edit/${postId}`)}>
                                    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </span>
                                    수정
                                </button>
                                <button className="btn btn-danger flex items-center gap-1.5 whitespace-nowrap" onClick={handleDelete}>
                                    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </span>
                                    삭제
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    className={`btn flex items-center gap-1.5 transition-all duration-300 active:scale-95 whitespace-nowrap ${isLiked ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'btn-outline'}`}
                                    onClick={handleLikeToggle}
                                    disabled={isLikeLoading}
                                >
                                    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                        <svg className={`w-full h-full transition-transform duration-300 ${isLiked ? 'scale-110 text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </span>
                                    좋아요 {likeCount}
                                </button>

                                <button 
                                    className={`btn flex items-center gap-1.5 transition-all duration-300 active:scale-95 whitespace-nowrap ${
                                        isFollowing ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'btn-outline'
                                    }`}
                                    onClick={handleFollowToggle}
                                    disabled={isFollowLoading}
                                >
                                    <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                        <svg className={`w-full h-full transition-transform duration-300 ${isFollowing ? 'scale-110' : ''}`} fill={isFollowing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </span>
                                    {isFollowing ? '팔로잉' : '팔로우'}
                                </button>
                                
                                {post.recipeId && (
                                    <button 
                                        className={`btn flex items-center gap-1.5 transition-all duration-300 active:scale-95 whitespace-nowrap ${isBookmarked ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'btn-outline'}`}
                                        onClick={handleBookmarkToggle}
                                        disabled={isBookmarkLoading}
                                    >
                                        <span className="inline-flex items-center justify-center w-4 h-4 shrink-0" style={{ minWidth: '16px', minHeight: '16px' }}>
                                            <svg className={`w-full h-full transition-transform duration-300 ${isBookmarked ? 'scale-110' : ''}`} fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </span>
                                        {isBookmarked ? '북마크 됨' : '북마크'}
                                    </button>
                                )}
                            </>
                        )}
                        
                        {post.recipeId && (
                            <button className="btn btn-secondary flex items-center gap-1.5 whitespace-nowrap" onClick={() => router.push(`/recipes/${post.recipeId}`)}>
                                <span className="inline-flex items-center justify-center shrink-0" style={{ minWidth: '16px', minHeight: '16px', width: '16px', height: '16px' }}>
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </span>
                                레시피 보기
                            </button>
                        )}
                    </div>

                    {!isAuthor && (
                        <button 
                            className={`btn flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
            </article>
        </main>
    );
}
