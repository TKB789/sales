import { useState } from "react";

// ---- Design tokens ----
const T = {
  ink: "#151B2E",
  paper: "#F7F7F4",
  tag: "#FFD23F",
  deal: "#E23D4E",
  line: "#D9D9D2",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
@keyframes riseIn { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
input:focus, a:focus-visible { outline: 3px solid ${T.ink}; outline-offset: 2px; }
`;

// Each entry builds a search URL for the product the user typed.
const LINK_GROUPS = (q) => {
  const e = encodeURIComponent(q);
  return [
    {
      heading: "COMPARE PRICES",
      color: T.ink,
      links: [
        { name: "Google Shopping", desc: "Prices from most retailers in one list — best first stop", url: `https://www.google.com/search?tbm=shop&q=${e}` },
        { name: "Amazon", desc: "Check the listing and third-party sellers", url: `https://www.amazon.com/s?k=${e}` },
        { name: "Walmart", desc: "Often undercuts Amazon on everyday items", url: `https://www.walmart.com/search?q=${e}` },
        { name: "eBay", desc: "New, open-box, and refurbished — sort by price + shipping", url: `https://www.ebay.com/sch/i.html?_nkw=${e}` },
      ],
    },
    {
      heading: "PRICE HISTORY",
      color: T.ink,
      links: [
        { name: "CamelCamelCamel", desc: "Amazon price history — see if today's price is actually a deal", url: `https://camelcamelcamel.com/search?sq=${e}` },
      ],
    },
    {
      heading: "COUPONS & DEALS",
      color: T.deal,
      links: [
        { name: "Slickdeals", desc: "Community-posted deals and codes, usually the freshest", url: `https://slickdeals.net/newsearch.php?q=${e}` },
        { name: "RetailMeNot", desc: "Promo codes by store", url: `https://www.retailmenot.com/s/${e}` },
        { name: "Google coupon search", desc: "Catches codes the coupon sites miss", url: `https://www.google.com/search?q=${e}+coupon+promo+code` },
      ],
    },
  ];
};

export default function App() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");

  const go = () => {
    const q = query.trim();
    if (q) setActive(q);
  };

  const onKey = (e) => {
    if (e.key === "Enter") go();
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      <header style={{ borderBottom: `3px solid ${T.ink}`, padding: "18px 20px", display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22 }}>
          PRICE<span style={{ background: T.tag, padding: "0 6px" }}>SCOUT</span>
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, opacity: 0.6 }}>
          price + coupon launcher
        </span>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: "clamp(26px, 6vw, 40px)", lineHeight: 1.15, margin: "0 0 18px" }}>
          What are you buying?
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. Shokz OpenRun Pro"
            aria-label="Product name"
            style={{
              flex: "1 1 260px",
              fontSize: 16,
              padding: "14px 16px",
              border: `2px solid ${T.ink}`,
              borderRadius: 8,
              background: "#fff",
              color: T.ink,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <button
            onClick={go}
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 15,
              background: T.ink,
              color: T.tag,
              border: "none",
              borderRadius: 8,
              padding: "14px 26px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            FIND DEALS
          </button>
        </div>

        {!active && (
          <p style={{ fontSize: 14, opacity: 0.65, marginTop: 22, lineHeight: 1.55 }}>
            Type a product and you'll get one-tap searches on the best free price-comparison,
            price-history, and coupon sites — no account, no waiting.
          </p>
        )}

        {active && (
          <section style={{ marginTop: 34, animation: "riseIn .35s ease both" }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, marginBottom: 6 }}>
              RESULTS FOR: <strong>{active}</strong>
            </p>

            {LINK_GROUPS(active).map((group) => (
              <div key={group.heading} style={{ marginTop: 28 }}>
                <h2
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    fontWeight: 600,
                    borderBottom: `2px solid ${group.color}`,
                    color: group.color,
                    paddingBottom: 8,
                    margin: 0,
                  }}
                >
                  {group.heading}
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {group.links.map((l) => (
                    <li key={l.name} style={{ borderBottom: `1px solid ${T.line}` }}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: "15px 2px",
                          color: T.ink,
                          textDecoration: "none",
                        }}
                      >
                        <span>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{l.name}</span>
                          <span style={{ display: "block", fontSize: 13, opacity: 0.6, marginTop: 2 }}>{l.desc}</span>
                        </span>
                        <span
                          style={{
                            fontFamily: "'Archivo Black', sans-serif",
                            background: group.color === T.deal ? T.deal : T.tag,
                            color: group.color === T.deal ? "#fff" : T.ink,
                            borderRadius: 6,
                            padding: "8px 14px",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          OPEN ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p style={{ fontSize: 12, opacity: 0.55, marginTop: 32, lineHeight: 1.5 }}>
              Tip: check CamelCamelCamel before buying on Amazon — a "deal" isn't a deal if the price
              was lower last month.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
