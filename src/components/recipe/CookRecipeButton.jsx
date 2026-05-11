"use client";

import { useState } from "react";
import { cookRecipe } from "@/api/recipeApi";
import { fridgeApi } from "@/api/fridgeApi";
import { useAuth } from "@/context/AuthContext";
import { normalizeIngredientItem } from "@/lib/fridgeApiNormalize";
import styles from "./CookRecipeButton.module.css";

export default function CookRecipeButton({ recipeId, recipeIngredients }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCook = async () => {
    if (!user || !user.userId) {
      alert("요리 완료 기능을 사용하려면 로그인이 필요합니다.");
      return;
    }

    if (loading || success) return;

    if (!confirm("이 레시피를 요리하셨나요? 냉장고의 재료가 자동으로 차감됩니다.")) {
      return;
    }

    setLoading(true);
    try {
      let reduceLog = [];
      let deleteLog = [];

      try {
        const res = await fridgeApi.getIngredients();
        const fridgeItems = (res.data?.data?.items ?? []).map(normalizeIngredientItem);

        if (recipeIngredients && recipeIngredients.length > 0) {
          for (const ing of recipeIngredients) {
            if (!ing.normalizedNameSnapshot) continue;

            const matches = fridgeItems.filter(fItem => {
              if (!fItem.name) return false;
              const fName = fItem.name.trim().toLowerCase();
              const rName = ing.normalizedNameSnapshot.trim().toLowerCase();
              return fName === rName || fName.includes(rName) || rName.includes(fName);
            });

            if (matches.length > 0) {
              let reqAmount = parseFloat(ing.amountText);
              if (isNaN(reqAmount)) reqAmount = 1;

              for (const item of matches) {
                if (reqAmount <= 0) break;

                let currentQty = parseFloat(item.quantity);
                if (isNaN(currentQty)) currentQty = 1;

                const reduceAmount = Math.min(currentQty, reqAmount);
                const newQty = currentQty - reduceAmount;
                reqAmount -= reduceAmount;

                if (newQty <= 0) {
                  await fridgeApi.deleteIngredient(item.ingredientId);
                  deleteLog.push(`[${item.name}] 재료가 모두 소진되어 삭제되었습니다. (차감량: ${reduceAmount})`);
                } else {
                  await fridgeApi.updateIngredient(item.ingredientId, { ...item, quantity: newQty });
                  reduceLog.push(`[${item.name}] 재료가 ${reduceAmount}만큼 차감되었습니다. (남은 양: ${newQty})`);
                }
              }
            }
          }
        }
      } catch (fridgeError) {
        console.error("냉장고 재료 차감 중 오류 발생:", fridgeError);
      }

      await cookRecipe(recipeId);
      setSuccess(true);
      
      let alertMsg = "요리 완료!\n\n";
      if (reduceLog.length > 0) {
        alertMsg += "==== 차감 내역 ====\n" + reduceLog.join("\n") + "\n\n";
      }
      if (deleteLog.length > 0) {
        alertMsg += "==== 삭제 내역 ====\n" + deleteLog.join("\n") + "\n\n";
      }
      if (reduceLog.length === 0 && deleteLog.length === 0) {
        alertMsg += "매칭되는 냉장고 재료가 없어 차감되지 않았습니다.";
      }
      
      console.log("냉장고 차감 로그:", { reduceLog, deleteLog });
      alert(alertMsg);

      window.location.reload(); 
    } catch (error) {
      console.error("요리 완료 처리 중 오류 발생:", error);
      alert(error.message || "요리 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`${styles.cookButton} ${success ? styles.success : ""}`}
      onClick={handleCook}
      disabled={loading || success}
    >
      {loading ? (
        <span className={styles.loader}></span>
      ) : success ? (
        "요리 완료됨 ✓"
      ) : (
        "요리 완료"
      )}
    </button>
  );
}
