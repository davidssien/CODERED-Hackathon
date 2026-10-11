"use client";
import { useEffect, useRef, useState } from "react";
import type { PermitExplanation } from "@/lib/assistance";

export default function PermitActions({ permitId }: { permitId: string }) {
  const [explanation, setExplanation] = useState<PermitExplanation | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState<"explanation" | "comment" | null>(null);
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const load = async (action: "explanation" | "comment") => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(action); setMessage("");
    try {
      const response = await fetch(`/api/permits/${encodeURIComponent(permitId)}/${action}`, {
        method: action === "explanation" ? "POST" : "GET",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "This feature is unavailable. Please retry.");
      if (action === "explanation") setExplanation(body);
      else { setDraft(body.draft); setWarning(body.warning); }
    } catch (error) {
      if (!request.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load this feature.");
    } finally { if (!request.signal.aborted) setBusy(null); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(draft || ""); setMessage("Draft copied. Review the official notice before submitting it yourself."); }
    catch { setMessage("Could not copy. You can select and copy the draft manually."); }
  };
  return <section className="mt-5 rounded-3xl border border-slate-200 p-4">
    <h3 className="text-sm font-semibold">Understand and respond</h3>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={Boolean(busy)} onClick={() => load("explanation")} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === "explanation" ? "Loading explanation…" : "Explain this permit"}</button>
      <button type="button" disabled={Boolean(busy) || draft !== null} onClick={() => load("comment")} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">{busy === "comment" ? "Creating draft…" : "Create editable comment"}</button>
    </div>
    {explanation ? <div className="mt-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{explanation.mode === "gemini" ? "Gemini explanation" : "Cached facts summary"}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{explanation.explanation}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{explanation.message}</p>
    </div> : null}
    {draft !== null ? <div className="mt-4">
      <label htmlFor="comment-draft" className="text-xs font-semibold">Your editable draft · template, not AI generated</label>
      <textarea id="comment-draft" rows={12} value={draft} onChange={event => setDraft(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-xs leading-5" />
      <p className="mt-2 text-xs leading-5 text-slate-500">{warning} Drafts are not saved when you leave this view.</p>
      <button type="button" onClick={copy} className="mt-3 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold">Copy draft</button>
    </div> : null}
    {message ? <p role="status" className="mt-3 text-xs text-slate-600">{message}</p> : null}
  </section>;
}
