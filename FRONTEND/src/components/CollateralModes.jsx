"use client";

import { useEffect, useRef, useState } from "react";

const C = {
  paper: "#EFEBE1",
  panel: "#FBFAF6",
  ink: "#1A1A18",
  muted: "#8C877B",
  rule: "#D8D3C6",
  indigo: "#2F4370",
  wine: "#5E1E2E",
  wineInk: "#F0E3D8",
  wineDim: "#D9A8A8",
  wineBright: "#E8B4B4",
  mono: 'var(--font-data), ui-monospace, SFMono-Regular, Menlo, monospace',
  display: '"Archivo", -apple-system, "Helvetica Neue", Arial, sans-serif',
};

const SoloEngraving = () => (
  <svg viewBox="0 0 120 100" aria-hidden="true" style={{ height: "100%", width: "auto", display: "block" }}>
    <g stroke={C.indigo} fill="none" strokeWidth="1.1">
      <path d="M42 78 V44 Q42 34 50 34 Q58 34 58 44 V60" />
      <path d="M58 52 Q58 42 66 42 Q74 42 74 52 V62" />
      <path d="M74 54 Q74 45 81 45 Q88 45 88 54 V64" />
      <path d="M42 60 Q30 52 26 60 Q23 67 34 74" />
      <path d="M42 78 Q42 90 60 90 Q88 90 88 72 V64" />
      <line x1="30" y1="20" x2="90" y2="20" />
      <line x1="34" y1="14" x2="86" y2="14" />
    </g>
    <g stroke={C.indigo} strokeWidth="0.5" opacity="0.45">
      <line x1="46" y1="50" x2="54" y2="50" />
      <line x1="46" y1="56" x2="54" y2="56" />
      <line x1="46" y1="62" x2="54" y2="62" />
      <line x1="62" y1="58" x2="70" y2="58" />
    </g>
  </svg>
);

const RivalryEngraving = () => (
  <svg viewBox="0 0 120 100" aria-hidden="true" style={{ height: "100%", width: "auto", display: "block" }}>
    <g stroke={C.wineInk} fill="none" strokeWidth="1.1">
      <path d="M14 76 V50 Q14 42 22 42 Q30 42 30 50 V76" />
      <path d="M30 54 Q30 46 38 46 Q46 46 46 54 V76" />
      <rect x="10" y="76" width="42" height="9" />
      <path d="M106 76 V50 Q106 42 98 42 Q90 42 90 50 V76" />
      <path d="M90 54 Q90 46 82 46 Q74 46 74 54 V76" />
      <rect x="68" y="76" width="42" height="9" />
      <line x1="10" y1="90" x2="110" y2="90" />
    </g>
    <g stroke={C.wineInk} strokeWidth="0.5" opacity="0.45">
      <line x1="16" y1="56" x2="28" y2="56" />
      <line x1="16" y1="62" x2="28" y2="62" />
      <line x1="92" y1="56" x2="104" y2="56" />
      <line x1="92" y1="62" x2="104" y2="62" />
    </g>
  </svg>
);

function Mode({ variant, meta, form, top, bottom, terms, cta, figure, delay }) {
  const [hover, setHover] = useState(false);
  const rival = variant === "rivalry";

  const accent = rival ? C.wineDim : C.indigo;
  const linkColor = rival ? C.wineBright : C.indigo;
  const hairline = rival ? "rgba(240,227,216,0.22)" : C.rule;

  return (
    <article
      className="cm-panel"
      style={{
        "--d": `${delay}ms`,
        display: "flex",
        flexDirection: "column",
        background: rival ? C.wine : C.panel,
        color: rival ? C.wineInk : C.ink,
        borderRight: rival ? "none" : `1px solid ${C.ink}`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          height: 208,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: rival ? C.wine : "#E7E2D6",
          borderBottom: `1px solid ${hairline}`,
        }}
      >
        <div
          className="cm-figure"
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            transform: hover ? "scale(1.045)" : "scale(1)",
          }}
        >
          {figure}
        </div>
      </div>

      <div style={{ padding: "28px 26px 0" }}>
        <div
          className="cm-rise"
          style={{
            "--d": `${delay + 120}ms`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 10,
            letterSpacing: "0.15em",
            marginBottom: 22,
            color: accent,
          }}
        >
          <span>{meta}</span>
          <span style={{ color: rival ? "rgba(240,227,216,0.5)" : C.muted }}>{form}</span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p className="cm-word" style={{ "--d": `${delay + 220}ms`, margin: 0 }}>{top}</p>
          <p
            className="cm-vs"
            style={{
              "--d": `${delay + 380}ms`,
              margin: "7px 0",
              fontSize: 10,
              letterSpacing: "0.26em",
              color: rival ? "rgba(240,227,216,0.55)" : C.muted,
            }}
          >
            VS
          </p>
          <p
            className="cm-word"
            style={{
              "--d": `${delay + 500}ms`,
              margin: 0,
              color: rival ? C.wineBright : "inherit",
              transform: hover && rival ? "translateX(4px)" : "translateX(0)",
              transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {bottom}
          </p>
        </div>

        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "18px 0 0",
            borderTop: `1px solid ${hairline}`,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {terms.map((t, i) => (
            <li
              key={t}
              className="cm-rise"
              style={{ "--d": `${delay + 620 + i * 90}ms`, padding: "7px 0 7px 22px", position: "relative" }}
            >
              <span style={{ position: "absolute", left: 0, color: accent }}>§</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="cm-rise" style={{ "--d": `${delay + 900}ms`, marginTop: "auto", padding: "26px 26px 30px" }}>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: "inline-block",
            fontSize: 13,
            textDecoration: "none",
            color: linkColor,
            paddingBottom: 4,
            borderBottom: `1px solid ${linkColor}`,
            opacity: hover ? 0.7 : 1,
            transform: hover ? "translateX(4px)" : "translateX(0)",
            transition: "opacity 160ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {cta} →
        </a>
      </div>
    </article>
  );
}

export default function CollateralModes() {
  const ref = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ background: C.paper, fontFamily: C.mono, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .cm-rise, .cm-vs, .cm-word, .cm-panel {
          opacity: 0;
          transition: opacity 620ms cubic-bezier(0.22,1,0.36,1) var(--d, 0ms),
                      transform 620ms cubic-bezier(0.22,1,0.36,1) var(--d, 0ms),
                      clip-path 720ms cubic-bezier(0.22,1,0.36,1) var(--d, 0ms);
        }
        .cm-rise { transform: translateY(12px); }
        .cm-panel { transform: translateY(26px); }
        .cm-vs { transform: scale(0.7); letter-spacing: 0.5em; }
        .cm-word {
          font-family: ${C.display};
          font-weight: 700;
          font-size: clamp(30px, 4.6vw, 42px);
          letter-spacing: -0.03em;
          line-height: 0.96;
          clip-path: inset(0 0 100% 0);
          transform: translateY(6px);
        }

        .cm-live .cm-rise, .cm-live .cm-panel { opacity: 1; transform: translateY(0); }
        .cm-live .cm-vs { opacity: 1; transform: scale(1); letter-spacing: 0.26em; }
        .cm-live .cm-word { opacity: 1; clip-path: inset(0 0 0 0); transform: translateY(0); }

        .cm-figure { transition: transform 520ms cubic-bezier(0.22,1,0.36,1); }

        .cm-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid ${C.ink}; }
        @media (max-width: 720px) {
          .cm-grid { grid-template-columns: 1fr; }
          .cm-grid > article:first-child { border-right: none !important; border-bottom: 1px solid ${C.ink}; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cm-rise, .cm-vs, .cm-word, .cm-panel, .cm-figure { transition: none !important; }
          .cm-rise, .cm-vs, .cm-word, .cm-panel {
            opacity: 1 !important; transform: none !important; clip-path: none !important;
          }
        }
      `}</style>

      <section
        ref={ref}
        className={live ? "cm-live" : ""}
        style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 24px 96px" }}
      >
        <div
          className="cm-rise"
          style={{
            "--d": "0ms",
            border: `1px solid ${C.ink}`,
            borderBottom: "none",
            background: C.panel,
            padding: "40px 24px 34px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: C.muted, margin: "0 0 16px" }}>
            STEP 02 · CHOOSE YOUR COUNTERPARTY
          </p>
          <h2
            style={{
              fontFamily: C.display,
              fontWeight: 600,
              fontSize: "clamp(24px, 3.4vw, 34px)",
              letterSpacing: "-0.015em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Who holds you to it
          </h2>
        </div>

        <div className="cm-grid">
          <Mode
            variant="solo"
            delay={140}
            meta="MODE 01 · SOLO"
            form="FORM S–01"
            top="YOU"
            bottom="YOU"
            cta="Write a solo contract"
            figure={<SoloEngraving />}
            terms={[
              "You set the target. You don't get to move it",
              "One oracle decides. No excuses",
              "Hit it and every dollar comes back",
            ]}
          />
          <Mode
            variant="rivalry"
            delay={260}
            meta="MODE 02 · RIVALRY"
            form="FORM R–01"
            top="YOU"
            bottom="THEM"
            cta="Find a counterparty"
            figure={<RivalryEngraving />}
            terms={[
              "Equal capital, same metric, same clock",
              "One oracle decides. Neither of you gets a vote",
              "The escrow goes to the winner. There is no draw",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
