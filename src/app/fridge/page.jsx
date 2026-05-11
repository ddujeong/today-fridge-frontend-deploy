"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { normalizeIngredientItem } from "@/lib/fridgeApiNormalize";
import { fridgeApi } from "@/api/fridgeApi";
import PrivateLayout from "@/components/layout/private/PrivateLayout";
import InputText from "@/components/ui/InputText.jsx"
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import Modal from "@/components/ui/Modal.jsx";
import Recipe from "@/components/ui/Recipe.jsx";
import TestImg from "@/assets/test_img.jpg";
import Tag from "@/components/ui/Tag.jsx"
import Title from "@/components/ui/Title.jsx";
import SubTitle from "@/components/ui/SubTitle.jsx";
import Select from "@/components/ui/Select.jsx";
import IngredientComponent from "./components/Ingredient.jsx"
import Loading from "@/components/ui/Loading.jsx";
import { fileAssetPublicUrl } from "@/lib/fileAssetUrl";
import { inferCategoryIdFromIngredientName } from "@/lib/ingredientCategoryHeuristic";

// 모달 모드: 0: 닫힘, 1: 수정, 2: 추가
const ModalModes = {close: 0, edit: 1, add: 2};

const StorageType = {
    REFRIGERATED: "REFRIGERATED",
    FROZEN: "FROZEN",
    ROOM_TEMP: "ROOM_TEMP",
    UNKNOWN: "UNKNOWN",
};
const StorageType2Kor = {
    REFRIGERATED: "냉장",
    FROZEN: "냉동",
    ROOM_TEMP: "실온",
    UNKNOWN: '알 수 없음',
}

// 1. 식재료 데이터 모델 (프론트 로컬 상태)
// 백엔드 DTO 매핑: id→ingredientId, name→name, expire→expirationDate, qty→quantity, categoryId→categoryId
class Ingredient {

    constructor(
        id = null,
        name = "",
        expire = null,
        qty = 0,
        storageType = StorageType.UNKNOWN,
        freshnessStatus = null,
        categoryId = null,
        category = null,
        visionFileId = null,
        imageStoragePath = null,
        imageStoredName = null
    ) {
        this.id = id;
        this.name = name;
        this.expire = expire;
        this.qty = qty;
        this.storageType = storageType;
        this.freshnessStatus = freshnessStatus;
        this.categoryId = categoryId;
        this.category = category;
        /** 이미지 인식 후 발급된 file_asset id — 등록·수정 시 file_id 로 전달 */
        this.visionFileId = visionFileId;
        this.imageStoragePath = imageStoragePath;
        this.imageStoredName = imageStoredName;
    }

    cloneWith(fields) {
        const next = new Ingredient(
            this.id,
            this.name,
            this.expire,
            this.qty,
            this.storageType,
            this.freshnessStatus,
            this.categoryId,
            this.category,
            this.visionFileId,
            this.imageStoragePath,
            this.imageStoredName
        );
        Object.assign(next, fields);
        return next;
    }
}

function fromApiItem(raw) {
    const item = normalizeIngredientItem(raw);
    return new Ingredient(
        item.ingredientId,
        item.name,
        item.expirationDate,
        item.quantity,
        item.storageType ?? StorageType.UNKNOWN,
        item.freshnessStatus ?? null,
        item.categoryId ?? null,
        item.category ?? null,
        item.imageFileId ?? null,
        item.imageStoragePath ?? null,
        item.imageStoredName ?? null
    );
}

function toApiDto(ingredient, fallbackFileId = null) {
    const q = Number(ingredient.qty);
    const dto = {
        name: ingredient.name,
        quantity: Number.isFinite(q) ? q : 0,
        storageType: ingredient.storageType,
    };
    const exp = ingredient.expire;
    if (exp != null && exp !== "") {
        dto.expirationDate = exp;
    }
    const cid = ingredient.categoryId;
    if (cid != null && cid !== "") {
        dto.categoryId = cid;
    }
    const vf = ingredient.visionFileId ?? fallbackFileId;
    if (vf != null) {
        const n = Number(vf);
        if (Number.isFinite(n) && n > 0) {
            dto.file_id = n;
        }
    }
    return dto;
}

// 2. 이미지 스캐너 데이터 모델 (results: API 후보 — 표시명 + 일치율 % + 폼에 넣을 이름)
class ImageScanner {
    constructor(file = null, previewUrl = null, results = []) {
        this.file = file;
        this.previewUrl = previewUrl;
        /** @type {{ pickName: string, pct: number | null }[]} */
        this.results = results;
    }

    cloneWith(fields) {
        const next = new ImageScanner(this.file, this.previewUrl, this.results);
        Object.assign(next, fields);
        return next;
    }

    reset() {
        return new ImageScanner();
    }
}

/** recognizedCandidates → 최대 3건, confidence 0~1 → 정수 % */
function mapVisionCandidatesForUi(candidates) {
    const list = Array.isArray(candidates) ? candidates : [];
    return list.slice(0, 3).map((c) => {
        const conf = Number(c.confidence);
        const pct = Number.isFinite(conf)
            ? Math.min(100, Math.max(0, Math.round(conf * 100)))
            : null;
        const pickName =
            (c.displayName && String(c.displayName).trim()) ||
            (c.normalizedName && String(c.normalizedName).trim()) ||
            (c.modelLabel && String(c.modelLabel).trim()) ||
            "알 수 없음";
        return { pickName, pct };
    });
}

export default function FridgePage() {
    const [modalMode, setModalMode] = useState(0);
    const [editIdx, setEditIdx] = useState(null);

    const fileInputRef = useRef(null);
    /** state 갱신 타이밍과 무관하게 등록 시 file_id 전달 */
    const visionFileIdRef = useRef(null);

    const [storage, setStorage] = useState([]);
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [currentIngredient, setCurrentIngredient] = useState(new Ingredient());
    const [scanner, setScanner] = useState(new ImageScanner());
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [mutatingText, setMutatingText] = useState("");
    /** 이미지 인식 API 실패 시 사용자 안내 */
    const [visionRecognitionError, setVisionRecognitionError] = useState("");

    const fetchIngredients = useCallback(async () => {
        try {
            const res = await fridgeApi.getIngredients();
            const items = res.data?.data?.items ?? [];
            setStorage(items.map(fromApiItem));
        } catch (err) {
            console.error("식재료 목록 조회 실패:", err);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fridgeApi.getSummary();
            setSummary(res.data?.data ?? null);
        } catch (err) {
            console.error("냉장고 요약 조회 실패:", err);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fridgeApi.getCategories();
            setCategories(res.data?.data ?? []);
        } catch (err) {
            console.error("카테고리 목록 조회 실패:", err);
        }
    }, []);

    useEffect(() => {
        fetchIngredients();
        fetchSummary();
        fetchCategories();
    }, [fetchIngredients, fetchSummary, fetchCategories]);

    const updateField = (field, value) => {
        setCurrentIngredient(prev => prev.cloneWith({ [field]: value }));
    };

    const closeModal = useCallback(() => {
        visionFileIdRef.current = null;
        setVisionRecognitionError("");
        setModalMode(ModalModes.close);
    }, []);

    function onSelectImgScanResult(selected) {
        setScanner((prev) => prev.cloneWith({ results: [] }));
        const inferredCatId = inferCategoryIdFromIngredientName(selected, categories);
        setCurrentIngredient((prev) => {
            let next = prev.cloneWith({ name: selected });
            if (inferredCatId != null) {
                next = next.cloneWith({ categoryId: inferredCatId });
            }
            return next;
        });
    }

    const handleConfirm = async () => {
        const isEditMode = modalMode === ModalModes.edit;
        if (isEditMode) {
            setMutatingText("식재료 수정하는 중...");
            setIsMutating(true);
        }
        try {
            const dto = toApiDto(currentIngredient, visionFileIdRef.current);
            if (modalMode === ModalModes.add) {
                await fridgeApi.addIngredient(dto);
            } else if (modalMode === ModalModes.edit && editIdx !== null) {
                await fridgeApi.updateIngredient(currentIngredient.id, dto);
            }
            await fetchIngredients();
            await fetchSummary();
            closeModal();
        } catch (err) {
            console.error("식재료 저장 실패:", err);
        } finally {
            if (isEditMode) {
                setIsMutating(false);
                setMutatingText("");
            }
        }
    };

    const handleClickDelete = async (ingredient) => {
        setMutatingText("식재료 삭제하는 중...");
        setIsMutating(true);
        try {
            await fridgeApi.deleteIngredient(ingredient.id);
            await fetchIngredients();
            await fetchSummary();
        } catch (err) {
            console.error("식재료 삭제 실패:", err);
        } finally {
            setIsMutating(false);
            setMutatingText("");
        }
    };

    const storageCategories = Object.keys(StorageType).map(typeKey => ({
        type: StorageType[typeKey],
        title: StorageType2Kor[typeKey],
    }));

    return (
        <PrivateLayout>
            <Section>
                {/* 냉장고 현황 카드 */}
                <Card style={{ backgroundColor: "var(--border)" }}>
                    <div className="flex flex-row justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <Title>냉장고 현황</Title>
                            <SubTitle>현재 냉장고에 있는 재료들을 확인하세요</SubTitle>
                        </div>
                        <Button handleClick={() => {
                            visionFileIdRef.current = null;
                            setVisionRecognitionError("");
                            setCurrentIngredient(new Ingredient());
                            setScanner(new ImageScanner());
                            setModalMode(ModalModes.add);
                        }}>식재료 추가</Button>
                    </div>
                    {summary && (
                        <div className="mb-4">
                            <div className="flex flex-row gap-4 mb-3 text-sm">
                                <span>전체 <strong>{summary.totalCount}</strong></span>
                                <span className="text-green-600">신선 <strong>{summary.freshCount}</strong></span>
                                <span className="text-orange-500">임박 <strong>{summary.soonCount}</strong></span>
                                <span className="text-red-500">만료 <strong>{summary.expiredCount}</strong></span>
                            </div>
                            {summary.soonItems && summary.soonItems.length > 0 && (
                                <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid #f97316" }}>
                                    <div className="font-semibold text-orange-500 mb-2">⚠ 유통기한 임박 재료</div>
                                    <div className="flex flex-col gap-1">
                                        {summary.soonItems.map((item) => {
                                            const ingredient = storage.find(s => s.id === item.ingredientId);
                                            return (
                                                <div
                                                    key={item.ingredientId}
                                                    className="flex flex-row justify-between items-center cursor-pointer hover:opacity-70 rounded px-1 py-0.5 transition-opacity"
                                                    onClick={() => {
                                                        if (ingredient) {
                                                            visionFileIdRef.current =
                                                                ingredient.visionFileId ?? null;
                                                            setCurrentIngredient(ingredient);
                                                            setScanner(new ImageScanner());
                                                            setEditIdx(storage.indexOf(ingredient));
                                                            setModalMode(ModalModes.edit);
                                                        }
                                                    }}
                                                >
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-orange-400 text-xs">{item.expirationDate} 까지</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        {storage.map((each, idx) => (
                            <IngredientComponent
                                key={each.id ?? idx}
                                ingredientId={each.id}
                                imageUrl={fileAssetPublicUrl(each.imageStoragePath, each.imageStoredName)}
                                name={each.name}
                                description="식재료 메모"
                                expires={each.expire}
                                qty={each.qty}
                                storageType={StorageType2Kor[each.storageType]}
                                category={each.category}
                                freshnessStatus={each.freshnessStatus}
                                handleClickDelete={() => handleClickDelete(each)}
                                handleClickEdit={() => {
                                    setCurrentIngredient(each);
                                    setScanner(new ImageScanner());
                                    setEditIdx(idx);
                                    setModalMode(ModalModes.edit);
                                }}
                            />
                        ))}
                    </div>
                </Card>

                {/* 보관 장소 타입별 재료 표시 */}
                {storageCategories.map((category) => (
                    <Card key={category.type}>
                        <div className="flex flex-col mb-4">
                            <Title>{category.title}</Title>
                            <SubTitle>현재 냉장고에 있는 재료들 중 {category.title} 으로 분류된 재료들 입니다.</SubTitle>
                        </div>
                        <div className="flex flex-col gap-2">
                            {storage
                                .filter(each => each.storageType === category.type)
                                .map((each, idx) => (
                                    <IngredientComponent
                                        key={each.id ?? idx}
                                        ingredientId={each.id}
                                        imageUrl={fileAssetPublicUrl(each.imageStoragePath, each.imageStoredName)}
                                        name={each.name}
                                        description="식재료 메모"
                                        expires={each.expire}
                                        qty={each.qty}
                                        storageType={StorageType2Kor[each.storageType]}
                                        category={each.category}
                                        freshnessStatus={each.freshnessStatus}
                                        handleClickDelete={() => handleClickDelete(each)}
                                        handleClickEdit={() => {
                                            visionFileIdRef.current = each.visionFileId ?? null;
                                            setCurrentIngredient(each);
                                            setScanner(new ImageScanner());
                                            setEditIdx(storage.indexOf(each));
                                            setModalMode(ModalModes.edit);
                                        }}
                                    />
                                ))
                            }
                        </div>
                    </Card>
                ))}

                <Loading
                    isOpen={isRecognizing || isMutating}
                    text={isRecognizing ? "이미지 인식하는 중.." : mutatingText}
                ></Loading>
                <Modal
                    title={modalMode === ModalModes.add ? "재료 추가" : "재료 수정"}
                    isOpen={modalMode !== ModalModes.close}
                    onClose={closeModal}
                    onConfirm={handleConfirm}
                    confirmText={modalMode === ModalModes.add ? "추가" : "수정"}>
                    <div className="flex flex-col gap-4">
                        {!scanner.previewUrl &&
                            (currentIngredient.imageStoragePath ||
                                currentIngredient.imageStoredName) && (
                                <div
                                    className="overflow-hidden rounded-2xl border bg-gray-50"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={fileAssetPublicUrl(
                                            currentIngredient.imageStoragePath,
                                            currentIngredient.imageStoredName
                                        )}
                                        alt=""
                                        className="mx-auto max-h-[min(22rem,55vh)] w-full object-contain"
                                    />
                                </div>
                            )}
                        {scanner.previewUrl ? (
                            <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-gray-100">
                                <div className="relative min-h-[14rem] w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={scanner.previewUrl}
                                        alt="인식 미리보기"
                                        className="mx-auto max-h-[min(22rem,50vh)] min-h-[12rem] w-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            visionFileIdRef.current = null;
                                            setVisionRecognitionError("");
                                            setScanner((prev) => {
                                                if (prev.previewUrl?.startsWith("blob:")) {
                                                    URL.revokeObjectURL(prev.previewUrl);
                                                }
                                                return prev.reset();
                                            });
                                            setCurrentIngredient((prev) =>
                                                prev.cloneWith({ visionFileId: null })
                                            );
                                        }}
                                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
                                    >
                                        ×
                                    </button>
                                </div>
                                {scanner.results.length > 0 ? (
                                    <div className="flex w-full flex-row flex-wrap gap-2 border-t border-black/5 bg-white/90 p-3">
                                        {scanner.results.map((row, idx) => (
                                            <Button
                                                key={idx}
                                                is_full="true"
                                                variant="primary"
                                                size="sm"
                                                handleClick={() => onSelectImgScanResult(row.pickName)}
                                            >
                                                <span className="flex flex-col items-center gap-0.5 leading-tight">
                                                    <span>{row.pickName}</span>
                                                    <span className="text-xs font-normal opacity-90">
                                                        {row.pct != null ? `${row.pct}%` : "—"}
                                                    </span>
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <InputText
                            is_full="true"
                            placeholder="재료 이름"
                            setText={currentIngredient.name}
                            getText={(val) => updateField("name", val)}
                        />
                        <div className="flex flex-row flex-wrap items-center gap-2">
                            <Button
                                is_square="true"
                                is_full="true"
                                variant="accent"
                                handleClick={() => fileInputRef.current?.click()}
                            >
                                {modalMode === ModalModes.edit &&
                                (currentIngredient.imageStoragePath ||
                                    currentIngredient.imageStoredName ||
                                    scanner.previewUrl)
                                    ? "이미지 수정"
                                    : "이미지 인식"}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setVisionRecognitionError("");
                                    const previewUrl = URL.createObjectURL(file);
                                    setScanner((prev) => {
                                        if (prev.previewUrl?.startsWith("blob:")) {
                                            URL.revokeObjectURL(prev.previewUrl);
                                        }
                                        return prev.cloneWith({ file, previewUrl, results: [] });
                                    });
                                    setIsRecognizing(true);
                                    try {
                                        const res = await fridgeApi.recognizeIngredientImage(file, 3);
                                        const payload = res.data?.data;
                                        const candidates =
                                            payload?.recognizedCandidates ?? [];
                                        const results = mapVisionCandidatesForUi(candidates);
                                        setScanner((prev) =>
                                            prev.cloneWith({ file, previewUrl, results })
                                        );
                                        let fid =
                                            payload?.fileId ??
                                            payload?.file_id ??
                                            payload?.imageFileId;
                                        if (typeof fid === "string" && /^\d+$/.test(fid)) {
                                            fid = Number(fid);
                                        }
                                        if (typeof fid === "number" && Number.isFinite(fid) && fid > 0) {
                                            visionFileIdRef.current = fid;
                                            setCurrentIngredient((prev) =>
                                                prev.cloneWith({ visionFileId: fid })
                                            );
                                        }
                                    } catch (err) {
                                        console.error("이미지 인식 실패:", err);
                                        setVisionRecognitionError(
                                            "이미지 인식에 실패했습니다. 서버·네트워크 상태를 확인하거나, 재료 이름을 직접 입력해 주세요."
                                        );
                                        visionFileIdRef.current = null;
                                        setScanner((prev) =>
                                            prev.cloneWith({ file, previewUrl, results: [] })
                                        );
                                        setCurrentIngredient((prev) =>
                                            prev.cloneWith({ visionFileId: null })
                                        );
                                    } finally {
                                        setIsRecognizing(false);
                                    }
                                    e.target.value = "";
                                }}
                            />
                        </div>
                        {visionRecognitionError ? (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                {visionRecognitionError}
                            </p>
                        ) : null}
                        <Select
                            placeholder="카테고리 선택"
                            options={categories.map(cat => ({
                                label: cat.categoryName,
                                value: cat.categoryId
                            }))}
                            setText={currentIngredient.categoryId}
                            getText={(val) => updateField('categoryId', val)}
                            is_full="true"
                        />
                        <Select
                            placeholder="보관 장소 선택"
                            options={Object.entries(StorageType2Kor).map(([key, label]) => ({
                                label: label,
                                value: key
                            }))}
                            setText={currentIngredient.storageType}
                            getText={(val) => updateField('storageType', val)}
                            is_full="true"
                        />
                        <InputText
                            placeholder="수량"
                            setText={currentIngredient.qty}
                            getText={(val) => updateField('qty', val)}
                        />
                    </div>
                </Modal>
            </Section>
        </PrivateLayout>
    );
}
