import { useState } from "react";

// ---- Design tokens ----
const T = {
  ink: "#151B2E",
  paper: "#F7F7F4",
  tag: "#FFD23F",
  deal: "#E23D4E",
  save: "#1E8E6E",
  line: "#D9D9D2",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
@keyframes scanpulse { 0%,100%{opacity:.35} 50%{opacity:1} }
@keyframes riseIn { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
input:focus, button:focus-visible { outline: 3px solid ${T.ink}; outline-offset: 2px; }
`;

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function extractJSON(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function findDeals(product) {
  if (!API_KEY) {
    throw new Error(
      "Missing API key. Copy .env.example to .env and set VITE_ANTHROPIC_API_KEY."
    );
  }

  const prompt = `Search the web for the current prices of "${product}" across multiple online retailers (e.g. Amazon, Walmart, Target, Best Buy, the brand's own store, or whichever retailers actually sell it). Also search for any currently active coupon codes, promo codes, or ongoing discounts for this product or the retailers selling it.

Respond with ONLY a JSON object, no markdown fences, no prose before or after, in exactly this shape:
{
  "product": "canonical product name",
  "prices": [
    {"retailer": "Retailer name", "price": 199.99, "currency": "USD", "notes": "e.g. free shipping, refurbished, bundle info or empty string", "url": "product page url if known, else empty string"}
  ],
  "coupons": [
    {"code": "PROMOCODE or empty string if it's an automatic discount", "description": "what the deal is and where it applies", "source": "where you found it", "expires": "expiry if known, else empty string"}
  ],
  "summary": "1-2 sentence plain-language takeaway: where the best price is and roughly how much can be saved"
}

Rules: sort prices from lowest to highest. Only include prices you actually found in search results — never invent numbers. If you find no coupons, return an empty coupons array. Keep each list to at most 6 items.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      // Required to call the API directly from a browser.
      // See https://docs.claude.com/en/api/overview — for anything public,
      // move this call behind your own backend proxy instead.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return extractJSON(text);
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      onClick={copy}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        fontSize: 13,
        background: copied ? T.save : T.ink,
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "8px 14px",
        cursor: "pointer",
        letterSpacing: "0.06em",
        transition: "background .15s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "COPIED ✓" : `COPY ${code}`}
    </button>
  );
}

function PriceTag({ item, currencyFmt }) {
  // Signature element: the lowest price rendered as a literal hang-tag
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 28px", animation: "riseIn .4s ease both" }}>
      <div
        style={{
          position: "relative",
          background: T.tag,
          color: T.ink,
          padding: "26px 34px 26px 56px",
          transform: "rotate(-2deg)",
          clipPath: "polygon(28px 0, 100% 0, 100% 100%, 28px 100%, 0 50%)",
          boxShadow: "6px 8px 0 rgba(21,27,46,0.18)",
          maxWidth: 420,
          width: "100%",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 22,
            top: "50%",
            transform: "translateY(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: T.paper,
            border: `2px solid ${T.ink}`,
          }}
        />
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em" }}>
          LOWEST PRICE FOUND
        </div>
        <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 44, lineHeight: 1.1, margin: "4px 0 2px" }}>
          {currencyFmt(item.price, item.currency)}
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600 }}>
          at {item.retailer}
          {item.notes ? <span style={{ fontWeight: 400, opacity: 0.75 }}> · {item.notes}</span> : null}
        </div>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: T.ink, fontWeight: 600 }}
          >
            Open product page ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const currencyFmt = (n, c) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: c || "USD" }).format(n);
    } catch {
      return `$${n}`;
    }
  };

  const search = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await findDeals(q);
      if (!data.prices || data.prices.length === 0) {
        setError("No prices turned up in search results for that product. Try a more specific name (include brand and model).");
      } else {
        data.prices.sort((a, b) => a.price - b.price);
        setResult(data);
      }
    } catch (e) {
      setError("Something went wrong while searching. Try again, or rephrase the product name. (" + e.message + ")");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") search();
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <header style={{ borderBottom: `3px solid ${T.ink}`, padding: "18px 20px", display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, letterSpacing: "-0.01em" }}>
          PRICE<span style={{ background: T.tag, padding: "0 6px" }}>SCOUT</span>
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, opacity: 0.6 }}>
          live prices + coupons
        </span>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Search */}
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "clamp(26px, 6vw, 40px)", lineHeight: 1.15, margin: "0 0 18px" }}>
          What are you buying?
        </h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. Sony WH-1000XM5 headphones"
            aria-label="Product name"
            style={{
              flex: "1 1 260px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              padding: "14px 16px",
              border: `2px solid ${T.ink}`,
              borderRadius: 8,
              background: "#fff",
              color: T.ink,
            }}
          />
          <button
            onClick={search}
            disabled={loading}
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 15,
              background: loading ? "#9aa0ad" : T.ink,
              color: T.tag,
              border: "none",
              borderRadius: 8,
              padding: "14px 26px",
              cursor: loading ? "default" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {loading ? "SCOUTING…" : "FIND DEALS"}
          </button>
        </div>

        {/* States */}
        {loading && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, marginTop: 28, animation: "scanpulse 1.4s ease infinite" }}>
            Searching retailers and coupon sites — this takes ~15–30 seconds…
          </p>
        )}
        {error && (
          <div style={{ marginTop: 28, border: `2px solid ${T.deal}`, borderRadius: 8, padding: "14px 16px", background: "#fff", fontSize: 15 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <section style={{ marginTop: 36, animation: "riseIn .35s ease both" }}>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 22px" }}>{result.summary}</p>

            <PriceTag item={result.prices[0]} currencyFmt={currencyFmt} />

            {/* Other prices */}
            {result.prices.length > 1 && (
              <>
                <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: "0.14em", fontWeight: 600, borderBottom: `2px solid ${T.ink}`, paddingBottom: 8 }}>
                  OTHER PRICES
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {result.prices.slice(1).map((p, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                        padding: "13px 2px",
                        borderBottom: `1px solid ${T.line}`,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" style={{ color: T.ink }}>
                            {p.retailer} ↗
                          </a>
                        ) : (
                          p.retailer
                        )}
                        {p.notes ? <span style={{ fontWeight: 400, opacity: 0.65, fontSize: 13 }}> · {p.notes}</span> : null}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 16 }}>
                        {currencyFmt(p.price, p.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Coupons */}
            <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: "0.14em", fontWeight: 600, borderBottom: `2px solid ${T.deal}`, paddingBottom: 8, color: T.deal, marginTop: 40 }}>
              COUPONS & DISCOUNTS
            </h2>
            {result.coupons && result.coupons.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {result.coupons.map((c, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 2px",
                      borderBottom: `1px dashed ${T.line}`,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: "1 1 240px" }}>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{c.description}</div>
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 3 }}>
                        {c.source}
                        {c.expires ? ` · expires ${c.expires}` : ""}
                      </div>
                    </div>
                    {c.code ? <CopyButton code={c.code} /> : <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, opacity: 0.6 }}>AUTO-APPLIED</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 14, opacity: 0.7 }}>No active coupon codes turned up for this product right now.</p>
            )}

            <p style={{ fontSize: 12, opacity: 0.55, marginTop: 32, lineHeight: 1.5 }}>
              Prices and codes come from a live web search and can change or be region-specific — verify on the retailer's page before checkout.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
