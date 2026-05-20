import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

// ─── Design tokens ─────────────────────────────────────────────────
const C = {
  black: "#0a0a0a",
  navy: "#0d1b5e",
  blue: "#1428A0",
  lightBlue: "#4A7FFF",
  yellow: "#FFD700",
  white: "#FFFFFF",
  gray: "rgba(255,255,255,0.45)",
  dimGray: "rgba(255,255,255,0.2)",
};

const FONT = '"맑은 고딕", "Noto Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif';

// ─── Timing (frames @ 30 fps) ──────────────────────────────────────
//  Scene 1  Intro        0  – 90   (3s)
//  Scene 2  Tagline     90  – 180  (3s)
//  Scene 3  Lunch      180  – 330  (5s)
//  Scene 4  Timetable  330  – 480  (5s)
//  Scene 5  Chat       480  – 615  (4.5s)
//  Scene 6  Overview   615  – 810  (6.5s)
//  Scene 7  Closing    810  – 990  (6s)
//  Credits             990  – 1290 (10s)
//  Total: 1290 frames = 43s

// ─── Helpers ───────────────────────────────────────────────────────
function useFadeIn(from = 0, to = 15) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateRight: "clamp" });
}

function useSlideUp(startFrame = 0, from = 80) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ fps, frame: frame - startFrame, config: { damping: 14, stiffness: 160, mass: 0.7 }, from, to: 0 });
}

function useScalePop(startFrame = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ fps, frame: frame - startFrame, config: { damping: 10, stiffness: 200 }, from: 0.5, to: 1 });
}

// ─── SCENE 1: Intro ─────────────────────────────────────────────────
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ fps, frame, config: { damping: 10, stiffness: 200 }, from: 0, to: 1 });
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const titleY = spring({ fps, frame: frame - 8, config: { damping: 14, stiffness: 140 }, from: 90, to: 0 });
  const titleOpacity = interpolate(frame, [8, 24], [0, 1], { extrapolateRight: "clamp" });

  const subY = spring({ fps, frame: frame - 22, config: { damping: 14, stiffness: 140 }, from: 60, to: 0 });
  const subOpacity = interpolate(frame, [22, 38], [0, 1], { extrapolateRight: "clamp" });

  const tagOpacity = interpolate(frame, [42, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Blue glow orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(20,40,160,0.35) 0%, transparent 70%)`,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      />

      {/* Logo circle */}
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.blue} 0%, ${C.lightBlue} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 44,
          boxShadow: `0 0 60px rgba(74,127,255,0.5)`,
        }}
      >
        🏫
      </div>

      {/* 은가람 중학교 */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 110,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -4,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          lineHeight: 1,
        }}
      >
        은가람 중학교
      </div>

      {/* 1학년 2반 */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 72,
          fontWeight: 700,
          color: C.lightBlue,
          letterSpacing: -2,
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
          marginTop: 16,
        }}
      >
        1학년 2반
      </div>

      {/* Tag */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 26,
          fontWeight: 400,
          color: C.gray,
          opacity: tagOpacity,
          marginTop: 28,
          letterSpacing: 1,
        }}
      >
        공식 통합 정보 사이트
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 2: Tagline ───────────────────────────────────────────────
const SceneTagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Y = spring({ fps, frame, config: { damping: 14, stiffness: 150 }, from: 80, to: 0 });
  const line1Op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const line2Y = spring({ fps, frame: frame - 14, config: { damping: 14, stiffness: 150 }, from: 80, to: 0 });
  const line2Op = interpolate(frame, [14, 28], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingLeft: 160,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 120,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -5,
          lineHeight: 1.05,
          transform: `translateY(${line1Y}px)`,
          opacity: line1Op,
        }}
      >
        우리 반의 모든 것이
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 120,
          fontWeight: 900,
          color: C.lightBlue,
          letterSpacing: -5,
          lineHeight: 1.05,
          transform: `translateY(${line2Y}px)`,
          opacity: line2Op,
        }}
      >
        한 곳에.
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 3: Lunch ─────────────────────────────────────────────────
const MENU = ["쌀밥", "미역국", "제육볶음", "김치", "요구르트"];

const SceneLunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emojiScale = useScalePop(0);
  const titleY = useSlideUp(5);
  const titleOp = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });
  const cardOp = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const cardY = spring({ fps, frame: frame - 20, config: { damping: 14, stiffness: 130 }, from: 40, to: 0 });

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 160,
        paddingRight: 160,
      }}
    >
      {/* Left: emoji + label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div
          style={{
            fontSize: 140,
            transform: `scale(${emojiScale})`,
            display: "block",
            lineHeight: 1,
          }}
        >
          🍱
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 100,
            fontWeight: 900,
            color: C.white,
            letterSpacing: -4,
            transform: `translateY(${titleY}px)`,
            opacity: titleOp,
            lineHeight: 1,
            marginTop: 24,
          }}
        >
          오늘
          <br />
          급식
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 26,
            color: C.lightBlue,
            opacity: titleOp,
            marginTop: 20,
            fontWeight: 600,
          }}
        >
          NEIS API 실시간 연동
        </div>
      </div>

      {/* Right: menu card */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 28,
          padding: "48px 56px",
          minWidth: 420,
          opacity: cardOp,
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.gray,
            marginBottom: 24,
            fontWeight: 600,
          }}
        >
          📅 2026년 5월 17일 (목)
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.12)",
            marginBottom: 28,
          }}
        />
        {MENU.map((item, i) => {
          const itemOp = interpolate(frame, [35 + i * 8, 50 + i * 8], [0, 1], { extrapolateRight: "clamp" });
          const itemX = interpolate(frame, [35 + i * 8, 50 + i * 8], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div
              key={item}
              style={{
                fontFamily: FONT,
                fontSize: 36,
                fontWeight: 700,
                color: C.white,
                marginBottom: 18,
                opacity: itemOp,
                transform: `translateX(${itemX}px)`,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 4: Timetable ─────────────────────────────────────────────
const DAYS = ["월", "화", "수", "목", "금"];
const SUBJECTS = [
  ["국어", "수학", "영어", "과학", "체육"],
  ["수학", "국어", "사회", "음악", "미술"],
  ["영어", "사회", "수학", "국어", "과학"],
  ["과학", "영어", "국어", "체육", "수학"],
  ["사회", "체육", "미술", "영어", "국어"],
  ["체육", "음악", "과학", "사회", "영어"],
];
const SUBJECT_COLORS: Record<string, string> = {
  국어: "#FF6B6B",
  수학: "#4ECDC4",
  영어: "#45B7D1",
  과학: "#96CEB4",
  사회: "#FFEAA7",
  체육: "#DDA0DD",
  음악: "#98D8C8",
  미술: "#F7DC6F",
};

const SceneTimetable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ fps, frame, config: { damping: 14, stiffness: 150 }, from: 60, to: 0 });

  return (
    <AbsoluteFill
      style={{
        background: "#0d1035",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 140,
        paddingRight: 100,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ fontSize: 120, lineHeight: 1 }}>📅</div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 900,
            color: C.white,
            letterSpacing: -4,
            lineHeight: 1,
            marginTop: 20,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          시간표
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: C.lightBlue,
            marginTop: 18,
            fontWeight: 600,
            opacity: titleOp,
          }}
        >
          NEIS API 실시간 동기화
        </div>
      </div>

      {/* Right: timetable grid */}
      <div style={{ flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", marginBottom: 8 }}>
          <div style={{ width: 52, flexShrink: 0 }} />
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                width: 112,
                textAlign: "center",
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 700,
                color: C.gray,
                marginRight: 6,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {SUBJECTS.map((row, ri) =>
          row.map((subj, ci) => {
            const delay = 12 + ri * 5 + ci * 1.5;
            const cellOp = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
            const cellScale = spring({ fps, frame: frame - delay, config: { damping: 12, stiffness: 200 }, from: 0.8, to: 1 });
            return null; // filled below
          })
        )}

        {SUBJECTS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", marginBottom: 6 }}>
            {/* Period number */}
            <div
              style={{
                width: 52,
                flexShrink: 0,
                fontFamily: FONT,
                fontSize: 18,
                color: C.dimGray,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {ri + 1}
            </div>
            {row.map((subj, ci) => {
              const delay = 12 + ri * 5 + ci * 1.5;
              const cellOp = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
              const cellScale = spring({ fps, frame: frame - delay, config: { damping: 12, stiffness: 200 }, from: 0.7, to: 1 });
              const bgColor = SUBJECT_COLORS[subj] ?? "#4A7FFF";
              return (
                <div
                  key={ci}
                  style={{
                    width: 112,
                    height: 56,
                    borderRadius: 10,
                    background: `${bgColor}22`,
                    border: `1px solid ${bgColor}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT,
                    fontSize: 20,
                    fontWeight: 700,
                    color: bgColor,
                    marginRight: 6,
                    opacity: cellOp,
                    transform: `scale(${cellScale})`,
                  }}
                >
                  {subj}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 5: Chat ──────────────────────────────────────────────────
interface ChatMsg {
  text: string;
  mine: boolean;
  delay: number;
}
const CHAT_MSGS: ChatMsg[] = [
  { text: "오늘 급식 뭐야?", mine: false, delay: 5 },
  { text: "제육볶음! 사이트에서 봤어 😋", mine: true, delay: 22 },
  { text: "시간표 어디서 봐?", mine: false, delay: 38 },
  { text: "은가람 사이트 들어가면 다 있어", mine: true, delay: 55 },
  { text: "오 진짜? 채팅도 돼?", mine: false, delay: 70 },
  { text: "응! 지금 여기서 하는 중 ㅋㅋ", mine: true, delay: 85 },
];

const SceneChat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ fps, frame, config: { damping: 14, stiffness: 150 }, from: 60, to: 0 });

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 160,
        paddingRight: 140,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ fontSize: 120, lineHeight: 1 }}>💬</div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 900,
            color: C.white,
            letterSpacing: -4,
            lineHeight: 1,
            marginTop: 20,
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
          }}
        >
          실시간
          <br />
          채팅
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: C.lightBlue,
            marginTop: 18,
            fontWeight: 600,
            opacity: titleOp,
          }}
        >
          Firebase 실시간 동기화
        </div>
      </div>

      {/* Right: chat mockup */}
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: 28,
          padding: "32px 28px",
          width: 480,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Chat header */}
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 700,
            color: C.gray,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: 16,
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#4CAF50",
              boxShadow: "0 0 6px #4CAF50",
            }}
          />
          은가람 1-2반 채팅방
        </div>

        {CHAT_MSGS.map((msg, i) => {
          const msgOp = interpolate(frame, [msg.delay, msg.delay + 10], [0, 1], { extrapolateRight: "clamp" });
          const msgX = interpolate(
            frame,
            [msg.delay, msg.delay + 10],
            [msg.mine ? 20 : -20, 0],
            { extrapolateRight: "clamp" }
          );
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.mine ? "flex-end" : "flex-start",
                opacity: msgOp,
                transform: `translateX(${msgX}px)`,
              }}
            >
              <div
                style={{
                  background: msg.mine ? C.blue : "rgba(255,255,255,0.1)",
                  borderRadius: msg.mine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  padding: "12px 20px",
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 500,
                  color: C.white,
                  maxWidth: 320,
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 6: Overview ──────────────────────────────────────────────
const FEATURES = [
  { icon: "🍱", label: "급식 정보" },
  { icon: "📅", label: "시간표" },
  { icon: "🗓️", label: "학사일정" },
  { icon: "💬", label: "실시간 채팅" },
  { icon: "📝", label: "게시판" },
  { icon: "🗳️", label: "투표" },
  { icon: "🎮", label: "미니게임" },
  { icon: "🪑", label: "자리 뽑기" },
];

const SceneOverview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ fps, frame, config: { damping: 14, stiffness: 150 }, from: 60, to: 0 });

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 54,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -2,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          marginBottom: 20,
        }}
      >
        이 모든 기능이{" "}
        <span style={{ color: C.lightBlue }}>한 곳에</span>
      </div>

      {/* Feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          marginTop: 16,
        }}
      >
        {FEATURES.map((feat, i) => {
          const delay = 18 + i * 10;
          const featOp = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const featScale = spring({ fps, frame: frame - delay, config: { damping: 10, stiffness: 220 }, from: 0.5, to: 1 });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                width: 220,
                height: 200,
                opacity: featOp,
                transform: `scale(${featScale})`,
              }}
            >
              <div style={{ fontSize: 70, lineHeight: 1, marginBottom: 16 }}>{feat.icon}</div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 26,
                  fontWeight: 700,
                  color: C.white,
                }}
              >
                {feat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub tag */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 22,
          color: C.gray,
          marginTop: 40,
          opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        PWA · 모바일 최적화 · 오프라인 지원 · Firebase 실시간
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 7: Closing ───────────────────────────────────────────────
const SceneClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ fps, frame, config: { damping: 10, stiffness: 160 }, from: 0, to: 1 });
  const logoOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const line1Y = spring({ fps, frame: frame - 18, config: { damping: 14, stiffness: 150 }, from: 70, to: 0 });
  const line1Op = interpolate(frame, [18, 33], [0, 1], { extrapolateRight: "clamp" });

  const line2Y = spring({ fps, frame: frame - 36, config: { damping: 14, stiffness: 150 }, from: 60, to: 0 });
  const line2Op = interpolate(frame, [36, 50], [0, 1], { extrapolateRight: "clamp" });

  const ctaOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const glowPulse = 0.6 + 0.4 * Math.sin((frame / 30) * Math.PI * 1.2);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #0d1b5e 0%, ${C.black} 65%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          borderRadius: "50%",
          border: `2px solid rgba(74,127,255,${glowPulse * 0.4})`,
          boxShadow: `0 0 80px rgba(74,127,255,${glowPulse * 0.3})`,
          opacity: logoOp,
        }}
      />

      {/* Logo */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.blue} 0%, ${C.lightBlue} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 90,
          opacity: logoOp,
          transform: `scale(${logoScale})`,
          boxShadow: `0 0 80px rgba(74,127,255,0.6)`,
          marginBottom: 52,
        }}
      >
        🏫
      </div>

      {/* Text lines */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 80,
          fontWeight: 900,
          color: C.white,
          letterSpacing: -3,
          lineHeight: 1.1,
          textAlign: "center",
          transform: `translateY(${line1Y}px)`,
          opacity: line1Op,
        }}
      >
        은가람 중학교
        <br />
        <span style={{ color: C.lightBlue }}>1학년 2반</span> 사이트
      </div>

      {/* CTA */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 600,
          color: C.gray,
          marginTop: 32,
          transform: `translateY(${line2Y}px)`,
          opacity: line2Op,
        }}
      >
        지금 바로 사용해보세요
      </div>

      {/* Bottom tag */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          fontFamily: FONT,
          fontSize: 22,
          color: C.dimGray,
          opacity: ctaOp,
          letterSpacing: 1,
        }}
      >
        PWA 설치 가능 · 모바일 · PC 지원
      </div>
    </AbsoluteFill>
  );
};

// ─── SCENE 8: Credits ───────────────────────────────────────────────
const SceneCredits: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [220, 270], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        background: C.black,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 400,
          color: "rgba(255,255,255,0.5)",
          opacity,
          letterSpacing: 2,
        }}
      >
        노래 출처: 리틱
      </div>
    </AbsoluteFill>
  );
};

// ─── Main composition ────────────────────────────────────────────────
export const EungaramVideo: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("audio.mp3")} volume={0.85} />

      <Sequence from={0} durationInFrames={90}>
        <SceneIntro />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <SceneTagline />
      </Sequence>

      <Sequence from={180} durationInFrames={150}>
        <SceneLunch />
      </Sequence>

      <Sequence from={330} durationInFrames={150}>
        <SceneTimetable />
      </Sequence>

      <Sequence from={480} durationInFrames={135}>
        <SceneChat />
      </Sequence>

      <Sequence from={615} durationInFrames={195}>
        <SceneOverview />
      </Sequence>

      <Sequence from={810} durationInFrames={180}>
        <SceneClosing />
      </Sequence>

      <Sequence from={990} durationInFrames={300}>
        <SceneCredits />
      </Sequence>
    </>
  );
};
