import { useEffect, useRef, useState } from "react";

type Suggestion = {
  display_name: string;
};

export default function LocationAutocomplete({
  value, onChange
}: { value: string; onChange: (v: string) => void; }) {
  const [q, setQ] = useState(value || "");
  const [list, setList] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (q.trim().length < 3) { setList([]); return; }
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
        const res = await fetch(url.toString(), {
          signal: ac.signal,
          headers: { "User-Agent": "landscaping-estimator/1.0 (+support@example.com)" }
        });
        const data = await res.json();
        setList(data || []);
        setOpen(true);
      } catch { /* ignore */ }
    })();
  }, [q]);

  function pick(s: any) {
    onChange(s.display_name);
    setQ(s.display_name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        placeholder="City, State or ZIP"
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => list.length && setOpen(true)}
      />
      {open && list.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
          {list.map((s:any, i:number) => (
            <li key={i}
                className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                onMouseDown={() => pick(s)}>
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
