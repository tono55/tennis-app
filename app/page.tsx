"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { generateMatches, calcMatchCount, Match } from "@/lib/scheduler";

type Phase = "setup" | "playing";
type Direction = "next" | "prev";


export default function Home() {
  const [n, setN] = useState(4);
  const [phase, setPhase] = useState<Phase>("setup");
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");
  const [animKey, setAnimKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [transMatchNum, setTransMatchNum] = useState(1);

  const go = useCallback((dir: Direction, currentIdx: number, matches: Match[]) => {
    const nextIdx = dir === "next" ? Math.min(currentIdx + 1, matches.length - 1) : Math.max(currentIdx - 1, 0);
    if (nextIdx === currentIdx) return;

    setTransMatchNum(nextIdx + 1);
    setTransitioning(true);

    // 演出の中盤でカード切り替え
    setTimeout(() => {
      setDirection(dir);
      setAnimKey((k) => k + 1);
      setCurrentIndex(nextIdx);
    }, 1200);

    // 演出終了
    setTimeout(() => setTransitioning(false), 3200);
  }, []);

  const start = useCallback((playerCount: number) => {
    const generated = generateMatches(playerCount);
    setMatches(generated);
    setCurrentIndex(0);
    setDirection("next");
    setAnimKey((k) => k + 1);
    setTransMatchNum(1);
    setPhase("playing");
    // 第一試合の演出
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 3200);
  }, []);

  const handleRestart = useCallback(() => {
    setMatches(generateMatches(n));
    setCurrentIndex(0);
    setDirection("next");
    setAnimKey((k) => k + 1);
  }, [n]);

  const handleHome = useCallback(() => {
    setPhase("setup");
    setMatches([]);
    setCurrentIndex(0);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CourtBackground />

      {phase === "playing" && (
        <button
          onClick={handleHome}
          className="fixed top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-green-800 font-semibold px-3 py-2 rounded-xl shadow-md hover:bg-white transition-colors text-sm"
        >
          ← ホーム
        </button>
      )}

      {/* 試合切り替え演出 */}
      {transitioning && matches.length > 0 && matches[transMatchNum - 1] && (
        <TransitionOverlay
          matchNum={transMatchNum}
          match={matches[transMatchNum - 1]}
        />
      )}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {phase === "setup" ? (
          <SetupScreen n={n} setN={setN} onStart={start} />
        ) : (
          <PlayingScreen
            matches={matches}
            currentIndex={currentIndex}
            direction={direction}
            animKey={animKey}
            n={n}
            onNext={() => go("next", currentIndex, matches)}
            onPrev={() => go("prev", currentIndex, matches)}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </main>
    </div>
  );
}

/* ─── 試合切り替え演出オーバーレイ ─── */
function TransitionOverlay({ matchNum, match }: {
  matchNum: number;
  match: Match;
}) {
  const [a, b] = match.teamA.players;
  const [c, d] = match.teamB.players;

  const speedLines = [
    { width: "80%", top: "12%", delay: "0s",    h: 3 },
    { width: "95%", top: "26%", delay: "0.03s", h: 5 },
    { width: "65%", top: "48%", delay: "0.06s", h: 4 },
    { width: "88%", top: "64%", delay: "0.02s", h: 3 },
    { width: "72%", top: "80%", delay: "0.05s", h: 6 },
    { width: "55%", top: "90%", delay: "0.04s", h: 2 },
  ];

  return (
    <div className="animate-overlay-wrapper fixed inset-0 z-50 pointer-events-none overflow-hidden">

      {/* ベース */}
      <div className="animate-flash-overlay absolute inset-0"
        style={{ background: "linear-gradient(160deg, rgba(5,46,22,0.97) 0%, rgba(6,78,59,0.95) 40%, rgba(15,23,42,0.97) 100%)" }}
      />

      {/* コートライン */}
      <div className="animate-court-flash absolute inset-0 flex items-center justify-center">
        <div className="relative border-[3px] border-white/30" style={{ width: "88vw", height: "82vh" }}>
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30 -translate-y-px" />
        </div>
      </div>

      {/* スピードライン */}
      {speedLines.map((l, i) => (
        <div key={i} className="animate-speed-line absolute left-0"
          style={{
            top: l.top, width: l.width, height: l.h,
            animationDelay: l.delay,
            background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.6), rgba(255,255,255,0.9), rgba(255,255,255,0.1))",
            borderRadius: 99,
          }}
        />
      ))}

      {/* テニスボール */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-ball-fly absolute text-4xl"
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.9 + i * 0.1}s`,
            left: `${8 + i * 30}%`,
            top: `${20 + i * 20}%`,
            filter: "drop-shadow(0 0 14px rgba(250,204,21,1))",
          }}
        >🎾</div>
      ))}

      {/* 衝撃波 */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-shockwave absolute rounded-full"
          style={{
            left: "50%", top: "50%",
            width: 100 + i * 40, height: 100 + i * 40,
            marginLeft: -(50 + i * 20), marginTop: -(50 + i * 20),
            border: `${3 - i}px solid rgba(${i === 1 ? "250,204,21" : "255,255,255"},${0.7 - i * 0.15})`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      {/* ── 第N試合スタンプ（上部） ── */}
      <div className="animate-match-stamp absolute font-black text-center"
        style={{
          left: "50%", top: "10%",
          fontSize: "clamp(0.75rem, 3.5vw, 1.1rem)",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.3em",
          whiteSpace: "nowrap",
          animationDelay: "0.1s",
        }}
      >第 {matchNum} 試合</div>

      {/* ── メイン：チームA ── */}
      <div className="absolute" style={{ left: "50%", top: "25%" }}>

        {/* TEAM A ラベル */}
        <div className="animate-team-label absolute font-black text-center"
          style={{
            left: "50%", transform: "translateX(-50%)",
            top: -28,
            fontSize: "clamp(0.65rem, 3vw, 0.9rem)",
            letterSpacing: "0.3em",
            color: "rgba(147,197,253,0.9)",
            animationDelay: "0.25s",
            whiteSpace: "nowrap",
          }}
        >TEAM A</div>

        {/* 2人の番号 */}
        <div className="flex gap-4" style={{ transform: "translateX(-50%)" }}>
          {[a, b].map((p, i) => (
            <div key={p}
              className="animate-player-num-l flex items-center justify-center rounded-3xl font-black text-white"
              style={{
                animationDelay: `${0.2 + i * 0.1}s`,
                width: "clamp(72px, 18vw, 100px)",
                height: "clamp(72px, 18vw, 100px)",
                fontSize: "clamp(2.2rem, 10vw, 3.5rem)",
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                boxShadow: "0 0 40px rgba(59,130,246,0.7), 0 0 80px rgba(59,130,246,0.3)",
                border: "2px solid rgba(147,197,253,0.6)",
              }}
            >{p}</div>
          ))}
        </div>
      </div>

      {/* ── VS ── */}
      <div className="animate-center-vs absolute font-black"
        style={{
          left: "50%", top: "50%",
          fontSize: "clamp(2rem, 10vw, 3.5rem)",
          letterSpacing: "0.05em",
          background: "linear-gradient(135deg, #4ade80, #facc15, #f87171)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 20px rgba(250,204,21,0.8))",
          animationDelay: "0.45s",
          whiteSpace: "nowrap",
        }}
      >VS</div>

      {/* ── メイン：チームB ── */}
      <div className="absolute" style={{ left: "50%", top: "60%" }}>

        {/* TEAM B ラベル */}
        <div className="animate-team-label absolute font-black text-center"
          style={{
            left: "50%", transform: "translateX(-50%)",
            top: -28,
            fontSize: "clamp(0.65rem, 3vw, 0.9rem)",
            letterSpacing: "0.3em",
            color: "rgba(252,165,165,0.9)",
            animationDelay: "0.35s",
            whiteSpace: "nowrap",
          }}
        >TEAM B</div>

        {/* 2人の番号 */}
        <div className="flex gap-4" style={{ transform: "translateX(-50%)" }}>
          {[c, d].map((p, i) => (
            <div key={p}
              className="animate-player-num-r flex items-center justify-center rounded-3xl font-black text-white"
              style={{
                animationDelay: `${0.3 + i * 0.1}s`,
                width: "clamp(72px, 18vw, 100px)",
                height: "clamp(72px, 18vw, 100px)",
                fontSize: "clamp(2.2rem, 10vw, 3.5rem)",
                background: "linear-gradient(135deg, #b91c1c, #ef4444)",
                boxShadow: "0 0 40px rgba(239,68,68,0.7), 0 0 80px rgba(239,68,68,0.3)",
                border: "2px solid rgba(252,165,165,0.6)",
              }}
            >{p}</div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ─── 時計 ─── */
function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  return (
    <span className="font-black text-white drop-shadow tabular-nums" style={{ fontSize: "1.1rem", letterSpacing: "0.05em" }}>
      {hh}<span className="text-white/40">:</span>{mm}<span className="text-white/40">:</span>{ss}
    </span>
  );
}

/* ─── テニスコート背景 ─── */
function CourtBackground() {
  return (
    <div className="fixed inset-0 z-0" style={{ backgroundColor: "#1a5c28" }}>
      {/* コートライン */}
      <div className="absolute inset-0 flex items-center justify-center animate-court-pulse">
        <div
          className="relative border-[3px] border-white/70"
          style={{ width: "min(92vw, 500px)", height: "min(85vh, 680px)" }}
        >
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/70 -translate-y-px" />
          <div className="absolute left-0 right-0 h-[2px] bg-white/70" style={{ top: "25%" }} />
          <div className="absolute left-0 right-0 h-[2px] bg-white/70" style={{ top: "75%" }} />
          <div className="absolute w-[2px] bg-white/70" style={{ left: "50%", top: "25%", height: "50%" }} />
          {/* ネット */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
            <div className="h-[3px] bg-white/50 shadow-[0_0_12px_3px_rgba(255,255,255,0.5)]" />
          </div>
        </div>
      </div>
      {/* グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
    </div>
  );
}

/* ─── セットアップ画面 ─── */
function SetupScreen({
  n, setN, onStart,
}: {
  n: number;
  setN: (v: number) => void;
  onStart: (n: number) => void;
}) {
  const [prevN, setPrevN] = useState(n);
  const [flipKey, setFlipKey] = useState(0);

  const handleSelect = (num: number) => {
    setPrevN(n);
    setN(num);
    setFlipKey((k) => k + 1);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-0">

      {/* ─ タイトルブロック ─ */}
      <div className="animate-title-reveal w-full text-center mb-6" style={{ animationDelay: "0s" }}>
        {/* ボールとラケットアイコン */}
        <div className="flex justify-center items-end gap-3 mb-4">
          <span className="text-4xl animate-racket-swing inline-block" style={{ transformOrigin: "bottom center" }}>🎾</span>
          <span className="text-5xl animate-ball-bounce inline-block">🟡</span>
          <span className="text-4xl animate-racket-swing inline-block" style={{ transformOrigin: "bottom center", animationDelay: "1.2s" }}>🎾</span>
        </div>

        {/* メインタイトル */}
        <h1
          className="title-gradient font-black tracking-tighter leading-none mb-1"
          style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)" }}
        >
          DOUBLES
        </h1>
        <h2
          className="title-gradient font-black tracking-tighter leading-none"
          style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", animationDelay: "0.5s" }}
        >
          SCHEDULER
        </h2>

        {/* デコライン */}
        <div className="flex items-center gap-2 mt-3 px-4">
          <div className="flex-1 h-px animate-line-grow" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5))", animationDelay: "0.4s" }} />
          <span className="text-white/60 text-xs font-bold tracking-widest">テニスダブルス</span>
          <div className="flex-1 h-px animate-line-grow" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.5), transparent)", animationDelay: "0.4s" }} />
        </div>
      </div>

      {/* ─ カード本体 ─ */}
      <div
        className="animate-title-reveal w-full rounded-3xl p-6 relative overflow-hidden"
        style={{
          animationDelay: "0.2s",
          background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
          border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* スキャンラインエフェクト */}
        <div
          className="absolute left-0 right-0 h-16 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(74,222,128,0.06), transparent)",
            animation: "scanLine 3s linear infinite",
            top: 0,
          }}
        />

        {/* 人数選択ラベル */}
        <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 text-center">
          — 参加人数を選択 —
        </p>

        {/* 人数グリッド */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {Array.from({ length: 9 }, (_, i) => i + 4).map((num, idx) => (
            <button
              key={num}
              onClick={() => handleSelect(num)}
              className="relative py-3 rounded-2xl font-black text-lg transition-all duration-200 active:scale-90 overflow-hidden"
              style={{
                animationDelay: `${0.3 + idx * 0.05}s`,
                background: n === num
                  ? "linear-gradient(135deg, #16a34a, #4ade80)"
                  : "rgba(255,255,255,0.07)",
                color: n === num ? "#fff" : "rgba(255,255,255,0.5)",
                border: n === num ? "2px solid rgba(74,222,128,0.6)" : "2px solid rgba(255,255,255,0.1)",
                boxShadow: n === num ? "0 0 20px rgba(74,222,128,0.4), inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
                transform: n === num ? "scale(1.08)" : "scale(1)",
              }}
            >
              {n === num && (
                <div className="absolute inset-0 rounded-2xl" style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)",
                }} />
              )}
              <span className="relative z-10">{num}</span>
              {n === num && <span className="relative z-10 text-xs block text-green-100 leading-none -mt-0.5">人</span>}
            </button>
          ))}
        </div>

        {/* 選択中の人数表示 */}
        <div
          className="rounded-2xl p-4 mb-5 text-center relative overflow-hidden"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">参加人数</p>
              <p key={flipKey} className="animate-number-flip font-black text-4xl text-white animate-glow-pulse">
                {n}
                <span className="text-xl text-white/60">人</span>
              </p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">試合数</p>
              <p key={`mc-${flipKey}`} className="animate-number-flip font-black text-4xl text-white">
                {calcMatchCount(n)}
                <span className="text-xl text-white/60">試合</span>
              </p>
            </div>
          </div>
        </div>

        {/* スタートボタン */}
        <button
          onClick={() => onStart(n)}
          className="w-full relative py-4 rounded-2xl font-black text-xl text-white active:scale-95 transition-all overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
            boxShadow: "0 8px 32px rgba(22,163,74,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {/* ホバーシマー */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)" }}
          />
          <span className="relative z-10 tracking-wider">START ▶</span>
        </button>
      </div>

    </div>
  );
}

/* ─── 試合表示画面 ─── */
function PlayingScreen({
  matches, currentIndex, direction, animKey, n,
  onNext, onPrev, onRestart, onHome,
}: {
  matches: Match[];
  currentIndex: number;
  direction: Direction;
  animKey: number;
  n: number;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === matches.length - 1;
  const animClass = direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <div className="w-full flex flex-col items-center gap-3" style={{ maxWidth: 440 }}>

      {/* ヘッダー */}
      <div className="flex justify-between items-center w-full px-1">
        <span className="text-xs font-bold text-white/70 bg-white/10 px-3 py-1 rounded-full">
          {n}人参加
        </span>
        <Clock />
        <span className="text-sm font-black text-white drop-shadow">
          第 {currentIndex + 1}<span className="text-white/50 font-normal"> / {matches.length}</span> 試合
        </span>
      </div>

      {/* ドットインジケーター */}
      <div className="flex gap-1.5">
        {matches.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              backgroundColor: i === currentIndex ? "#fff" : i < currentIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* カルーセル本体：-mx で画面幅いっぱいに広げてoverflowで切る */}
      <div className="w-full overflow-hidden -mx-4 px-4">
        <div className="flex items-stretch gap-3">

          {/* 前のカード（チラ見せ） */}
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex-shrink-0 disabled:opacity-0 disabled:pointer-events-none active:scale-95 transition-all duration-200"
            style={{ width: 88 }}
          >
            {!isFirst && (
              <PeekCard match={matches[currentIndex - 1]} index={currentIndex - 1} side="left" />
            )}
          </button>

          {/* メインカード */}
          <div key={animKey} className={`flex-1 min-w-0 ${animClass}`}>
            <MatchCard match={matches[currentIndex]} isLast={isLast} />
          </div>

          {/* 次のカード（チラ見せ） */}
          <button
            onClick={onNext}
            disabled={isLast}
            className="flex-shrink-0 disabled:opacity-0 disabled:pointer-events-none active:scale-95 transition-all duration-200"
            style={{ width: 88 }}
          >
            {!isLast && (
              <PeekCard match={matches[currentIndex + 1]} index={currentIndex + 1} side="right" />
            )}
          </button>

        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all active:scale-95 text-sm"
        >
          ◀ 前の試合
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-green-900/30 active:scale-95 text-sm"
        >
          次の試合 ▶
        </button>
      </div>

      {/* サブボタン */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onRestart}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 font-medium py-2 rounded-xl text-xs transition-all"
        >
          やり直す
        </button>
        <button
          onClick={onHome}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 font-medium py-2 rounded-xl text-xs transition-all"
        >
          ホーム
        </button>
      </div>
    </div>
  );
}

/* ─── チラ見せカード ─── */
function PeekCard({ match, index, side }: { match: Match; index: number; side: "left" | "right" }) {
  const [a, b] = match.teamA.players;
  const [c, d] = match.teamB.players;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
        minHeight: 160,
      }}
    >
      {/* 第N試合ラベル */}
      <div
        className="px-2 py-1.5 text-center"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">
          第{index + 1}試合
        </span>
      </div>

      {/* チーム情報 */}
      <div className="flex-1 flex flex-col justify-center items-center gap-1.5 px-2 py-2">
        {/* チームA */}
        <div className="w-full rounded-xl py-1.5 px-1 text-center"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.35), rgba(59,130,246,0.2))", border: "1px solid rgba(96,165,250,0.3)" }}
        >
          <div className="text-[10px] font-black text-blue-300 leading-none mb-0.5">A</div>
          <div className="font-black text-white leading-none" style={{ fontSize: 13 }}>
            {a} <span className="text-white/40">&</span> {b}
          </div>
        </div>

        {/* VS */}
        <div className="text-[9px] font-black text-white/30 tracking-widest">VS</div>

        {/* チームB */}
        <div className="w-full rounded-xl py-1.5 px-1 text-center"
          style={{ background: "linear-gradient(135deg, rgba(185,28,28,0.35), rgba(239,68,68,0.2))", border: "1px solid rgba(248,113,113,0.3)" }}
        >
          <div className="text-[10px] font-black text-red-300 leading-none mb-0.5">B</div>
          <div className="font-black text-white leading-none" style={{ fontSize: 13 }}>
            {c} <span className="text-white/40">&</span> {d}
          </div>
        </div>
      </div>

      {/* 矢印 */}
      <div className="pb-2 text-center">
        <span className="text-white/25 font-black" style={{ fontSize: 10 }}>
          {side === "left" ? "◀ 戻る" : "次へ ▶"}
        </span>
      </div>

      {/* サイドのグラデーションフェード（内側へ消える演出） */}
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{
          [side === "left" ? "left" : "right"]: 0,
          width: "30%",
          background: side === "left"
            ? "linear-gradient(to right, rgba(20,60,20,0.6), transparent)"
            : "linear-gradient(to left, rgba(20,60,20,0.6), transparent)",
        }}
      />
    </div>
  );
}

/* ─── メイン試合カード ─── */
function MatchCard({ match, isLast }: { match: Match; isLast: boolean }) {
  const players = [
    match.teamA.players[0],
    match.teamA.players[1],
    match.teamB.players[0],
    match.teamB.players[1],
  ];

  return (
    <div
      className="rounded-3xl shadow-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,253,244,0.97) 100%)",
        border: "1px solid rgba(255,255,255,0.8)",
      }}
    >
      {/* チーム表示 */}
      <div className="p-5 flex flex-col items-center gap-3">
        <PlayerBadges label="TEAM A" players={match.teamA.players} color="blue" />

        {/* VS */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <div
            className="animate-vs-flash text-2xl font-black tracking-widest"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed, #dc2626)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            VS
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <PlayerBadges label="TEAM B" players={match.teamB.players} color="red" />
      </div>

      {/* サーブルーレット */}
      <div className="mx-4 mb-4">
        <ServeRoulette players={players} />
      </div>

      {/* 待機中 */}
      {match.waiting.length > 0 && (
        <div className="mx-4 mb-4 bg-gray-50 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            待機中
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.waiting.map((p) => (
              <span
                key={p}
                className="bg-white border border-gray-200 text-gray-500 rounded-full px-3 py-0.5 text-sm font-bold shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 終了 */}
      {isLast && (
        <div className="mx-4 mb-4 rounded-2xl p-3 text-center text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #fef9c3, #fef3c7)", color: "#92400e" }}
        >
          🎾 全試合終了！お疲れ様でした
        </div>
      )}
    </div>
  );
}

/* ─── サーブルーレット ─── */
type RouletteState = "idle" | "spinning" | "done";

function ServeRoulette({ players }: { players: number[] }) {
  const [state, setState] = useState<RouletteState>("idle");
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  // 試合が変わったらリセット
  useEffect(() => {
    setState("idle");
    setHighlighted(null);
    setWinner(null);
    setConfetti([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [players.join(",")]);

  const spin = useCallback(() => {
    if (state !== "idle") return;
    setState("spinning");
    setWinner(null);
    setHighlighted(null);

    const totalSteps = 28; // スピン総ステップ数
    const pickedIdx = Math.floor(Math.random() * players.length);
    stepRef.current = 0;

    intervalRef.current = setInterval(() => {
      stepRef.current += 1;
      const step = stepRef.current;

      // 徐々に遅くなる: 前半は速く、後半はゆっくり
      const progress = step / totalSteps;
      const delay = 60 + Math.floor(progress * progress * 320);

      // ハイライト対象を順番に回す（後半は正解に向けて誘導）
      let idx: number;
      if (step < totalSteps - players.length) {
        idx = step % players.length;
      } else {
        // 残りステップで正確に pickedIdx に着地
        const remaining = totalSteps - step;
        idx = (pickedIdx - remaining + players.length * 10) % players.length;
      }
      setHighlighted(players[idx]);

      if (step >= totalSteps) {
        clearInterval(intervalRef.current!);
        setHighlighted(null);
        setWinner(players[pickedIdx]);
        setState("done");
        // 紙吹雪
        setConfetti(
          Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            color: ["#facc15", "#4ade80", "#60a5fa", "#f87171", "#c084fc"][i % 5],
          }))
        );
      } else {
        // インターバルを動的に変更するため再スケジュール
        clearInterval(intervalRef.current!);
        intervalRef.current = setInterval(() => {}, 99999); // ダミー
        setTimeout(() => {
          if (stepRef.current < totalSteps) {
            // 再帰的に次のステップへ
          }
        }, delay);
      }
    }, 80);
  }, [state, players]);

  // より滑らかな可変速スピン実装
  useEffect(() => {
    if (state !== "spinning") return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const totalSteps = 32;
    const pickedIdx = Math.floor(Math.random() * players.length);
    let step = 0;

    function tick() {
      step += 1;
      const progress = step / totalSteps;

      let idx: number;
      if (step < totalSteps - players.length) {
        idx = step % players.length;
      } else {
        const remaining = totalSteps - step;
        idx = (pickedIdx - remaining + players.length * 10) % players.length;
      }
      setHighlighted(players[idx]);

      if (step >= totalSteps) {
        setHighlighted(null);
        setWinner(players[pickedIdx]);
        setState("done");
        setConfetti(
          Array.from({ length: 14 }, (_, i) => ({
            id: i,
            x: 5 + Math.random() * 90,
            color: ["#facc15", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#fb923c"][i % 6],
          }))
        );
        return;
      }

      // 可変速: 最初60ms → 最後400ms
      const nextDelay = 60 + Math.floor(progress * progress * 380);
      intervalRef.current = setTimeout(tick, nextDelay) as unknown as ReturnType<typeof setInterval>;
    }

    intervalRef.current = setTimeout(tick, 60) as unknown as ReturnType<typeof setInterval>;
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current as unknown as ReturnType<typeof setTimeout>); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div
      className="rounded-2xl p-3 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}
    >
      {/* 紙吹雪 */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="animate-confetti absolute top-0 pointer-events-none"
          style={{
            left: `${c.x}%`,
            width: 7,
            height: 7,
            borderRadius: c.id % 2 === 0 ? "50%" : 2,
            backgroundColor: c.color,
            animationDelay: `${c.id * 0.06}s`,
          }}
        />
      ))}

      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
        🎾 サーブ権
      </p>

      {/* プレイヤーボタン群 */}
      <div className="flex justify-center gap-2 mb-3">
        {players.map((p) => {
          const isHighlighted = highlighted === p;
          const isWinner = winner === p;
          return (
            <div
              key={p}
              className={`
                flex items-center justify-center rounded-xl font-black text-xl
                transition-all duration-75
                ${isWinner ? "animate-winner-pop animate-winner-glow" : ""}
              `}
              style={{
                width: 52,
                height: 52,
                background: isWinner
                  ? "linear-gradient(135deg, #facc15, #f59e0b)"
                  : isHighlighted
                  ? "linear-gradient(135deg, #6ee7b7, #10b981)"
                  : "rgba(255,255,255,0.08)",
                color: isWinner ? "#78350f" : isHighlighted ? "#fff" : "rgba(255,255,255,0.4)",
                transform: isHighlighted ? "scale(1.2)" : "scale(1)",
                boxShadow: isWinner
                  ? "0 0 24px 8px rgba(250,204,21,0.8)"
                  : isHighlighted
                  ? "0 0 16px 4px rgba(16,185,129,0.7)"
                  : "none",
                border: isWinner ? "2px solid #fde68a" : "2px solid transparent",
              }}
            >
              {p}
            </div>
          );
        })}
      </div>

      {/* 結果表示 */}
      {winner !== null && (
        <div className="mb-2 animate-pop-in">
          <span className="text-yellow-300 font-black text-lg">
            {winner}番がサーブ！
          </span>
        </div>
      )}

      {/* ボタン */}
      {state === "idle" && (
        <button
          onClick={spin}
          className="w-full py-2 rounded-xl font-black text-sm text-white transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          🎲 サーブ権を決める
        </button>
      )}
      {state === "spinning" && (
        <div className="text-white/50 text-xs font-bold animate-pulse">決定中...</div>
      )}
      {state === "done" && (
        <button
          onClick={() => { setState("idle"); setWinner(null); setHighlighted(null); setConfetti([]); }}
          className="w-full py-1.5 rounded-xl font-bold text-xs text-white/60 border border-white/20 hover:bg-white/10 transition-all"
        >
          もう一度
        </button>
      )}
    </div>
  );
}

/* ─── プレイヤーバッジ ─── */
function PlayerBadges({ label, players, color }: {
  label: string;
  players: [number, number];
  color: "blue" | "red";
}) {
  const isBlue = color === "blue";
  return (
    <div className="w-full">
      <p className={`text-[10px] font-black tracking-widest mb-2 ${isBlue ? "text-blue-400" : "text-red-400"}`}>
        {label}
      </p>
      <div className="flex gap-3 justify-center">
        {players.map((p) => (
          <div
            key={p}
            className="animate-float-up flex flex-col items-center justify-center rounded-2xl font-black shadow-lg"
            style={{
              width: 72,
              height: 72,
              background: isBlue
                ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                : "linear-gradient(135deg, #b91c1c, #ef4444)",
              boxShadow: isBlue
                ? "0 8px 20px rgba(37,99,235,0.4)"
                : "0 8px 20px rgba(185,28,28,0.4)",
              animationDelay: `${p * 0.15}s`,
            }}
          >
            <span className="text-white/60 text-[10px] font-bold leading-none">No.</span>
            <span className="text-white text-3xl leading-tight">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
