"use client";

import { useEffect, useState } from "react";
import { fridgeApi } from "@/api/fridgeApi";
import { shoppingApi } from "@/api/shoppingApi";
import RecipeInfoTable from "./RecipeInfoTable";
import { normalizeIngredientItem } from "@/lib/fridgeApiNormalize";

function ShoppingLinks({ ingredientName }) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchLinks = async () => {
            try {
                // Ensure keyword is clean
                const keyword = ingredientName.trim();
                const res = await shoppingApi.searchByKeyword(keyword);
                const data = res.data?.data || res.data;
                if (isMounted && data?.items) {
                    setLinks(data.items);
                }
            } catch (err) {
                console.error("Failed to fetch shopping links:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchLinks();
        return () => { isMounted = false; };
    }, [ingredientName]);

    if (loading) return <span className="text-xs text-gray-400">검색 중...</span>;

    if (links.length === 0) {
        // Fallback links if API returns nothing
        const encodedName = encodeURIComponent(ingredientName.trim());
        return (
            <div className="flex gap-1.5 flex-wrap items-center">
                <a
                    href={`https://search.shopping.naver.com/search/all?query=${encodedName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-0.5 rounded-md text-white bg-[#03C75A] transition-opacity hover:opacity-80"
                >
                    네이버
                </a>
                <a
                    href={`https://search.11st.co.kr/Search.tmall?kwd=${encodedName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-0.5 rounded-md text-white bg-[#E0001B] transition-opacity hover:opacity-80"
                >
                    11번가
                </a>
            </div>
        );
    }

    // Find the cheapest items
    const lowestPrice = Math.min(...links.map(l => l.price || Infinity));

    return (
        <div className="flex gap-1.5 flex-wrap items-center">
            {links.map((link, idx) => {
                const isLowest = link.price === lowestPrice;
                return (
                    <a
                        key={idx}
                        href={link.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs px-2 py-0.5 rounded-md text-white transition-opacity hover:opacity-80 ${isLowest ? 'bg-green-500 font-bold' : 'bg-blue-400'}`}
                    >
                        Buy ({link.mallName}: {link.price?.toLocaleString()}원)
                    </a>
                );
            })}
        </div>
    );
}

export default function RecipeIngredients({ recipeIngredients }) {
    const [fridgeItems, setFridgeItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFridge = async () => {
            try {
                const res = await fridgeApi.getIngredients();
                const items = res.data?.data?.items ?? [];
                setFridgeItems(items.map(normalizeIngredientItem));
            } catch (error) {
                console.error("Failed to fetch fridge items:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFridge();
    }, []);

    const data = (recipeIngredients || []).map((ing, idx) => {
        let hasEnough = false;

        if (!isLoading) {
            const matches = fridgeItems.filter(fItem => {
                if (!fItem.name || !ing.normalizedNameSnapshot) return false;
                const fName = fItem.name.trim().toLowerCase();
                const rName = ing.normalizedNameSnapshot.trim().toLowerCase();
                return fName === rName || fName.includes(rName) || rName.includes(fName);
            });

            if (matches.length > 0) {
                // Parse required amount
                const reqAmount = parseFloat(ing.amountText);
                if (isNaN(reqAmount)) {
                    // Cannot parse required amount, assume enough since we have at least some in fridge
                    hasEnough = true;
                } else {
                    // Sum up quantity of matched items
                    let totalQty = 0;
                    let hasUnparsableQty = false;

                    matches.forEach(item => {
                        const qty = parseFloat(item.quantity);
                        if (isNaN(qty)) {
                            hasUnparsableQty = true;
                        } else {
                            totalQty += qty;
                        }
                    });

                    if (totalQty >= reqAmount) {
                        hasEnough = true;
                    } else if (hasUnparsableQty) {
                        // We found items but couldn't parse their quantity, assume enough
                        hasEnough = true;
                    }
                }
            }
        }

        return {
            label: (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <span>{ing.normalizedNameSnapshot}</span>
                    {!isLoading && (
                        <span
                            className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${hasEnough ? 'bg-green-500' : 'bg-red-500'}`}
                            title={hasEnough ? "냉장고에 재료가 충분합니다" : "냉장고에 재료가 부족합니다"}
                        />
                    )}
                    {!isLoading && !hasEnough && (
                        <ShoppingLinks ingredientName={ing.normalizedNameSnapshot} />
                    )}
                </div>
            ),
            value: ing.amountText + (ing.unit != null ? ing.unit : "")
        };
    });

    return (
        <RecipeInfoTable
            title="재료 정보"
            data={data}
            columns={2}
        />
    );
}
