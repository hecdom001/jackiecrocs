"use client";

import { useState, type FormEvent } from "react";
import type { Lang } from "@/lib/jackieCatalogUtils";
import { t } from "@/lib/jackieCatalogUtils";

export function FeedbackBox({ lang, context }: { lang: Lang; context: string }) {
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

    const disabled = message.trim().length === 0 || status === "sending";

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (disabled) return;

        try {
            setStatus("sending");

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, lang, context }),
            });

            if (!res.ok) throw new Error("Request failed");

            setStatus("success");
            setMessage("");

            setTimeout(() => setStatus("idle"), 3000);
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    }

    return (
        <section className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm space-y-2">
            <form onSubmit={handleSubmit} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                    {t(lang, "¿Cómo podemos mejorar tu experiencia?", "How can we improve your experience?")}
                </label>

                <textarea
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                    rows={3}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (status !== "idle") setStatus("idle");
                    }}
                    placeholder={t(lang, "Cuéntanos si algo te confundió…", "Tell us if something was confusing…")}
                    inputMode="text"
                    autoComplete="off"
                    spellCheck
                />

                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-500">{t(lang, "Se envía de forma anónima", "Sent anonymously")}</p>
                    <button
                        type="submit"
                        disabled={disabled}
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${
                            disabled ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"
                        }`}
                    >
                        {status === "sending"
                            ? t(lang, "Enviando…", "Sending…")
                            : t(lang, "Enviar comentario", "Send feedback")}
                    </button>
                </div>
            </form>

            {status === "success" && <p className="text-[11px] text-emerald-600">{t(lang, "¡Gracias por tu comentario! 💚", "Thanks for your feedback! 💚")}</p>}
            {status === "error" && <p className="text-[11px] text-red-500">{t(lang, "Hubo un error al enviar 🙏", "There was an error sending 🙏")}</p>}
        </section>
    );
}
