import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "오늘의 냉장고",
  description: "냉장고 재료 기반 맞춤 레시피 추천 서비스",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}