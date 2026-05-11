"use client";

import React, { useEffect, useState } from 'react';
import PrivateLayout from '@/components/layout/private/PrivateLayout';
import styles from './HealthReport.module.css';
import { mealApi } from '@/api/mealApi';

export default function HealthReportPage() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);   // { report: string, recommendations: {breakfast:[id], lunch:[id], dinner:[id]} }
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAIReport = async () => {
            setLoading(true);
            setError(null);
            try {
                // First check memory (sessionStorage)
                const memoryData = sessionStorage.getItem('latestHealthReport');
                if (memoryData) {
                    try {
                        const parsed = JSON.parse(memoryData);
                        setReport(parsed);
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.error("Failed to parse memory report data", e);
                        sessionStorage.removeItem('latestHealthReport');
                    }
                }

                // Fallback to GET request for cached recommendation data (DB)
                const data = await mealApi.getCachedMealRecommendation();
                setReport(data);
            } catch (err) {
                console.error("AI 식단 추천 조회 실패:", err);
                setError(err?.response?.data?.message || '추천 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchAIReport();
    }, []);

    if (loading) {
        return (
            <PrivateLayout>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>AI가 식단을 분석하고 있습니다...</p>
                </div>
            </PrivateLayout>
        );
    }

    if (error || !report) {
        return (
            <PrivateLayout>
                <div className={styles.container}>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">맞춤 건강 레포트</h1>
                    <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
                        <p className="text-red-600 font-semibold">{error || '데이터를 불러오는 데 실패했습니다.'}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            식단 기록이 없거나 AI 서버에 연결할 수 없습니다. 식단을 먼저 기록해 주세요.
                        </p>
                    </div>
                </div>
            </PrivateLayout>
        );
    }

    const mealTypes = [
        { key: 'breakfast', label: '🌅 아침', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        { key: 'lunch',     label: '☀️ 점심', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { key: 'dinner',    label: '🌙 저녁', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ];

    return (
        <PrivateLayout>
            <div className={styles.container}>
                <header className="mb-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">맞춤 건강 레포트</h1>
                    <p className="text-gray-500 mt-2">AI가 분석한 식습관 기반 맞춤 추천 결과입니다.</p>
                </header>

                {/* AI Analysis Report */}
                <section className={`${styles.glassCard} mb-8`}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center" style={{backgroundColor: 'var(--color-primary-light)'}}>
                            <svg className="w-5 h-5" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                        </span>
                        AI 식단 분석 보고서
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.report}</p>
                </section>

                {/* Recipe Recommendations per meal type */}
                <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--color-primary-light)'}}>
                            <svg className="w-5 h-5" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        </span>
                        추천 레시피 (식사별)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {mealTypes.map(({ key, label, color }) => {
                            const recipes = report.recommendations?.[key] ?? [];
                            return (
                                <div key={key} className={`${styles.glassCard} border`}>
                                    <h3 className={`inline-block text-sm font-bold px-3 py-1 rounded-full border mb-4 ${color}`}>
                                        {label}
                                    </h3>
                                    {recipes.length > 0 ? (
                                        <ul className="space-y-3">
                                            {recipes.map((recipe, idx) => (
                                                <li key={recipe.recipe_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-all hover:shadow-sm" style={{'--tw-border-opacity': 1}}>
                                                    <div className="relative shrink-0">
                                                        {recipe.thumbnail_url ? (
                                                            <img 
                                                                src={recipe.thumbnail_url} 
                                                                alt={recipe.title} 
                                                                className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://via.placeholder.com/150?text=No+Img';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                                                                No Image
                                                            </div>
                                                        )}
                                                        <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{backgroundColor: 'var(--color-primary)'}}>
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] text-gray-400">ID #{recipe.recipe_id}</span>
                                                        <span className="text-sm font-bold text-gray-700 truncate leading-tight" title={recipe.title}>
                                                            {recipe.title}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">추천 레시피가 없습니다.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </PrivateLayout>
    );
}
