import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useGame, type Game } from "./hooks/useGame";
import { palette, gradeColors } from "./theme";
import { capGrade, sectorGrade, sameCompany, canonical, SECTOR_LABEL, capLabel } from "./lib/grading";
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
          <h1 style={{ fontWeight: 800, letterSpacing: "0.06em", fontSize: 24, margin: 0 }}>ACRODLE</h1>
          <div style={{ display: "flex", gap: 2 }}>
            <Icon t={T} label="stats" onClick={() => g.setModal("stats")}>📊</Icon>
            <Icon t={T} label="theme" onClick={g.toggleDark}>{g.settings.dark ? "☀" : "🌙"}</Icon>
          </div>
        </header>
        <p style={{ textAlign: "center", fontSize: 12, color: T.muted, margin: "8px 0 0" }}>
          {g.isDaily ? `Daily #${g.DAY}` : "Forever ∞"}{g.settings.hard ? " · hard mode" : ""}
        </p>
        {!g.isDaily && (
          <p style={{ textAlign: "center", margin: "4px 0 0" }}>
            <button onClick={g.backToDaily} style={{ background: "none", border: "none", color: GC.green, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>← back to today's puzzle</button>
          </p>
        )}

        {/* Goal line — the acronym itself is hidden; you deduce it. */}
        <p style={{ textAlign: "center", fontSize: 12.5, color: T.muted, margin: "12px 0 0", lineHeight: 1.5 }}>
          Guess the <b style={{ color: T.ink }}>{g.N} companies</b> whose initials spell a hidden tech acronym.
          <br />Each guess is graded — use the hints to crack it.
        </p>

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

// Left-gutter width: holds the per-row "Mkt cap / Sector" labels and keeps
// every row's tiles aligned to the same left edge.
const GUTTER = 34;
const HINT_LINE = "13px"; // fixed line height shared by hints + gutter labels

// One board row: a fixed-width label gutter on the left, the N-column grid, and
// a matching empty spacer on the right so the grid stays centered in the column.
function Shell({ gutter, grid, children }: { gutter: React.ReactNode; grid: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
      <div style={{ width: GUTTER, flexShrink: 0 }}>{gutter}</div>
      <div style={{ flex: 1, minWidth: 0, ...grid }}>{children}</div>
      <div style={{ width: GUTTER, flexShrink: 0 }} aria-hidden />
    </div>
  );
}

// ── Board ───────────────────────────────────────────────────────
function Board({ g, T, GC, cellBox, grid }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors>; cellBox: React.CSSProperties; grid: React.CSSProperties }) {
  const lastIdx = g.rows.length - 1;
  const labelStyle: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, color: T.muted, textAlign: "right", lineHeight: HINT_LINE, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" };
  return (
    <div className={g.shake ? "tk-shake" : ""} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
      {Array.from({ length: g.MAX }).map((_, ri) => {
        const submitted = ri < g.rows.length;
        const isCurrent = ri === g.rows.length && !g.done;
        if (submitted) {
          const r = g.rows[ri];
          return (
            <div key={ri}>
              <Shell gutter={null} grid={grid}>
                {r.map((pid, i) => (
                  <SubmittedTile key={i} name={pid} truthName={g.puzzle.members[i]} animate={ri === lastIdx}
                    delay={i * 230} g={g} T={T} GC={GC} cellBox={cellBox} />
                ))}
              </Shell>
              <div style={{ marginTop: 3 }}>
                <Shell
                  grid={grid}
                  gutter={(
                    <div style={{ paddingTop: 2 }}>
                      <div style={labelStyle}>Mkt&nbsp;cap</div>
                      <div style={labelStyle}>Sector</div>
                    </div>
                  )}
                >
                  {r.map((pid, i) => <Hint key={i} name={pid} truthName={g.puzzle.members[i]} g={g} T={T} GC={GC} />)}
                </Shell>
              </div>
            </div>
          );
        }
        const rowPicks = isCurrent ? g.picks : Array(g.N).fill(null);
        return (
          <Shell key={ri} gutter={null} grid={grid}>
            {rowPicks.map((pid, i) =>
              isCurrent ? (
                <button key={i} onClick={() => g.openSlotAt(i)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                  <InputTile name={pid} active={g.openSlot === i} slot={i} g={g} T={T} cellBox={cellBox} />
                </button>
              ) : (
                <div key={i} style={cellBox} />
              ),
            )}
          </Shell>
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
  const guess = g.BY_NAME[name];
  const truth = g.BY_NAME[truthName];
  const correct = sameCompany(name, truthName);
  const cap = capGrade(guess, truth);
  const sec = sectorGrade(guess, truth);
  const tone = (grade: string) => (grade === "correct" ? GC.green : grade === "close" ? (g.settings.dark ? GC.yellow : "#9a7d12") : T.muted);
  // One line per stat: the company's actual value + how it compares. Fixed line
  // height + nowrap keeps each stat on a single row that lines up with the
  // "Mkt cap / Sector" gutter labels; minWidth:0 keeps the column at 1fr.
  const line: React.CSSProperties = { fontSize: 8, fontWeight: 600, lineHeight: HINT_LINE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  // Short grade words so the value isn't pushed out of the narrow column.
  const capWord = correct ? "✓" : cap.grade === "correct" ? "≈size" : cap.grade === "close" ? "close" : "far";
  const secWord = correct ? "✓" : sec === "correct" ? "same" : sec === "close" ? "rel" : "diff";
  return (
    <div style={{ textAlign: "center", paddingTop: 2, minWidth: 0 }}>
      <div style={{ ...line, color: correct ? GC.green : tone(cap.grade) }}>
        {capLabel(guess.cap)} {cap.arrow}{correct ? "" : " "}{capWord}
      </div>
      <div style={{ ...line, color: correct ? GC.green : tone(sec) }}>
        {SECTOR_LABEL[guess.sector]} · {secWord}
      </div>
    </div>
  );
}

function InputTile({ name, active, slot, g, T, cellBox }: { name: string | null; active: boolean; slot: number; g: Game; T: ReturnType<typeof palette>; cellBox: React.CSSProperties }) {
  const c = name ? g.BY_NAME[name] : null;
  return (
    <div style={{ ...cellBox, borderColor: active ? T.ink : c ? T.muted : T.empty, color: T.ink, background: T.bg }}>
      {c ? (
        <>
          <span style={{ fontSize: "clamp(15px,5vw,24px)", fontWeight: 700, lineHeight: 1 }}>{c.name[0].toUpperCase()}</span>
          <span style={{ fontSize: "clamp(6px,1.6vw,8px)", marginTop: 2, maxWidth: "94%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
        </>
      ) : (
        // Empty slot shows its number (not the answer letter — that stays hidden).
        <span style={{ fontSize: "clamp(11px,3vw,15px)", fontWeight: 700, lineHeight: 1, color: T.muted, opacity: 0.4 }}>{slot + 1}</span>
      )}
    </div>
  );
}

// ── Picker ──────────────────────────────────────────────────────
function Picker({ g, T, GC }: { g: Game; T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors> }) {
  return (
    <div style={{ marginTop: 16 }}>
      {g.openSlot !== null ? (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: T.muted, textAlign: "center" }}>
            Filling slot {g.openSlot + 1} of {g.N} — search any tech company
          </p>
          <input
            ref={g.inputRef}
            value={g.q}
            onChange={(e) => g.setQ(e.target.value)}
            placeholder="Search companies… (Enter picks top)"
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
                  <b style={{ color: g.settings.colorblind ? GC.yellow : "#b59a2e", width: 12, flexShrink: 0 }}>{c.name[0].toUpperCase()}</b>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {c.name}{c.pvt && <span style={{ fontSize: 9, color: T.muted }}> ·pvt</span>}
                  </span>
                  {/* Show each candidate's cap + sector so guesses are informed. */}
                  <span style={{ fontSize: 10.5, color: T.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {capLabel(c.cap)} · {SECTOR_LABEL[c.sector]}
                  </span>
                  {st === "in" && <span style={{ color: GC.green, fontSize: 11, flexShrink: 0 }}>✓</span>}
                  {st === "out" && <span style={{ color: T.muted, fontSize: 11, flexShrink: 0 }}>✗</span>}
                </button>
              );
            })}
            {g.list.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: 6 }}>no match</div>}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center", fontSize: 12, color: T.muted, margin: "6px 0" }}>Tap a slot above, or just start typing.</p>
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
    // Fold the URL into the text (with its own newline) instead of the separate
    // `url` param — X joins that param onto the last line with a space.
    { key: "x",        label: "𝕏",        bg: "#000000", fg: "#ffffff", href: `https://twitter.com/intent/tweet?text=${tu}` },
    { key: "whatsapp", label: "WhatsApp", bg: "#25D366", fg: "#ffffff", href: `https://wa.me/?text=${tu}` },
    { key: "telegram", label: "Telegram", bg: "#229ED9", fg: "#ffffff", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "facebook", label: "Facebook", bg: "#1877F2", fg: "#ffffff", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "reddit",   label: "Reddit",   bg: "#FF4500", fg: "#ffffff", href: `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent(`ACRODLE #${g.DAY}`)}` },
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

// Annotated breakdown of a graded tile — shared by the intro + how-to-play.
function UiBreakdown({ T, GC, cb }: { T: ReturnType<typeof palette>; GC: ReturnType<typeof gradeColors>; cb: boolean }) {
  const yellow = cb ? GC.yellow : "#b59a2e";
  const lbl: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.02em", width: 38, textAlign: "right", flexShrink: 0 };
  const val: React.CSSProperties = { fontSize: 9, fontWeight: 600 };
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", margin: "0 0 12px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Reading a tile</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, background: yellow, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>A</span>
            <span style={{ fontSize: 7.5, marginTop: 2 }}>Amazon</span>
          </div>
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}><span style={lbl}>Mkt&nbsp;cap</span><span style={{ ...val, color: T.muted }}>$2.8T ▼ far</span></div>
            <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}><span style={lbl}>Sector</span><span style={{ ...val, color: yellow }}>E-comm · rel</span></div>
          </div>
        </div>
        <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
          <li><b style={{ color: GC.green }}>green</b> exact · <b style={{ color: yellow }}>yellow</b> in lineup, wrong slot · <b>gray</b> not in it.</li>
          <li><b>Mkt cap</b>: ▲ answer bigger · ▼ smaller. How near: <b>≈size</b> → <b>close</b> → <b>far</b>.</li>
          <li><b>Sector</b>: <b>same</b> → <b>rel</b>ated → <b>diff</b>erent.</li>
        </ul>
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
            <h2 style={{ margin: "0 0 4px", letterSpacing: "0.05em" }}>ACRODLE</h2>
            <p style={{ margin: "0 0 12px", color: T.muted, fontSize: 12.5 }}>A daily Wordle for Big Tech acronyms.</p>

            <p style={{ margin: "0 0 10px" }}>Think of <b>FAANG</b> — a famous acronym that's secretly a lineup of companies: Facebook · Apple · Amazon · Netflix · Google.</p>
            <p style={{ margin: "0 0 10px" }}>Each day, one such acronym is <b>hidden</b>. You don't see the letters — you have <b>{g.N} empty slots</b>. Guess a tech company for each; their first initials spell the acronym.</p>

            <UiBreakdown T={T} GC={GC} cb={g.settings.colorblind} />

            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: T.muted }}>Tip: while searching, every candidate shows its cap and sector — use them to reason about who fits. Solve it in {g.MAX} guesses.</p>

            <button onClick={g.dismissIntro} style={{ width: "100%", padding: "12px", borderRadius: 6, border: "none", background: GC.green, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Play →</button>
          </div>
        )}

        {g.modal === "help" && (
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <h3 style={{ margin: "0 0 8px" }}>How to play</h3>
            <p style={{ margin: "0 0 10px" }}>An acronym is hidden — you have {g.N} empty slots. Guess a tech company for each; their initials spell it. Start typing to open the next slot and search; <b>Enter</b> picks the top result and jumps ahead, <b>⌫</b> deletes the last tile.</p>

            <UiBreakdown T={T} GC={GC} cb={g.settings.colorblind} />

            <p style={{ margin: 0, fontSize: 12.5, color: T.muted }}>The picker remembers what you've ruled in (✓) and out (✗), and shows each candidate's cap and sector so every guess is informed.</p>
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
