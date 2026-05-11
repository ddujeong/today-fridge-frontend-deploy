'use client';

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function Modal({
    isOpen,
    title = "모달 제목",
    description = "",
    children,
    onClose,
    onConfirm,
    confirmText = "확인",
    cancelText = "취소",
    showFooter = true,
    closeOnOverlay = true,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !isOpen) return;

        const previousOverflow = document.body.style.overflow;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mounted, isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    const base = {
        overlay: "fixed inset-0 z-50 flex items-center justify-center px-4 py-6",
        panel: "relative w-full max-w-[560px] overflow-hidden rounded-[20px] border bg-white shadow-lg",
        header: "border-b px-6 py-5",
        headerTop: "flex items-center justify-between gap-4",
        body: "px-6 py-5",
        footer: "flex justify-between gap-3 px-6 py-4",
        closeButton:
            "inline-flex h-10 w-10 items-center justify-center text-4xl font-thin leading-none transition hover:opacity-80",
    };

    const inlineStyle = {
        overlay: {
            backgroundColor: "rgba(59, 49, 43, 0.45)",
        },
        panel: {
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border)",
        },
        header: {
            borderColor: "var(--border)",
        },
        footer: {
            borderColor: "var(--border)",
        },
        title: {
            color: "var(--text-main)",
        },
        description: {
            color: "var(--text-sub)",
        },
        closeButton: {
            color: "var(--text-sub)",
        },
    };

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose?.();
        }
    };
    if (typeof document === "undefined") return null;
    return createPortal(
        <div
            className={base.overlay}
            style={inlineStyle.overlay}
            onClick={handleOverlayClick}
        >
            <div
                className={base.panel}
                style={inlineStyle.panel}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={base.header} style={inlineStyle.header}>
                    <div className={base.headerTop}>
                        <h2
                            className="text-2xl font-extrabold"
                            style={inlineStyle.title}
                        >
                            {title}
                        </h2>

                        <button
                            type="button"
                            className={base.closeButton}
                            style={inlineStyle.closeButton}
                            onClick={onClose}
                            aria-label="모달 닫기"
                        >
                            <span className="text-3xl font-100">×</span>
                        </button>
                    </div>

                    {description ? (
                        <p
                            className="mt-2 text-sm leading-6"
                            style={inlineStyle.description}
                        >
                            {description}
                        </p>
                    ) : null}
                </div>

                <div className={base.body}>
                    {children}
                </div>

                {showFooter && (
                    <div className={base.footer} style={inlineStyle.footer}>
                        <Button
                            variant="secondary"
                            className="w-fill"
                            is_square="true"
                            is_full="true"
                            handleClick={onClose}
                        >
                            {cancelText}
                        </Button>

                        <Button
                            variant="primary"
                            is_square="true"
                            is_full="true"
                            handleClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}