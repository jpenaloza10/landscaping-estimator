import { useEffect, useRef, useState } from "react";

type Suggestion = { display_name: string };

export default function LocationAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [q, setQ]       = useState(value || "");
  const [list, setList] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef        = useRef<AbortController | null>(null);
  const wrapRef         = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (q.trim().length < 3) { setList([]); setOpen(false); return; }
    (async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", q);
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "5");
        const res  = await fetch(url.toString(), {
          signal: ac.signal,
          headers: { "User-Agent": "landscaping-estimator/1.0 (+support@example.com)" },
        });
        const data = await res.json();
        setList(data || []);
        setOpen(true);
      } catch { /* ignore abort */ }
    })();
  }, [q]);

  function pick(s: Suggestion) {
    onChange(s.display_name);
    setQ(s.display_name);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        className="brand-input"
        placeholder="City, State or ZIP"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => list.length && setOpen(true)}
        autoComplete="off"
      />
      {open && list.length > 0 && (
        <ul className="absolute z-30 top-full left-0 right-0 mt-1 border border-brand-cream/20 shadow-xl overflow-hidden"
            style={{ backgroundColor: "#162D19" }}>
          {list.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => pick(s)}
              className="px-3 py-2.5 font-sans text-[11px] text-brand-cream-dim cursor-pointer border-b border-brand-cream/10 last:border-0 hover:bg-brand-cream/10 hover:text-brand-cream transition-colors leading-snug"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
