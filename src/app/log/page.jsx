"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './page.module.css';
import PrivateLayout from '@/components/layout/private/PrivateLayout';
import { mealApi } from '@/api/mealApi';
import { useRouter } from 'next/navigation';

export default function MealPage() {
    const router = useRouter();
    const [dailyData, setDailyData] = useState(null);
    const [mealLogs, setMealLogs] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [canRequestRecommendation, setCanRequestRecommendation] = useState(true);

    useEffect(() => {
        fetchData();
        
        // Check if recommendation was already requested today
        const lastDate = localStorage.getItem('lastMealRecommendationDate');
        const today = new Date().toDateString();
        if (lastDate === today) {
            setCanRequestRecommendation(false);
        }
    }, [activeTab]);

    const handleRecommendation = async () => {
        if (!canRequestRecommendation) return;
        
        try {
            const data = await mealApi.getMealRecommendation();
            
            // Save to memory (sessionStorage) rather than relying on DB for the next page
            if (data) {
                sessionStorage.setItem('latestHealthReport', JSON.stringify(data));
            }
            
            const today = new Date().toDateString();
            localStorage.setItem('lastMealRecommendationDate', today);
            setCanRequestRecommendation(false);
            
            router.push('/health-report');
        } catch (error) {
            console.error("Failed to get recommendation:", error);
            alert('추천을 가져오는데 실패했습니다.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'daily') {
                const [dailyRes, logsRes] = await Promise.all([
                    mealApi.getDailyNutrition(),
                    mealApi.getMealLogs()
                ]);
                
                setDailyData(dailyRes);
                
                // Adapt backend structure: response is already unwrapped by unwrapApiData
                const logs = Array.isArray(logsRes) ? logsRes : (logsRes?.data || []);
                setMealLogs(logs);
            } else {
                const report = activeTab === 'weekly' 
                    ? await mealApi.getWeeklyReport() 
                    : await mealApi.getMonthlyReport();
                
                setReportData(report);
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} data:`, error);
            // On error, we reset to empty states rather than using mock data
            if (activeTab === 'daily') {
                setDailyData(null);
                setMealLogs([]);
            } else {
                setReportData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const maxCals = useMemo(() => {
        if (!reportData || !reportData.dailyData) return 100;
        return Math.max(...reportData.dailyData.map(d => Number(d.calories)), 100);
    }, [reportData]);

    const renderProgressBar = (label, current, target, colorClass, unit = 'g') => {
        const currentVal = Number(current) || 0;
        const targetVal = Number(target) || 1;
        const percentage = Math.min((currentVal / targetVal) * 100, 100);
        return (
            <div className="mb-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className="text-xs text-gray-400">
                        <span className="text-gray-900 font-bold">{currentVal.toFixed(1)}</span> / {targetVal.toFixed(0)} {unit}
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const tabLabels = {
        daily: '일간',
        weekly: '주간',
        monthly: '월간'
    };

    return (
        <PrivateLayout>
            <div className={styles.container}>
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            식단 및 영양 분석
                        </h1>
                        <p className="text-gray-500 mt-2">일일 섭취량을 추적하고 건강한 균형을 유지하세요.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex flex-col items-end">
                            <button 
                                onClick={handleRecommendation}
                                disabled={!canRequestRecommendation}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${canRequestRecommendation ? 'bg-primary text-white hover:bg-primary-hover shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                style={canRequestRecommendation ? { backgroundColor: 'var(--color-primary)' } : {}}
                            >
                                AI 식단 추천 받기
                            </button>
                            <p className="text-[10px] text-gray-400 mt-1">하루에 한 번만 요청 가능합니다.</p>
                        </div>
                        <div className="flex space-x-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm h-fit">
                            {['daily', 'weekly', 'monthly'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                    style={activeTab === tab ? { backgroundColor: 'var(--color-primary)' } : {}}
                                >
                                    {tabLabels[tab]}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-80">
                        <div className={styles.loader}></div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'daily' && dailyData && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className={styles.glassCard}>
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-bold flex items-center">
                                                <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center mr-3" style={{backgroundColor: 'var(--color-primary-light)'}}>
                                                    <svg className="w-5 h-5 text-primary" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                </span>
                                                일일 섭취 현황
                                            </h2>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-gray-900">{(Number(dailyData.currentCalories) || 0).toFixed(0)} <span className="text-sm font-normal text-gray-400 uppercase tracking-widest">kcal</span></p>
                                                <p className="text-xs text-gray-500">목표: {(Number(dailyData.targetCalories) || 0).toFixed(0)} kcal</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">주요 영양소</h3>
                                                {renderProgressBar('탄수화물', dailyData.currentCarbs, dailyData.targetCarbs, 'bg-emerald-500')}
                                                {renderProgressBar('단백질', dailyData.currentProtein, dailyData.targetProtein, 'bg-rose-500')}
                                                {renderProgressBar('지방', dailyData.currentFat, dailyData.targetFat, 'bg-amber-500')}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">기타 지표</h3>
                                                {renderProgressBar('당류', dailyData.currentSugar, dailyData.targetSugar, 'bg-purple-500')}
                                                {renderProgressBar('나트륨', dailyData.currentSodium, dailyData.targetSodium, 'bg-sky-500', 'mg')}
                                                {renderProgressBar('콜레스테롤', dailyData.currentCholesterol, dailyData.targetCholesterol, 'bg-orange-500', 'mg')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.glassCard}>
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <span className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                                                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                            </span>
                                            오늘의 식사 기록
                                        </h2>
                                        {mealLogs.length > 0 ? (
                                            <div className="space-y-4">
                                                {mealLogs.map((log) => (
                                                    <div key={log.mealId || log.id} className={styles.mealItem}>
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800">{log.recipeTitle || log.mealName}</h4>
                                                                <p className="text-xs text-gray-500">
                                                                    {log.consumedAt ? new Date(log.consumedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : log.time} • {log.servings || 1} servings
                                                                </p>
                                                            </div>
                                                            <div className="bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20" style={{backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)'}}>
                                                                기록됨
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                                                <p className="text-gray-400">오늘 기록된 식사가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className={`${styles.glassCard} border-primary/30 bg-primary-light/10`}>
                                        <h2 className="text-xl font-bold mb-6 flex items-center">
                                            <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center mr-3" style={{backgroundColor: 'var(--color-primary-light)'}}>
                                                <svg className="w-5 h-5 text-primary" style={{color: 'var(--color-primary)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                            </span>
                                            영양 조언
                                        </h2>
                                        <div className="space-y-4">
                                            {dailyData.advice && dailyData.advice.length > 0 ? (
                                                dailyData.advice.map((adv, idx) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start group hover:border-primary/30 transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-3 group-hover:scale-125 transition-transform" style={{backgroundColor: 'var(--color-primary)'}}></div>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{adv}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">현재 특별한 조언이 없습니다. 잘하고 계세요!</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className={styles.statCard}>
                                        <div className="text-primary mb-2" style={{color: 'var(--color-primary)'}}>
                                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">개인 프로필</h3>
                                        <p className="text-xs text-gray-400 mt-2">영양 목표는 신체 지표를 바탕으로 계산됩니다.</p>
                                        <button className="mt-4 text-xs font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-widest" style={{color: 'var(--color-primary)'}}>프로필 수정</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'weekly' || activeTab === 'monthly') && reportData && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: '평균 칼로리', value: (Number(reportData.averageCalories) || 0).toFixed(0), unit: 'kcal', color: 'text-blue-500' },
                                        { label: '평균 탄수화물', value: (Number(reportData.averageCarbs) || 0).toFixed(1), unit: 'g', color: 'text-emerald-500' },
                                        { label: '평균 단백질', value: (Number(reportData.averageProtein) || 0).toFixed(1), unit: 'g', color: 'text-rose-500' },
                                        { label: '평균 지방', value: (Number(reportData.averageFat) || 0).toFixed(1), unit: 'g', color: 'text-amber-500' }
                                    ].map((stat, i) => (
                                        <div key={i} className={styles.statCard}>
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value} <span className="text-xs font-normal opacity-50">{stat.unit}</span></p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <div className={styles.glassCard}>
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold">영양 섭취 추이</h3>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center text-[10px] text-gray-400">
                                                        <div className="w-2 h-2 rounded-full bg-primary mr-1.5" style={{backgroundColor: 'var(--color-primary)'}}></div> 실제 기록
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-gray-400">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-1.5"></div> 추정치
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex h-64 items-end space-x-1.5 w-full overflow-x-auto pb-6 custom-scrollbar">
                                                {reportData.dailyData.map((day, idx) => {
                                                    const val = Number(day.calories) || 0;
                                                    const heightPct = (val / maxCals) * 100;
                                                    
                                                    return (
                                                        <div key={idx} className="flex flex-col items-center flex-1 min-w-[30px] group">
                                                            <div className="text-[10px] font-bold text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {val.toFixed(0)}
                                                            </div>
                                                            <div 
                                                                className={`w-full rounded-t-md transition-all duration-700 ease-out hover:scale-x-110 origin-bottom ${day.isImputed ? styles.trendBarImputed : styles.trendBarActual}`}
                                                                style={{ height: `${Math.max(heightPct, 5)}%` }}
                                                            ></div>
                                                            <div className="text-[9px] font-medium text-gray-500 mt-3 -rotate-45 origin-left whitespace-nowrap">
                                                                {new Date(day.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className={styles.glassCard}>
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">보조 영양소 평균</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: '당류', value: Number(reportData.averageSugar) || 0, unit: 'g' },
                                                    { label: '나트륨', value: Number(reportData.averageSodium) || 0, unit: 'mg' },
                                                    { label: '콜레스테롤', value: Number(reportData.averageCholesterol) || 0, unit: 'mg' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                        <span className="text-sm text-gray-500">{item.label}</span>
                                                        <span className="text-sm font-bold text-gray-800">{item.value.toFixed(1)} {item.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {reportData.missingDaysImputed > 0 && (
                                            <div className="bg-primary-light border border-primary/10 rounded-2xl p-5" style={{backgroundColor: 'var(--color-primary-light)', opacity: 0.8}}>
                                                <div className="flex items-center text-primary mb-2" style={{color: 'var(--color-primary)'}}>
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    <span className="text-xs font-bold uppercase tracking-tighter">데이터 알림</span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    기록이 누락된 <span className="text-primary font-bold" style={{color: 'var(--color-primary)'}}>{reportData.missingDaysImputed}일</span>의 데이터가 있습니다. 연속적인 분석을 위해 사용자의 평균 섭취 패턴을 기반으로 추정치를 적용했습니다.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PrivateLayout>
    );
}
