"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Preferences } from "@/lib/preferences";
import type { PermitType } from "@/lib/types";

interface Props {
  preferences: Preferences;
  onChange: (preferences: Preferences) => void;
  onClose: () => void;
}

export default function SettingsModal({ preferences, onChange, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const title = useId();
  const description = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
    ) ?? []).filter(el => el.getClientRects().length > 0);
    (focusable()[0] ?? panel.current)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key === "Tab") {
        const controls = focusable();
        const index = controls.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        const next = event.shiftKey
          ? (index <= 0 ? controls.length - 1 : index - 1)
          : (index + 1) % controls.length;
        (controls[next] ?? panel.current)?.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (!panel.current?.contains(event.target as Node)) (focusable()[0] ?? panel.current)?.focus();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", containFocus);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;
  const dark = preferences.theme === "dark";
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={title} aria-describedby={description} tabIndex={-1}
        className={`max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-6 shadow-2xl ${dark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`}>
        <div className="flex items-center justify-between">
          <h2 id={title} className="text-xl font-bold">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close settings" className="rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"><X size={20} /></button>
        </div>
        <p id={description} className="mt-2 text-sm opacity-70">Customize your map. Changes apply immediately.</p>
        <div className="mt-6 space-y-6">
          <fieldset><legend className="mb-2 font-semibold">Theme</legend>
            <div className="flex gap-4">{(["light", "dark"] as const).map(theme => (
              <label key={theme} className="flex cursor-pointer items-center gap-2 capitalize"><input type="radio" name={`${title}-theme`} checked={preferences.theme === theme} onChange={() => onChange({ ...preferences, theme })} className="accent-blue-600" />{theme}</label>
            ))}</div>
          </fieldset>
          <fieldset><legend className="mb-2 font-semibold">Map display</legend>
            <div className="flex gap-4">{(["map", "satellite"] as const).map(display => (
              <label key={display} className="flex cursor-pointer items-center gap-2 capitalize"><input type="radio" name={`${title}-display`} checked={preferences.display === display} onChange={() => onChange({ ...preferences, display })} className="accent-blue-600" />{display === "map" ? "Street map" : "Satellite"}</label>
            ))}</div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={preferences.districts} onChange={event => onChange({ ...preferences, districts: event.target.checked })} className="accent-blue-600" />Show district boundaries</label>
          <fieldset><legend className="mb-2 font-semibold">Permit types</legend>
            <p className="mb-3 text-sm opacity-70">Select any types, or none to hide all permits.</p>
            <div className="space-y-3">{(["new", "expansion", "renewal"] as PermitType[]).map(type => (
              <label key={type} className="flex cursor-pointer items-center gap-2 capitalize"><input type="checkbox" checked={preferences.permitTypes.includes(type)} onChange={event => onChange({ ...preferences, permitTypes: event.target.checked ? [...preferences.permitTypes.filter(item => item !== type), type] : preferences.permitTypes.filter(item => item !== type) })} className="accent-blue-600" />{type}</label>
            ))}</div>
          </fieldset>
        </div>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">Done</button>
      </div>
    </div>, document.body,
  );
}
