"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  disabled: boolean;
  onDrop: (point: { x: number; y: number }) => boolean;
  onPick: () => void;
}
type Point = { x: number; y: number };
type State = "idle" | "dragging" | "landed";

function Character({ state }: { state: State }) {
  return <svg viewBox="0 0 80 100" width="64" height="80" aria-hidden="true">
    <ellipse cx="40" cy="94" rx="22" ry="4" fill="#0f172a" opacity=".15" />
    <path d="M32 73L27 89M48 73L53 89" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
    <path d={state === "dragging" ? "M27 51Q8 28 35 8M53 51Q72 28 45 8" : "M27 51L16 66M53 51L64 66"} fill="none" stroke="#fbbf24" strokeWidth="9" strokeLinecap="round" />
    <rect x="25" y="43" width="30" height="34" rx="12" fill={state === "landed" ? "#10b981" : "#3b82f6"} />
    <circle cx="40" cy="31" r="19" fill="#fcd34d" />
    <circle cx="33" cy="29" r="2.5" fill="#0f172a" /><circle cx="47" cy="29" r="2.5" fill="#0f172a" />
    <path d="M33 37Q40 44 47 37" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    {state === "dragging" && <path d="M39 1L39 17L43 13L47 20L50 18L46 11L52 11Z" fill="white" stroke="#0f172a" strokeWidth="1.5" />}
  </svg>;
}

export default function LocationCharacter({ disabled, onDrop, onPick }: Props) {
  const [state, setState] = useState<State>("idle");
  const [point, setPoint] = useState<Point | null>(null);
  const [message, setMessage] = useState("Drag onto the map, or activate to choose a location.");
  const gesture = useRef<{ id: number; start: Point; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const button = useRef<HTMLButtonElement>(null);
  const instructions = useId();

  const cancel = () => {
    const active = gesture.current;
    gesture.current = null;
    if (active && button.current?.hasPointerCapture(active.id)) button.current.releasePointerCapture(active.id);
    setPoint(null);
    setState("idle");
    setMessage("Drag cancelled. Try again or activate to choose a location.");
  };
  useEffect(() => {
    if (disabled) {
      gesture.current = null;
      setPoint(null);
      setState("idle");
      setMessage("Location selection is unavailable.");
    } else setMessage("Drag onto the map, or activate to choose a location.");
  }, [disabled]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gesture.current) { event.preventDefault(); cancel(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  return <div className="flex flex-col items-center gap-1">
    <button ref={button} type="button" disabled={disabled} aria-label="Choose a location" aria-describedby={instructions}
      className="touch-none select-none rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40"
      style={{ cursor: disabled ? "not-allowed" : state === "dragging" ? "grabbing" : "grab" }}
      onPointerDown={event => {
        if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
        suppressClick.current = false;
        gesture.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, dragging: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const active = gesture.current;
        if (!active || active.id !== event.pointerId || disabled) return;
        if (!active.dragging && Math.hypot(event.clientX - active.start.x, event.clientY - active.start.y) < 6) return;
        if (!active.dragging) {
          active.dragging = true;
          suppressClick.current = true;
          setState("dragging");
          setMessage("Dragging. Release over the map. Escape cancels.");
        }
        setPoint({ x: event.clientX, y: event.clientY });
      }}
      onPointerUp={event => {
        const active = gesture.current;
        if (!active || active.id !== event.pointerId) return;
        gesture.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setPoint(null);
        if (!active.dragging || disabled) return;
        const valid = onDrop({ x: event.clientX, y: event.clientY });
        setState(valid ? "landed" : "idle");
        setMessage(valid ? "Landed! Location selected." : "Outside the map. Try again or activate to choose a location.");
      }}
      onPointerCancel={() => { suppressClick.current = true; cancel(); }}
      onLostPointerCapture={() => { if (gesture.current) { suppressClick.current = true; cancel(); } }}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        if (disabled) return;
        setState("idle");
        setMessage("Choose a location on the map using pointer or keyboard controls.");
        onPick();
      }}>
      <span style={{ opacity: state === "dragging" ? 0.25 : 1 }}><Character state={state === "dragging" ? "idle" : state} /></span>
      <span className="block text-xs font-semibold">Choose location</span>
    </button>
    <p id={instructions} className="sr-only">Drag onto the map and release, or press Enter or Space to choose a map location. Escape cancels dragging.</p>
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{message}</span>
    {point && state === "dragging" && typeof document !== "undefined" && createPortal(
      <div aria-hidden="true" style={{ position: "fixed", left: point.x - 32, top: point.y - 1, pointerEvents: "none", zIndex: 1000 }}><Character state="dragging" /></div>, document.body,
    )}
  </div>;
}
