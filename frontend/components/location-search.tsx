"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { LocateFixed, Search, LoaderCircle, MapPin, X } from "lucide-react";
import { getLocationSuggestions } from "@/lib/mapbox";
import type { GeocodeResult, LocationSuggestion } from "@/lib/mapbox";

interface LocationSearchProps {
  compact: boolean;
  loading: boolean;
  initialValue?: string;
  onSearch: (query: string, resolvedLocation?: GeocodeResult) => Promise<void>;
  onClear?: () => void;
}

export default function LocationSearch({ compact, loading, initialValue = "", onSearch, onClear }: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const programmaticQuery = useRef<string | null>(null);
  const listboxId = useId();

  useEffect(() => {
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);

    setQuery((current) => {
      if (current === initialValue) return current;
      programmaticQuery.current = initialValue;
      return initialValue;
    });
  }, [initialValue]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const value = query.trim();

    if (programmaticQuery.current) {
      if (programmaticQuery.current === query) {
        programmaticQuery.current = null;
        return;
      }

      programmaticQuery.current = null;
    }

    if (value.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setOpen(true);

      try {
        const results = await getLocationSuggestions(value, controller.signal);
        setSuggestions(results);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        console.error("Location autocomplete failed:", error);
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectSuggestion = async (suggestion: LocationSuggestion) => {
    programmaticQuery.current = suggestion.label;
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    await onSearch(suggestion.label, suggestion);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      await selectSuggestion(suggestions[activeIndex]);
      return;
    }

    const value = query.trim();
    if (!value || loading) return;

    setOpen(false);
    setActiveIndex(-1);
    await onSearch(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current >= suggestions.length - 1 ? 0 : current + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    }
  };

  const clear = () => {
    programmaticQuery.current = "";
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onClear?.();
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Suggested locations"
          className={[
            "absolute z-50 w-full overflow-hidden rounded-2xl border border-slate-900/10 bg-white/96 shadow-2xl shadow-slate-900/10 backdrop-blur-xl",
            compact ? "top-[calc(100%+10px)]" : "bottom-[calc(100%+10px)]",
          ].join(" ")}
        >
          <div className="border-b border-slate-900/5 px-4 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Suggested locations</div>
          </div>

          {suggestionsLoading ? (
            <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Searching locations...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-72 overflow-y-auto p-1.5">
              {suggestions.map((suggestion, index) => {
                const active = index === activeIndex;
                const secondary = suggestion.description === suggestion.name ? suggestion.label : suggestion.description;

                return (
                  <button
                    id={`${listboxId}-${index}`}
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void selectSuggestion(suggestion)}
                    className={[
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                      active ? "bg-slate-100" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                      <MapPin className="h-4 w-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">{suggestion.name}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">{secondary}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">No matching locations found.</div>
          )}
        </div>
      ) : null}

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
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={compact ? "Search another address" : "Where do you live?"}
          aria-label="Search an address"
          aria-autocomplete="list"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-expanded={showDropdown}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        />

        {compact && query && !loading && onClear ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear location"
          >
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
    </div>
  );
}
