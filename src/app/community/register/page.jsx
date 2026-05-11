"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InputText from '@/components/ui/InputText';
import CustomTag from '@/components/ui/Tag';
import Section from '@/components/ui/Section';
import PostCard from '@/app/community/components/PostCard';
import { getBookmarkedRecipes } from '@/api/bookmarkApi';
import { uploadImages, createPost, getUserPosts } from '@/api/postApi';
// 💡 fileAssetPublicUrl 임포트 제거됨

export default function CommunityRegisterPage() {
    const [images, setImages] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [recipe, setRecipe] = useState(""); 
    const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]); 
    const [recentPosts, setRecentPosts] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);   

    const [currentUserId, setCurrentUserId] = useState(null);
    const router = useRouter();

    // 1. 세션 정보 로드
    useEffect(() => {
        const authUserStr = sessionStorage.getItem('authUser');
        if (authUserStr) {
            try {
                const authUser = JSON.parse(authUserStr);
                setCurrentUserId(authUser.userId);
            } catch (error) {
                console.error("세션 파싱 오류:", error);
            }
        } else {
            alert("로그인이 필요한 서비스입니다.");
            router.push('/login'); 
        }
    }, [router]);
    
    // 2. 초기 데이터 로드 (북마크, 최근 후기)
    useEffect(() => {
        if (!currentUserId) return;

        const fetchInitialData = async () => {
            try {
                const bookmarkData = await getBookmarkedRecipes(currentUserId);
                setBookmarkedRecipes(bookmarkData);
                
                // 첫 번째 항목 자동 선택 (recipeId, title 적용)
                if (bookmarkData && bookmarkData.length > 0) {
                    setRecipe(bookmarkData[0].recipeId.toString());
                }
    
                const postData = await getUserPosts(currentUserId);
                setRecentPosts(postData || []); 
            } catch (error) {
                console.error("초기 데이터 로드 실패:", error);
            }
        };
    
        fetchInitialData();
    }, [currentUserId]);

    useEffect(() => {
        return () => {
            images.forEach(img => URL.revokeObjectURL(img.preview));
        };
    }, [images]);
    
    // 💡 이미지 경로 직접 지정 방식으로 수정됨
    const getImageUrl = (storagePath, storedName) => {
        if (!storedName) return placeholderSvg;
        return `https://www.todayfridge.today/uploads/community/${storedName}`;
    };

    const processFiles = (files) => {
        const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
        const newImages = Array.from(files)
            .filter(file => validExtensions.includes(file.type))
            .map(file => ({
                file,
                id: Math.random().toString(36).substring(2, 9),
                preview: URL.createObjectURL(file),
            }));

        setImages(prev => [...prev, ...newImages].slice(0, 5));
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!currentUserId) {
            alert("로그인 정보를 확인할 수 없습니다.");
            return;
        }
        if (images.length === 0) {
            alert("이미지를 등록해주세요.");
            return;
        }
        if (!recipe) {
            alert("레시피를 선택해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('recipe', recipe);
            images.forEach((img) => formData.append('images[]', img.file));

            const uploadResult = await uploadImages(formData);

            if (uploadResult.success) {
                const finalPostData = {
                    userId: currentUserId,
                    title: title,
                    content: content,
                    recipe: recipe,
                    image_files: uploadResult.data
                };
                const dbResult = await createPost(finalPostData);
                if (dbResult.success) {
                    alert("게시글이 등록되었습니다.");
                    router.push('/community');
                }
            }
        } catch (error) {
            console.error("등록 에러:", error);
            alert(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragActive(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragActive(false); }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = null;
        }
    };

    const removeImage = (idToRemove) => {
        setImages(prev => {
            const img = prev.find(i => i.id === idToRemove);
            if (img) URL.revokeObjectURL(img.preview);
            return prev.filter(i => i.id !== idToRemove);
        });
    };

    const removeAllImages = () => {
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
    };

    const placeholderSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%271280%27%20height%3D%27800%27%20viewBox%3D%270%200%201280%20800%27%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27%23ECE7DD%27/%3E%3C/svg%3E";

    return (
        <main className="w-full">
            <Section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {/* 후기 작성 폼 */}
                    <Card style={{ margin: 0, padding: '24px' }}>
                        <h1 className="text-xl font-bold mb-2">후기 작성</h1>
                        <p className="text-sm text-[var(--text-sub)] mb-5">
                            직접 만든 요리를 기록으로 남겨보세요. 북마크한 레시피 선택, 이미지 업로드, 후기 등록 흐름을 포함합니다.
                        </p>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold">북마크한 레시피 선택</label>
                            <select
                                className="w-full min-h-[46px] px-4 border border-[var(--border)] rounded-xl bg-white focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)] focus:ring-opacity-15 transition"
                                value={recipe}
                                onChange={(e) => setRecipe(e.target.value)}
                            >
                                {bookmarkedRecipes.length > 0 ? (
                                    bookmarkedRecipes.map((item) => (
                                        <option key={item.recipeId} value={item.recipeId}>
                                            {item.title}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>북마크한 레시피가 없습니다</option>
                                )}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold">제목</label>
                            <InputText variant="secondary" is_full="true" placeholder="후기 제목을 입력하세요" getText={setTitle} setText={title} />
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold">후기 내용</label>
                            <textarea
                                className="w-full min-h-[140px] p-4 border border-[var(--border)] rounded-xl bg-white focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)] focus:ring-opacity-15 transition resize-y"
                                placeholder="직접 만들어본 후기를 남겨보세요"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-sm font-bold">이미지 업로드 (최대 5장)</label>
                                <span className="text-gray-400 font-normal text-xs">jpg, png, webp</span>
                            </div>
                            <div
                                className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out ${isDragActive ? 'border-[var(--primary)] bg-[var(--color-primary-light)]' : 'border-[var(--border)] hover:bg-gray-50'}`}
                                style={{ minHeight: '120px' }}
                                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="text-[var(--text-sub)] mb-2 font-medium">여기로 이미지를 드래그하거나 클릭하세요</span>
                                <span className="text-[var(--text-sub)] opacity-70 text-sm">한 번에 여러 장 선택 가능합니다</span>
                                <input ref={fileInputRef} className="hidden" type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleFileChange} />
                            </div>
                        </div>

                        {/* 버튼 그룹 (로딩 상태 및 전체 이미지 제거) */}
                        <div className="flex flex-wrap gap-2 mt-5">
                            <Button variant="primary" handleClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        처리 중...
                                    </div>
                                ) : (
                                    "후기 등록"
                                )}
                            </Button>
                            <Button variant="secondary" handleClick={removeAllImages}>전체 이미지 제거</Button>
                        </div>
                    </Card>

                    {/* 업로드 미리보기 */}
                    <Card style={{ margin: 0, padding: '24px' }}>
                        <h2 className="text-xl font-bold mb-4">
                            업로드 미리보기 <span className="text-sm font-normal text-[var(--text-sub)]">({images.length}/5)</span>
                        </h2>

                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                {images.map((img) => (
                                    <div key={img.id} className="relative overflow-hidden rounded-xl bg-[var(--soft-bg)] aspect-square border border-[var(--border)] group shadow-sm transition-transform hover:scale-[1.02]">
                                        <img className="w-full h-full object-cover" src={img.preview} alt="미리보기" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md font-bold"
                                            title="이미지 삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-[var(--border)] mb-4 opacity-70 aspect-[16/10]">
                                <img className="w-full h-full object-cover" src={placeholderSvg} alt="후기 이미지 예시" />
                            </div>
                        )}
                    </Card>
                </div>

                {/* 최근 후기 목록 섹션 */}
                <div className="flex items-end justify-between gap-4 mb-5 px-2">
                    <div>
                        <h2 className="text-2xl font-bold m-0">최근 후기</h2>
                        <p className="text-[var(--text-sub)] mt-2 m-0">내가 작성한 최근 레시피 후기 목록입니다.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {recentPosts.length > 0 ? (
                        recentPosts.slice(0, 4).map((post, index) => (
                            <PostCard
                                key={index}
                                postId={post.postId}
                                title={post.title}
                                author={post.authorLoginId || post.author} // API 응답 필드 유연성 확보
                                date={new Date(post.createdAt || post.date).toLocaleString('ko-KR', {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                                desc={post.content || post.desc}
                                imageSrc={getImageUrl(post.storagePath, post.storedName || (post.images && post.images[0]?.storedName))}
                            />
                        ))
                    ) : (
                        <div className="col-span-1 md:col-span-2 text-center py-10 text-[var(--text-sub)] border border-dashed rounded-xl border-[var(--border)]">
                            등록된 후기가 없습니다. 첫 후기를 작성해 보세요!
                        </div>
                    )}
                </div>
            </Section>
        </main>
    );
}