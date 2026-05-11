//=========================
// Imports (임포트 섹션)
// 테스트에 필요한 라이브러리, 컴포넌트, API 모듈들을 불러옵니다.
//=========================
import { render, screen, waitFor } from '@testing-library/react'; // React 컴포넌트 렌더링 및 요소 검색을 위한 도구
import userEvent from '@testing-library/user-event'; // 사용자 이벤트를 시뮬레이션하기 위한 도구
import { vi, describe, it, expect, beforeEach } from 'vitest'; // Vitest 테스트 프레임워크 함수들
import RecipePage from './page'; // 테스트 대상인 레시피 상세 페이지 컴포넌트
import * as recipeApi from '@/api/recipeApi'; // 레시피 관련 API 모듈
import * as authApi from '@/api/authApi'; // 인증 관련 API 모듈
import * as bookmarkApi from '@/api/bookmarkApi'; // 북마크 관련 API 모듈

//=========================
// Mocks (모킹 섹션)
// 외부 의존성(API, Next.js 기능 등)을 가짜 함수로 대체하여 독립적인 테스트 환경을 구축합니다.
//=========================

// API 모듈 모킹: 실제 서버 호출 대신 가짜 응답을 반환하도록 설정합니다.
vi.mock('@/api/recipeApi');
vi.mock('@/api/authApi');
vi.mock('@/api/bookmarkApi');

// next/navigation 모킹: Next.js의 라우팅 및 404 처리 기능을 가짜로 구현합니다.
vi.mock('next/navigation', () => ({
    notFound: vi.fn(), // 404 페이지 이동 함수
    useRouter: vi.fn(() => ({
        push: vi.fn(), // 페이지 이동 함수
    })),
}));

// react 'use' 훅 모킹: Next.js 15+에서 params를 처리하는 방식을 테스트 환경에 맞게 조정합니다.
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
        use: vi.fn((promise) => promise), // Promise를 즉시 해소하는 가짜 use 훅
    };
});

// 레이아웃 컴포넌트 모킹: 복잡한 레이아웃 구조를 단순화하여 페이지 콘텐츠 테스트에 집중합니다.
vi.mock('@/components/layout/private/PrivateLayout', () => ({
    default: ({ children }) => <div data-testid="private-layout">{children}</div>,
}));

//=========================
// Mock Data (테스트 데이터 섹션)
// 테스트 중에 사용될 가짜 레시피 상세 데이터를 정의합니다.
//=========================
const mockRecipeDetail = {
    recipeId: 1,
    title: '맛있는 김치찌개',
    difficultyLevel: '중급',
    cookTimeText: '30분',
    servingsText: '2인분',
    thumbnailUrl: '/test-image.jpg',
    updatedAt: '2024-05-01T10:00:00',
    recipeIngredients: [
        { normalizedNameSnapshot: '김치', amountText: '200', unit: 'g' },
        { normalizedNameSnapshot: '돼지고기', amountText: '100', unit: 'g' },
    ],
    recipeSteps: [
        { stepNo: 1, instructionText: '김치를 볶습니다.', stepImageUrl: '/step1.jpg' },
        { stepNo: 2, instructionText: '고기를 넣고 더 볶습니다.', stepImageUrl: '/step2.jpg' },
    ],
    calories: 300,
    protein: 20,
    fat: 15,
    carbs: 10,
    sugar: 5,
    sodium: 800,
    cholesterol: 30,
};

//=========================
// Test Suite (테스트 스위트 섹션)
// 레시피 상세 페이지의 주요 기능들을 검증하는 테스트 케이스들의 집합입니다.
//=========================
describe('RecipePage (레시피 상세 페이지)', () => {
    const mockParams = { id: '1' }; // 상세 페이지 URL 파라미터 시뮬레이션

    // 각 테스트가 시작되기 전에 실행되는 초기화 작업입니다.
    beforeEach(() => {
        vi.clearAllMocks(); // 이전 테스트의 모킹 기록을 초기화합니다.
        
        // 기본 API 응답을 성공 상태로 설정합니다.
        recipeApi.getRecipeDetail.mockResolvedValue(mockRecipeDetail); // 레시피 상세 정보 반환
        authApi.getMeApi.mockResolvedValue({ data: { data: { userId: 123 } } }); // 로그인 사용자 정보 반환
        bookmarkApi.checkBookmarkStatus.mockResolvedValue({ data: true }); // 북마크 상태 확인 결과 반환
    });

    // 1. 초기 렌더링 및 데이터 표시 테스트
    it('레시피 상세 정보를 불러와서 올바르게 표시한다', async () => {
        const component = await RecipePage({ params: mockParams });
        render(component); // 컴포넌트를 렌더링합니다.

        // 비동기 데이터 로드 완료 UI 검증
        await waitFor(() => {
            expect(screen.getByText('맛있는 김치찌개')).toBeInTheDocument(); // 제목 표시 확인
            expect(screen.getByText('30분')).toBeInTheDocument(); // 조리 시간 표시 확인
            expect(screen.getByText('2인분')).toBeInTheDocument(); // 분량 정보 표시 확인
        });

        // 재료 리스트 렌더링 확인
        expect(screen.getByText('김치')).toBeInTheDocument();
        expect(screen.getByText('200g')).toBeInTheDocument();

        // 조리 순서(Step) 렌더링 확인
        expect(screen.getByText('김치를 볶습니다.')).toBeInTheDocument();
        expect(screen.getByText('고기를 넣고 더 볶습니다.')).toBeInTheDocument();
    });

    // 2. 북마크 상호작용 테스트
    it('북마크 추가/제거 기능을 테스트한다', async () => {
        const user = userEvent.setup(); // 사용자 이벤트 시뮬레이션을 설정합니다.
        bookmarkApi.checkBookmarkStatus.mockResolvedValue(true); // 초기 상태를 북마크된 상태로 설정합니다.
        
        // window.alert 모킹: 브라우저 알림창이 뜨는 것을 가로채서 확인합니다.
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        const component = await RecipePage({ params: mockParams });
        render(component);

        // '북마크 제거' 버튼이 표시될 때까지 대기합니다.
        await waitFor(() => {
            expect(screen.getByText('북마크 제거')).toBeInTheDocument();
        });

        // 사용자가 '북마크 제거' 버튼을 클릭하는 상황을 시뮬레이션합니다.
        await user.click(screen.getByText('북마크 제거'));
        
        // 북마크 제거 API가 올바른 인자(사용자 ID, 레시피 ID)로 호출되었는지 검증합니다.
        expect(bookmarkApi.removeBookmark).toHaveBeenCalledWith(123, '1');
        // 성공 알림 메시지가 올바르게 표시되었는지 확인합니다.
        expect(alertMock).toHaveBeenCalledWith('북마크에서 제거되었습니다.');

        alertMock.mockRestore(); // 모킹된 alert를 원래 상태로 복구합니다.
    });

    // 3. 요리 완료 처리 테스트
    it('요리 완료 버튼 클릭 시 API를 호출한다', async () => {
        const user = userEvent.setup();
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        const component = await RecipePage({ params: mockParams });
        render(component);

        // 데이터 로드 완료 후 '요리 완료' 버튼 확인
        await waitFor(() => {
            expect(screen.getByText('요리 완료')).toBeInTheDocument();
        });

        // '요리 완료' 버튼 클릭 시뮬레이션
        await user.click(screen.getByText('요리 완료'));

        // 요리 완료 API(재료 소진 처리 등)가 호출되었는지 검증합니다.
        expect(recipeApi.ateRecipe).toHaveBeenCalledWith('1');
        expect(alertMock).toHaveBeenCalledWith('요리가 완료되었습니다! 재료가 소진되었습니다.');

        alertMock.mockRestore();
    });
});
