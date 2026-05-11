'use client';

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Loading({ isOpen = false, text = "불러오는 중..." }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mounted, isOpen]);

    if (!mounted || !isOpen) return null;

    const base = {
        overlay: "fixed inset-0 z-50 flex items-center justify-center px-4 py-6",
        panel: "flex flex-col items-center gap-4 rounded-2xl border px-8 py-7 shadow-lg",
        spinner:
            "h-14 w-14 rounded-full border-4 border-solid border-t-transparent animate-spin",
        text: "text-sm font-semibold",
    };

    const inlineStyle = {
        overlay: {
            backgroundColor: "rgba(59, 49, 43, 0.45)",
        },
        panel: {
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border)",
        },
        spinner: {
            borderColor: "var(--text-sub)",
            borderTopColor: "transparent",
        },
        text: {
            color: "var(--text-main)",
        },
    };
    if (typeof document === "undefined") return null;
    return createPortal(
        <div
            className={base.overlay}
            style={inlineStyle.overlay}
            role="status"
            aria-live="polite"
        >
            <div className={base.panel} style={inlineStyle.panel}>
                <div className={base.spinner} style={inlineStyle.spinner} />
                <p className={base.text} style={inlineStyle.text}>
                    {text}
                </p>
            </div>
        </div>,
        document.body
    );
}