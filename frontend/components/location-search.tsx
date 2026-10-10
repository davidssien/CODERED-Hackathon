"use client";

import { FormEvent, useEffect, useState } from "react";
import { LocateFixed, Search, LoaderCircle, X } from "lucide-react";

interface LocationSearchProps {
  compact: boolean;
  loading: boolean;
  initialValue?: string;
  onSearch: (query: string) => Promise<void>;
  onClear?: () => void;
}

export default function LocationSearch({ compact, loading, initialValue = "", onSearch, onClear }: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value || loading) return;
    await onSearch(value);
  };

  return (
    <form
      onSubmit={submit}
      className={[
        "group flex items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/94 px-4 shadow-panel backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
        compact ? "h-14" : "h-16",
      ].join(" ")}
    >
      <LocateFixed className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.9} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={compact ? "Search another address" : "Where do you live?"}
        aria-label="Search an address"
      />

      {compact && query && !loading && onClear ? (
        <button type="button" onClick={onClear} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Clear location">
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        aria-label="Search"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </button>
    </form>
  );
}
