"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InputText from '@/components/ui/InputText';
import CustomTag from '@/components/ui/Tag';
import Section from '@/components/ui/Section';
import { getBookmarkedRecipes } from '@/api/bookmarkApi';
import { uploadImages, getPostDetail, updatePost } from '@/api/postApi';

export default function CommunityEditPage() {
    const { postId } = useParams();
    const router = useRouter();

    const [images, setImages] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [recipe, setRecipe] = useState(""); 
    const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    
    // 💡 동적으로 변경될 로그인 유저 ID 상태 관리
    const [currentUserId, setCurrentUserId] = useState(null);
    
    // 1. 컴포넌트 마운트 시 세션스토리지에서 유저 정보 가져오기
    useEffect(() => {
        const authUserStr = sessionStorage.getItem('authUser');
        if (authUserStr) {
            try {
                const authUser = JSON.parse(authUserStr);
                
                // 체크용 콘솔 출력
                console.log("수정페이지기준 세션에서 로드된 유저 정보 (loginId):", authUser.loginId);
                console.log("수정페이지기준 세션에서 로드된 유저 정보 (userId):", authUser.userId);
                
                setCurrentUserId(authUser.userId);
            } catch (error) {
                console.error("세션 데이터 파싱 오류:", error);
            }
        } else {
            alert("로그인이 필요한 서비스입니다.");
            router.push('/login'); 
        }
    }, [router]);
    
    // 2. 화면 로드 시 기존 게시글 정보와 북마크 목록을 가져옴
    useEffect(() => {
        // userId가 아직 없으면 (null 상태) API 호출 대기
        if (!currentUserId) return;

        const fetchInitialData = async () => {
            try {
                // 1. 북마크 목록 로드
                const bookmarkData = await getBookmarkedRecipes(currentUserId);
                setBookmarkedRecipes(bookmarkData);

                // 2. 게시글 상세 정보 로드
                const postData = await getPostDetail(postId);
                setTitle(postData.title);
                setContent(postData.content);
                
                // 기존 게시글의 레시피 세팅 (만약 없다면 북마크 목록의 첫 번째 레시피를 기본값으로 세팅)
                if (postData.recipeId) {
                    setRecipe(postData.recipeId.toString());
                } else if (bookmarkData && bookmarkData.length > 0) {
                    setRecipe(bookmarkData[0].recipeId.toString());
                }

                // 3. 기존 이미지 미리보기 설정 (isExisting 플래그와 storedName 저장)
                if (postData.images && postData.images.length > 0) {
                    const loadedImages = postData.images.map((img, idx) => ({
                        id: `existing-${idx}`,
                        preview: `https://www.todayfridge.today/uploads/community/${img.storedName}`,
                        isExisting: true,
                        storedName: img.storedName
                    }));
                    setImages(loadedImages);
                }
            } catch (error) {
                console.error("데이터 로드 실패:", error);
                alert("게시글 정보를 불러오지 못했습니다.");
                router.back();
            }
        };

        if (postId) fetchInitialData();

        // 클린업: 새로 생성된 ObjectURL 해제
        return () => {
            images.forEach(img => {
                if (!img.isExisting) URL.revokeObjectURL(img.preview);
            });
        };
    }, [postId, currentUserId]); // currentUserId가 세팅될 때 동작하도록 의존성 추가

    const processFiles = (files) => {
        const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
        const newImages = Array.from(files)
            .filter(file => validExtensions.includes(file.type))
            .map(file => ({
                file,
                id: Math.random().toString(36).substring(2, 9),
                preview: URL.createObjectURL(file),
                isExisting: false
            }));

        setImages(prev => [...prev, ...newImages].slice(0, 5));
    };

    const handleUpdate = async () => {
        if (isLoading) return;

        // 💡 로그인 상태 유효성 검사
        if (!currentUserId) {
            alert("로그인 정보를 확인할 수 없습니다. 다시 로그인 해주세요.");
            return;
        }

        // 유효성 검사 추가 (이미지와 레시피 필수 선택)
        if (images.length === 0) {
            alert("이미지를 하나 이상 등록해주세요.");
            return;
        }

        if (!recipe) {
            alert("북마크한 레시피를 선택해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. 새로 추가된 이미지만 필터링하여 업로드
            const newFiles = images.filter(img => !img.isExisting);
            let uploadedData = null;

            if (newFiles.length > 0) {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('content', content);
                formData.append('recipe', recipe);
                newFiles.forEach((img) => formData.append('images[]', img.file));

                const uploadResult = await uploadImages(formData);
                if (uploadResult.success) {
                    uploadedData = uploadResult.data;
                } else {
                    throw new Error(uploadResult.error || "이미지 서버 업로드 실패");
                }
            }

            // 2. 유지할 기존 이미지 목록(storedName) 추출
            const retainedImages = images
                .filter(img => img.isExisting)
                .map(img => img.storedName);

            // 3. Spring Boot PATCH 요청
            const finalPostData = {
                title: title,
                content: content,
                recipe: recipe,
                image_files: uploadedData,     // 새 이미지 정보 (없으면 null)
                retained_images: retainedImages // 유지할 기존 이미지 파일명 목록
            };

            const dbResult = await updatePost(postId, finalPostData);

            if (dbResult.success) {
                alert("게시글이 성공적으로 수정되었습니다.");
                router.push(`/community/detail/${postId}`);
            }
        } catch (error) {
            console.error("수정 오류:", error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            processFiles(e.target.files);
            e.target.value = null;
        }
    };

    const removeImage = (idToRemove) => {
        setImages(prev => {
            const img = prev.find(i => i.id === idToRemove);
            if (img && !img.isExisting) URL.revokeObjectURL(img.preview);
            return prev.filter(i => i.id !== idToRemove);
        });
    };

    const removeAllImages = () => {
        images.forEach(img => !img.isExisting && URL.revokeObjectURL(img.preview));
        setImages([]);
    };

    const placeholderSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%271280%27%20height%3D%27800%27%20viewBox%3D%270%200%201280%20800%27%3E%0A%20%20%20%20%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20fill%3D%27%23ECE7DD%27/%3E%0A%20%20%20%20%3Ctext%20x%3D%27640%27%20y%3D%27400%27%20text-anchor%3D%27middle%27%20font-family%3D%27sans-serif%27%20font-size%3D%2732%27%20fill%3D%27%237A847D%27%3E%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EB%AF%B8%EB%A6%AC%EB%B3%B4%EA%B8%B0%3C/text%3E%0A%3C/svg%3E";

    return (
        <main className="w-full">
            <Section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    {/* 후기 수정 폼 */}
                    <Card style={{ margin: 0, padding: '24px' }}>
                        <h1 className="text-xl font-bold mb-2">후기 수정</h1>
                        <p className="text-sm text-[var(--text-sub)] mb-5">
                            작성하신 후기의 제목, 내용, 이미지를 수정할 수 있습니다.
                        </p>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold">북마크한 레시피 선택</label>
                            <select
                                className="w-full min-h-[46px] px-4 border border-[var(--border)] rounded-xl bg-white focus:outline-none focus:border-[var(--primary)] transition"
                                value={recipe}
                                onChange={(e) => setRecipe(e.target.value)}
                            >
                                {/* 💡 수정된 부분: item.recipeName -> item.title */}
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
                            <InputText
                                variant="secondary"
                                is_full="true"
                                placeholder="제목을 입력하세요"
                                getText={setTitle}
                                setText={title}
                            />
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold">후기 내용</label>
                            <textarea
                                className="w-full min-h-[140px] p-4 border border-[var(--border)] rounded-xl bg-white focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)] focus:ring-opacity-15 transition resize-y"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-sm font-bold mb-2">이미지 추가 업로드 (최대 5장)</label>
                            <div
                                className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragActive ? 'border-[var(--primary)] bg-[var(--color-primary-light)]' : 'border-[var(--border)] hover:bg-gray-50'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="text-[var(--text-sub)] text-sm">새 이미지를 드래그하거나 클릭하여 추가하세요</span>
                                <input
                                    ref={fileInputRef}
                                    className="hidden"
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-5">
                            <Button variant="primary" handleClick={handleUpdate} disabled={isLoading}>
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        수정 중...
                                    </div>
                                ) : "수정 완료"}
                            </Button>
                            <Button variant="secondary" handleClick={() => router.back()}>취소</Button>
                        </div>
                    </Card>

                    {/* 업로드 미리보기 */}
                    <Card style={{ margin: 0, padding: '24px' }}>
                        <h2 className="text-xl font-bold mb-4">
                            이미지 미리보기 <span className="text-sm font-normal text-[var(--text-sub)]">({images.length}/5)</span>
                        </h2>

                        {images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                {images.map((img) => (
                                    <div key={img.id} className="relative overflow-hidden rounded-xl bg-[var(--soft-bg)] aspect-square border border-[var(--border)] group">
                                        <img className="w-full h-full object-cover" src={img.preview} alt="미리보기" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-bold"
                                        >✕</button>
                                        {img.isExisting && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] py-1 text-center">기존 이미지</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-[var(--border)] opacity-70 aspect-[16/10]">
                                <img className="w-full h-full object-cover" src={placeholderSvg} alt="비어 있음" />
                            </div>
                        )}
                    </Card>
                </div>
            </Section>
        </main>
    );
}