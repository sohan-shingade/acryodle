import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useGame, type Game } from "./hooks/useGame";
import { palette, gradeColors } from "./theme";
import { capGrade, sectorGrade, sameCompany, canonical, CAP_WORD, SEC_WORD, SECTOR_LABEL, capLabel } from "./lib/grading";
import type { Company } from "./types";

export default function App() {
  const g = useGame();
  const T = palette(g.settings.dark);
  const GC = gradeColors(g.settings);
  const cellBox = {
    width: "100%", aspectRatio: "1 / 1", display: "flex", flexDirection: "column" as const,
    alignItems: "center", justifyContent: "center", border: `2px solid ${T.empty}`, boxSizing: "border-box" as const,
  };
  const grid = { display: "grid", gridTemplateColumns: `repeat(${g.N}, 1fr)`, gap: 5 };
  const winPct = g.stats.played ? Math.round((g.stats.wins / g.stats.played) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, transition: "background .2s" }}>
      {g.confetti && <Confetti colors={[GC.green, GC.yellow, "#e6b800", "#888"]} />}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 12px 40px" }}>
        <header style={{ borderBottom: `1px solid ${T.border}`, padding: "10px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 2 }}>
            <Icon t={T} label="how to play" onClick={() => g.setModal("help")}>?</Icon>
            <Icon t={T} label="settings" onClick={() => g.setModal("settings")}>⚙</Icon>
          </div>
          <h1 style={{ fontWeight: 800, letterSpacing: "0.06em", fontSize: 24, margin: 0 }}>ACRYODLE</h1>
          <div style={{ display: "flex", gap: 2 }}>
            <Icon t={T} label="stats" onClick={() => g.setModal("stats")}>📊</Icon>
            <Icon t={T} label="theme" onClick={g.toggleDark}>{g.settings.dark ? "☀" : "🌙"}</Icon>
          </div>
        </header>
        <p style={{ textAlign: "center", fontSize: 12, color: T.muted, margin: "8px 0 0" }}>
          {g.isDaily ? `Daily #${g.DAY}` : "Forever ∞"} · guess the hidden {g.N}-company acronym{g.settings.hard ? " · hard" : ""}
        </p>
        {!g.isDaily && (
          <p style={{ textAlign: "center", margin: "4px 0 0" }}>
            <button onClick={g.backToDaily} style={{ background: "none", border: "none", color: GC.green, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>← back to today's puzzle</button>
          </p>
        )}

        {g.toast && (
          <div style={{ position: "fixed", top: 66, left: "50%", transform: "translateX(-50%)", background: g.settings.dark ? "#fff" : T.ink, color: g.settings.dark ? "#000" : "#fff", padding: "10px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, zIndex: 70, maxWidth: "90%", textAlign: "center" }}>
            {g.toast}
          </div>
        )}

        <Board g={g} T={T} GC={GC} cellBox={cellBox} grid={grid} />

        {!g.done && <Picker g={g} T={T} GC={GC} />}

        {g.done && <EndScreen g={g} T={T} GC={GC} />}

        {g.learned.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 11, letterSpacing: "0.12em", color: T.muted, textTransform: "uppercase", margin: "0 0 8px" }}>Locked in</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {g.learned.map((id) => {
                const c = g.BY_NAME[id];
                return (
                  <div key={id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{SECTOR_LABEL[c.sector]} · {capLabel(c.cap)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>{c.fact ?? SECTOR_LABEL[c.sector]}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer style={{ textAlign: "center", fontSize: 10, color: T.muted, marginTop: 28, opacity: 0.7 }}>
          {g.BY_NAME ? Object.keys(g.BY_NAME).length : 0}-company universe · caps approx June 2026 · saved to this browser
        </footer>
      </div>

      <Modals g={g} T={T} GC={GC} winPct={winPct} />
    </div>
  );
}

// ── Board ───────────────────────────────────────────────────────
function Board({ g, T, GC, cellBox, grid }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors>; cellBox: React.CSSProperties; grid: React.CSSProperties }) {
  const lastIdx = g.rows.length - 1;
  return (
    <div className={g.shake ? "tk-shake" : ""} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
      {Array.from({ length: g.MAX }).map((_, ri) => {
        const submitted = ri < g.rows.length;
        const isCurrent = ri === g.rows.length && !g.done;
        if (submitted) {
          const r = g.rows[ri];
          return (
            <div key={ri}>
              <div style={grid}>
                {r.map((pid, i) => (
                  <SubmittedTile key={i} name={pid} truthName={g.puzzle.members[i]} animate={ri === lastIdx}
                    delay={i * 230} g={g} T={T} GC={GC} cellBox={cellBox} />
                ))}
              </div>
              <div style={{ ...grid, marginTop: 3 }}>
                {r.map((pid, i) => <Hint key={i} name={pid} truthName={g.puzzle.members[i]} g={g} T={T} GC={GC} />)}
              </div>
            </div>
          );
        }
        const rowPicks = isCurrent ? g.picks : Array(g.N).fill(null);
        return (
          <div key={ri} style={grid}>
            {rowPicks.map((pid, i) =>
              isCurrent ? (
                <button key={i} onClick={() => g.openSlotAt(i)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                  <InputTile name={pid} active={g.openSlot === i} g={g} T={T} cellBox={cellBox} />
                </button>
              ) : (
                <div key={i} style={cellBox} />
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmittedTile({ name, truthName, animate, delay, g, T, GC, cellBox }: { name: string; truthName: string; animate: boolean; delay: number; g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors>; cellBox: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const c = g.BY_NAME[name];
  const exact = sameCompany(name, truthName);
  const inSet = g.puzzle.members.some((m) => sameCompany(m, name));
  const fill = exact ? GC.green : inSet ? GC.yellow : GC.gray;
  useEffect(() => {
    if (!animate || !ref.current || !ref.current.animate) return;
    ref.current.animate(
      [
        { transform: "scaleY(1)", background: T.bg, borderColor: T.empty, color: T.ink, offset: 0 },
        { transform: "scaleY(0.02)", background: T.bg, borderColor: T.empty, color: T.ink, offset: 0.49 },
        { transform: "scaleY(0.02)", background: fill, borderColor: fill, color: "#fff", offset: 0.5 },
        { transform: "scaleY(1)", background: fill, borderColor: fill, color: "#fff", offset: 1 },
      ],
      { duration: 520, delay, easing: "ease", fill: "backwards" },
    );
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} style={{ ...cellBox, background: fill, borderColor: fill, color: "#fff" }}>
      <span style={{ fontSize: "clamp(15px,5vw,24px)", fontWeight: 700, lineHeight: 1 }}>{c.name[0].toUpperCase()}</span>
      <span style={{ fontSize: "clamp(6px,1.6vw,8px)", marginTop: 2, maxWidth: "94%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
    </div>
  );
}

function Hint({ name, truthName, g, T, GC }: { name: string; truthName: string; g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors> }) {
  if (sameCompany(name, truthName)) return <div style={{ textAlign: "center", fontSize: 9, color: GC.green, fontWeight: 700, paddingTop: 2 }}>✓ correct</div>;
  const guess = g.BY_NAME[name];
  const truth = g.BY_NAME[truthName];
  const cap = capGrade(guess, truth);
  const sec = sectorGrade(guess, truth);
  const cC = cap.grade === "correct" ? GC.green : cap.grade === "close" ? (g.settings.dark ? GC.yellow : "#9a7d12") : T.muted;
  const sC = sec === "correct" ? GC.green : sec === "close" ? (g.settings.dark ? GC.yellow : "#9a7d12") : T.muted;
  return (
    <div style={{ textAlign: "center", paddingTop: 2, lineHeight: 1.25 }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: cC }}>Cap {cap.arrow} {CAP_WORD[cap.grade]}</div>
      <div style={{ fontSize: 9, fontWeight: 600, color: sC }}>{SEC_WORD[sec]}</div>
    </div>
  );
}

function InputTile({ name, active, g, T, cellBox }: { name: string | null; active: boolean; g: Game; T: ReturnType<typeof palette>; cellBox: React.CSSProperties }) {
  const c = name ? g.BY_NAME[name] : null;
  return (
    <div style={{ ...cellBox, borderColor: active || c ? T.muted : T.empty, color: T.ink, background: T.bg }}>
      <span style={{ fontSize: "clamp(15px,5vw,24px)", fontWeight: 700, lineHeight: 1 }}>{c ? c.name[0].toUpperCase() : ""}</span>
      {c && <span style={{ fontSize: "clamp(6px,1.6vw,8px)", marginTop: 2, maxWidth: "94%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>}
    </div>
  );
}

// ── Picker ──────────────────────────────────────────────────────
function Picker({ g, T, GC }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors> }) {
  return (
    <div style={{ marginTop: 16 }}>
      {g.openSlot !== null ? (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8 }}>
          <input
            ref={g.inputRef}
            value={g.q}
            onChange={(e) => g.setQ(e.target.value)}
            placeholder="Type to search · Enter picks top · ⌫ deletes"
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, marginBottom: 8, outline: "none", background: T.bg, color: T.ink }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, maxHeight: 210, overflow: "auto" }}>
            {g.list.map((c: Company, idx: number) => {
              const st = g.known[canonical(c.name)];
              return (
                <button
                  key={c.name}
                  onClick={() => g.choose(c.name)}
                  style={{ textAlign: "left", fontSize: 12.5, padding: "8px 10px", borderRadius: 6, border: `1px solid ${idx === 0 ? T.muted : T.border}`, background: T.bg, color: st === "out" ? T.muted : T.ink, cursor: "pointer", display: "flex", gap: 6, alignItems: "center", textDecoration: st === "out" ? "line-through" : "none" }}
                >
                  <b style={{ color: g.settings.colorblind ? GC.yellow : "#b59a2e", width: 12 }}>{c.name[0].toUpperCase()}</b>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {c.name}{c.pvt && <span style={{ fontSize: 9, color: T.muted }}> ·pvt</span>}
                  </span>
                  {st === "in" && <span style={{ color: GC.green, fontSize: 11 }}>✓</span>}
                  {st === "out" && <span style={{ color: T.muted, fontSize: 11 }}>✗</span>}
                </button>
              );
            })}
            {g.list.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: 6 }}>no match</div>}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center", fontSize: 12, color: T.muted, margin: "6px 0" }}>Tap a tile or just start typing.</p>
      )}
      <button onClick={g.submit} style={{ marginTop: 10, width: "100%", padding: "14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", background: g.filled ? GC.green : T.empty, color: g.filled ? "#fff" : T.ink }}>
        ENTER
      </button>
    </div>
  );
}

// ── End screen ──────────────────────────────────────────────────
function EndScreen({ g, T, GC }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors> }) {
  return (
    <div style={{ marginTop: 16, textAlign: "center" }}>
      <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>{g.won ? `Solved in ${g.rows.length}` : "Out of tries"} — {g.puzzle.name}</p>
      <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 10px" }}>{g.puzzle.members.join(" · ")} · <span style={{ fontStyle: "italic" }}>{g.puzzle.note}</span></p>

      <ShareBar g={g} T={T} GC={GC} />

      {g.isDaily ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, color: T.muted, margin: "0 0 8px" }}>That's today's puzzle. New one tomorrow.</p>
          <button onClick={g.startForever} style={{ padding: "11px 18px", borderRadius: 6, border: "none", background: GC.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Play Forever mode ∞ →</button>
        </div>
      ) : (
        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={g.nextForever} style={{ padding: "10px 18px", borderRadius: 6, border: "none", background: GC.green, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Next puzzle →</button>
          <button onClick={g.backToDaily} style={{ padding: "10px 18px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Back to today</button>
        </div>
      )}

      {g.shareText && (
        <textarea readOnly value={g.shareText} onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          style={{ marginTop: 10, width: "100%", boxSizing: "border-box", height: 90, fontFamily: "monospace", fontSize: 13, padding: 8, borderRadius: 6, border: `1px solid ${T.border}`, background: T.panel, color: T.ink }} />
      )}
    </div>
  );
}

// ── Share to platforms ──────────────────────────────────────────
function openShare(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=640");
}

function ShareBar({ g, T, GC }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors> }) {
  const text = g.buildShare();
  const url = typeof location !== "undefined" ? location.href : "";
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const tu = encodeURIComponent(url ? `${text}\n${url}` : text);

  // X (Twitter) keeps text + url separate so the link unfurls a card.
  const PLATFORMS: { key: string; label: string; bg: string; fg: string; href: string }[] = [
    { key: "x",        label: "𝕏",        bg: "#000000", fg: "#ffffff", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "whatsapp", label: "WhatsApp", bg: "#25D366", fg: "#ffffff", href: `https://wa.me/?text=${tu}` },
    { key: "telegram", label: "Telegram", bg: "#229ED9", fg: "#ffffff", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "facebook", label: "Facebook", bg: "#1877F2", fg: "#ffffff", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "reddit",   label: "Reddit",   bg: "#FF4500", fg: "#ffffff", href: `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent(`ACRYODLE #${g.DAY}`)}` },
    { key: "linkedin", label: "LinkedIn", bg: "#0A66C2", fg: "#ffffff", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];

  const btn = (extra: CSSProperties): CSSProperties => ({
    padding: "10px 12px", borderRadius: 6, border: "none", fontWeight: 700, fontSize: 13,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...extra,
  });

  return (
    <div>
      {/* Primary: X gets a full-width emphasized button */}
      <button onClick={() => openShare(PLATFORMS[0].href)} aria-label="Share on X"
        style={btn({ width: "100%", background: "#000", color: "#fff", fontSize: 14 })}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>𝕏</span> Share on X
      </button>

      {/* Secondary platforms */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
        {PLATFORMS.slice(1).map((p) => (
          <button key={p.key} onClick={() => openShare(p.href)} aria-label={`Share on ${p.label}`}
            style={btn({ background: p.bg, color: p.fg })}>{p.label}</button>
        ))}
      </div>

      {/* Device share sheet + copy */}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={g.nativeShare} aria-label="Open device share sheet"
          style={btn({ flex: 1, background: GC.green, color: "#fff" })}>Share…</button>
        <button onClick={g.share} aria-label="Copy results"
          style={btn({ flex: 1, background: T.bg, color: T.ink, border: `1px solid ${T.border}` })}>Copy</button>
      </div>
    </div>
  );
}

// ── Modals ──────────────────────────────────────────────────────
function Modals({ g, T, GC, winPct }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors>; winPct: number }) {
  if (!g.modal) return null;
  const maxDist = Math.max(1, ...Object.values(g.stats.dist));
  const toggles: [string, boolean, () => void][] = [
    ["Dark theme", g.settings.dark, g.toggleDark],
    ["Colorblind (high contrast)", g.settings.colorblind, g.toggleCb],
    ["Hard mode (reuse revealed hints)", g.settings.hard, g.toggleHard],
  ];
  return (
    <div onClick={() => (g.modal === "intro" ? g.dismissIntro() : g.setModal(null))} style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bg, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 10, maxWidth: 420, width: "100%", padding: 18, position: "relative", maxHeight: "85vh", overflow: "auto" }}>
        <button onClick={() => (g.modal === "intro" ? g.dismissIntro() : g.setModal(null))} style={{ position: "absolute", top: 10, right: 12, border: "none", background: "none", fontSize: 18, cursor: "pointer", color: T.muted }}>✕</button>

        {g.modal === "intro" && (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <h2 style={{ margin: "0 0 4px", letterSpacing: "0.05em" }}>ACRYODLE</h2>
            <p style={{ margin: "0 0 12px", color: T.muted, fontSize: 12.5 }}>A daily Wordle for Big Tech acronyms.</p>

            <p style={{ margin: "0 0 10px" }}>You know <b>FAANG</b> — Facebook, Apple, Amazon, Netflix, Google. It's an acronym that's secretly a <i>lineup of companies</i>.</p>
            <p style={{ margin: "0 0 10px" }}>Each day ACRYODLE hides one such acronym. Your job: <b>name the company in every slot.</b></p>

            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", margin: "0 0 12px" }}>
              <div style={{ fontWeight: 800, letterSpacing: "0.18em", fontSize: 15, marginBottom: 4 }}>F A A N G</div>
              <div style={{ fontSize: 12, color: T.muted }}>↳ Facebook · Apple · Amazon · Netflix · Google</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 6 }}>Each letter is one company. Fill all five to solve it.</div>
            </div>

            <p style={{ margin: "0 0 8px" }}>After each guess, tiles grade Wordle-style:</p>
            <p style={{ margin: "0 0 12px" }}>
              <span style={{ color: GC.green, fontWeight: 700 }}>green</span> right company &amp; slot ·{" "}
              <span style={{ color: g.settings.colorblind ? GC.yellow : "#b59a2e", fontWeight: 700 }}>yellow</span> in the lineup, wrong slot ·{" "}
              <span style={{ color: T.muted, fontWeight: 700 }}>gray</span> not in it.
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: T.muted }}>Tiles also hint <b>market cap</b> (▲ bigger / ▼ smaller) and <b>sector</b> to steer your next guess. Just start typing to begin.</p>

            <button onClick={g.dismissIntro} style={{ width: "100%", padding: "12px", borderRadius: 6, border: "none", background: GC.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Play →</button>
          </div>
        )}

        {g.modal === "help" && (
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <h3 style={{ margin: "0 0 8px" }}>How to play</h3>
            <p style={{ margin: "0 0 8px" }}>A hidden acronym (like MANGOS) is several tech companies. Just start typing — it opens the next empty slot and searches. <b>Enter</b> picks the top result and jumps ahead; <b>⌫</b> deletes the last tile.</p>
            <p style={{ margin: "0 0 8px" }}>
              <span style={{ color: GC.green, fontWeight: 700 }}>green</span> right company &amp; slot ·{" "}
              <span style={{ color: g.settings.colorblind ? GC.yellow : "#b59a2e", fontWeight: 700 }}>yellow</span> in the group, wrong slot ·{" "}
              <span style={{ color: T.muted, fontWeight: 700 }}>gray</span> not in it.
            </p>
            <p style={{ margin: 0 }}>Each tile also shows how your pick compares by <b>market cap</b> (▲ real one bigger / ▼ smaller) and <b>sector</b>. The picker remembers what you've ruled in (✓) and out (✗).</p>
          </div>
        )}

        {g.modal === "settings" && (
          <div style={{ fontSize: 13 }}>
            <h3 style={{ margin: "0 0 12px" }}>Settings</h3>
            {toggles.map(([label, val, fn]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <span>{label}</span>
                <button onClick={fn} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: val ? GC.green : T.empty, position: "relative" }}>
                  <span style={{ position: "absolute", top: 2, left: val ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {g.modal === "stats" && (
          <div style={{ fontSize: 13 }}>
            <h3 style={{ margin: "0 0 12px" }}>Statistics</h3>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 14 }}>
              {([["Played", g.stats.played], ["Win %", winPct], ["Streak", g.stats.cur], ["Max", g.stats.max]] as [string, number][]).map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 10, color: T.muted }}>{l}</div></div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Guess distribution</div>
            {Array.from({ length: g.MAX_TRIES }).map((_, k) => {
              const n = g.stats.dist[k + 1] || 0;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 10, fontSize: 11 }}>{k + 1}</span>
                  <div style={{ background: n ? GC.green : T.empty, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, minWidth: 18, width: `${Math.max(8, (n / maxDist) * 100)}%`, textAlign: "right" }}>{n}</div>
                </div>
              );
            })}
            {!g.stats.played && <p style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>Finish a game to start tracking.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── small bits ──────────────────────────────────────────────────
function Icon({ children, onClick, label, t }: { children: React.ReactNode; onClick: () => void; label: string; t: ReturnType<typeof palette> }) {
  return <button onClick={onClick} aria-label={label} style={{ border: "none", background: "none", fontSize: 17, cursor: "pointer", color: t.muted, lineHeight: 1, padding: 4 }}>{children}</button>;
}

function Confetti({ colors }: { colors: string[] }) {
  const pieces = useMemo(() => Array.from({ length: 28 }).map(() => ({ left: Math.random() * 100, dur: 1.1 + Math.random() * 0.9, delay: Math.random() * 0.3 })), []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }}>
      {pieces.map((p, k) => (
        <span key={k} style={{ position: "absolute", top: 0, left: `${p.left}%`, width: 8, height: 8, background: colors[k % colors.length], borderRadius: 2, animation: `tk-fall ${p.dur}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}
