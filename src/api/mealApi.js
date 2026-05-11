import api from "@/config/axios";
import { unwrapApiData } from "@/api/utils";

export const mealApi = {
    /**
     * Fetch daily nutrition targets and current intake
     */
    getDailyNutrition: async () => {
        const response = await api.get("/v1/meal/daily-nutrition");
        return unwrapApiData(response);
    },

    /**
     * Fetch meal logs for today
     */
    getMealLogs: async () => {
        const response = await api.get("/v1/meal");
        return unwrapApiData(response);
    },

    /**
     * Fetch weekly nutrition report
     */
    getWeeklyReport: async () => {
        const response = await api.get("/v1/meal/reports/weekly");
        return unwrapApiData(response);
    },

    /**
     * Fetch monthly nutrition report
     */
    getMonthlyReport: async () => {
        const response = await api.get("/v1/meal/reports/monthly");
        return unwrapApiData(response);
    },

    /**
     * Fetch meal recommendation
     */
    getMealRecommendation: async () => {
        const response = await api.post("/v1/meal/recommendation");
        return unwrapApiData(response);
    },

    /**
     * Fetch cached meal recommendation (GET)
     */
    getCachedMealRecommendation: async () => {
        const response = await api.get("/v1/meal/recommendation");
        return unwrapApiData(response);
    }
};
