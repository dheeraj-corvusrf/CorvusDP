import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// US-wide address suggestions for the property/address fields (PRD 1.1.3.A /
// 1.2.2). Free + keyless via Nominatim (OpenStreetMap); if
// VITE_GOOGLE_MAPS_API_KEY is set it uses Google Places Autocomplete (New)
// instead for better coverage. On select it hands back the formatted address
// plus parsed city / county / state so the wizard can pre-fill those.

export type PlacePick = {
  formatted: string;
  city?: string;
  county?: string;
  state?: string;
  postalCode?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (pick: PlacePick) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  id?: string;
};

type Suggestion = {
  id: string;
  label: string;
  pick: PlacePick;
};

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 4;

const STATE_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function abbrState(s?: string): string | undefined {
  if (!s) return undefined;
  const trimmed = s.trim();
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;
  return STATE_ABBR[trimmed.toLowerCase()] ?? trimmed;
}

type NominatimResult = {
  place_id: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
};

function formatNominatim(r: NominatimResult): Suggestion | null {
  const a = r.address;
  if (!a) return { id: String(r.place_id), label: r.display_name, pick: { formatted: r.display_name } };
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city || a.town || a.village || a.hamlet || a.municipality || "";
  const state = abbrState(a.state);
  const county = a.county?.replace(/ County$/i, "") || undefined;
  const label = [line1 || a.road, [city, state].filter(Boolean).join(", "), a.postcode]
    .filter(Boolean)
    .join(", ");
  if (!label) return null;
  return {
    id: String(r.place_id),
    label,
    pick: { formatted: label, city: city || undefined, county, state, postalCode: a.postcode },
  };
}

async function fetchNominatim(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "us",
    limit: "6",
    q: query,
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimResult[];
  return data.map(formatNominatim).filter((s): s is Suggestion => s !== null);
}

// Google Places Autocomplete (New) — only when a key is configured.
async function fetchGoogle(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY as string,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["us"],
      includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
    }),
  });
  if (!res.ok) throw new Error(`Places ${res.status}`);
  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: { placeId: string; text?: { text: string } };
    }>;
  };
  return (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.text?.text)
    .map((p) => ({
      id: p.placeId,
      label: p.text!.text,
      // Google Autocomplete predictions don't carry structured parts; the
      // wizard can still parse "…, City, ST 00000" from the label, and the
      // manual county field stays available.
      pick: parseFromLabel(p.text!.text),
    }));
}

function parseFromLabel(label: string): PlacePick {
  // "123 Main St, Austin, TX 78701, USA"
  const parts = label.replace(/, USA$/, "").split(",").map((p) => p.trim());
  const pick: PlacePick = { formatted: label.replace(/, USA$/, "") };
  const last = parts[parts.length - 1] ?? "";
  const m = last.match(/^([A-Z]{2})\s*(\d{5})?/);
  if (m) {
    pick.state = m[1];
    pick.postalCode = m[2];
    pick.city = parts[parts.length - 2];
  } else if (parts.length >= 2) {
    pick.city = parts[parts.length - 1];
  }
  return pick;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  ariaLabel,
  id,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);
  const listId = useId();

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        let out: Suggestion[] = [];
        if (GOOGLE_API_KEY) {
          try {
            out = await fetchGoogle(q, ctrl.signal);
          } catch {
            out = await fetchNominatim(q, ctrl.signal);
          }
        } else {
          out = await fetchNominatim(q, ctrl.signal);
        }
        setSuggestions(out);
        setActive(-1);
        setOpen(out.length > 0);
      } catch {
        // aborted or offline — leave the dropdown closed
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(s: Suggestion) {
    skipNextFetch.current = true;
    onChange(s.pick.formatted);
    onSelect(s.pick);
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
        className,
      )}
    >
      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        className="w-full min-w-0 bg-transparent outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="card-elev absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto p-1 text-sm"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2",
                i === active ? "bg-nav-highlight text-nav-highlight-foreground" : "hover:bg-secondary",
              )}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {loading && value.trim().length >= MIN_QUERY_LENGTH && (
        <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-muted-foreground">
          …
        </span>
      )}
    </div>
  );
}
