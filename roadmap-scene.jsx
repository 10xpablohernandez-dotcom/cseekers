// roadmap-scene.jsx — "Protocolo ACOS" 16-week / 4-phase roadmap.
// Reads the timeline engine globals set by animations.jsx.
const { Stage, useTime, Easing, clamp, interpolate } = window;

// ── Design tokens ───────────────────────────────────────────────
const NEON   = '#39FF14';
const DEEP   = '#1ED600';
const BLACK  = '#0A0A0A';
const WHITE  = '#FFFFFF';
const GREY   = 'rgba(255,255,255,0.65)';
const FAINT  = 'rgba(255,255,255,0.10)';
const RING   = 'rgba(255,255,255,0.22)';
const LOGODIM = '#B6E9A4';

const DISPLAY = "'DM Sans', system-ui, sans-serif";
const MONO    = "'JetBrains Mono', ui-monospace, monospace";
const BODY    = "'Inter', system-ui, sans-serif";

const EASE = Easing.easeOutCubic;

// ── Content ─────────────────────────────────────────────────────
const PHASES = [
  { n: '01', title: 'Diagnóstico ACOS',        weeks: '$14,900 · 10 DÍAS', result: 'Unit Economics maestro, auditoría Shopify + Meta/Google y mapa de fugas de margen. Tus números, sin humo.' },
  { n: '02', title: 'Veredicto go/no-go',      weeks: 'ACREDITABLE 100% A LITE', result: 'Recomendación con las cifras en la mesa. Si avanzas en ≤30 días, el diagnóstico se acredita completo.' },
  { n: '03', title: 'Ads Engine',              weeks: 'MENSUAL · MÍN. 3 MESES', result: 'Pauta Meta + Google encendida, tracking nativo verificado (Pixel + CAPI) y 8 visuales al mes.' },
  { n: '04', title: 'Margen de contribución',  weeks: 'REPORTE QUINCENAL', result: 'Lectura de margen real por cuenta. Alcance cerrado, cero improvisación — escalas sobre números.' },
];

// ── Layout ──────────────────────────────────────────────────────
const NODE_X = [330, 770, 1210, 1650];
const LINE_Y = 600;

// ── Timeline beats (seconds) ────────────────────────────────────
const LINE_START = 1.7;
const NODE_T     = [2.1, 3.8, 5.5, 7.2];   // when each node lights
const LINE_FULL  = 8.3;
const CLOSE_T    = 8.5;
const SHUTDOWN_T = 14.0;   // CRT "power-off" begins
const DURATION   = 15.0;

function blob(x, y, size, opacity) {
  return {
    position: 'absolute', left: x - size / 2, top: y - size / 2,
    width: size, height: size, borderRadius: '50%',
    background: `radial-gradient(circle, rgba(57,255,20,${opacity}) 0%, rgba(57,255,20,0) 70%)`,
    filter: 'blur(90px)', pointerEvents: 'none',
  };
}

function RoadmapScene() {
  const t = useTime();

  // ── CRT "power-off" shutdown (covers the loop reset seam) ──
  const sd  = clamp((t - SHUTDOWN_T) / 0.6, 0, 1);
  const sdV = clamp(sd / 0.62, 0, 1);             // 1st: vertical collapse to a line
  const sdH = clamp((sd - 0.62) / 0.38, 0, 1);    // 2nd: horizontal collapse to a dot
  const sdScaleY = sd > 0 ? 1 - 0.992 * Easing.easeInQuart(sdV) : 1;
  const sdScaleX = sd > 0 ? 1 - 0.985 * Easing.easeInQuart(sdH) : 1;
  const sdBright = sd > 0 ? 1 + 1.7 * Math.sin(sdV * Math.PI) : 1; // flash as it pinches
  const sdFlash  = sd > 0 ? Math.max(0, Math.sin(sdV * Math.PI)) * 0.85 : 0;
  const rootOpacity = sd > 0 ? 1 - sdH : 1;

  // Drifting atmosphere blobs
  const b1x = 380 + Math.sin(t * 0.30) * 70;
  const b1y = 240 + Math.cos(t * 0.24) * 45;
  const b2x = 1520 + Math.cos(t * 0.21) * 80;
  const b2y = 820 + Math.sin(t * 0.27) * 55;

  // Intro title
  const titleIn  = EASE(clamp((t - 0.3) / 0.7, 0, 1));
  const titleOut = clamp((t - 1.9) / 0.45, 0, 1);
  const titleOpacity = titleIn * (1 - titleOut);
  const titleY = (1 - titleIn) * 22 - titleOut * 18;

  // Header (logo + eyebrow) appear
  const headIn = EASE(clamp(t / 0.6, 0, 1));

  // Timeline skeleton appears
  const skelIn = clamp((t - 1.4) / 0.5, 0, 1);

  // Green progress head
  const lineHeadX = interpolate(
    [LINE_START, NODE_T[0], NODE_T[1], NODE_T[2], NODE_T[3], LINE_FULL],
    [NODE_X[0], NODE_X[0], NODE_X[1], NODE_X[2], NODE_X[3], NODE_X[3]],
    Easing.easeInOutCubic
  )(t);

  // Close fade for cards / numbers
  const closeFade = clamp((t - CLOSE_T) / 0.55, 0, 1);
  const closeOn = t >= CLOSE_T;

  // Close message
  const msgIn = EASE(clamp((t - 8.75) / 0.6, 0, 1));
  const subIn = EASE(clamp((t - 9.15) / 0.6, 0, 1));

  // ── Scarcity counter (heartbeat below the bar) ──
  // Three beats per number; the count drops on every 3rd beat. 3/3 → 2/3 → 1/3.
  const SPOTS_START = 9.4;
  const BEAT = 0.62;
  const spotsIn = EASE(clamp((t - SPOTS_START) / 0.45, 0, 1));
  const beatsElapsed = t > SPOTS_START ? Math.floor((t - SPOTS_START) / BEAT) : 0;
  const spots = Math.max(1, 3 - Math.floor((beatsElapsed + 1) / 3));
  const isDropBeat = ((beatsElapsed + 1) % 3) === 0;   // the beat the number falls on
  const beatPhase = t > SPOTS_START ? ((t - SPOTS_START) % BEAT) / BEAT : 1;
  const beatPop = t > SPOTS_START ? Math.pow(1 - beatPhase, 4) : 0; // 1 at each beat, decays
  const beatScale = 1 + (isDropBeat ? 0.28 : 0.14) * beatPop;
  const beatGlow = 0.32 + (isDropBeat ? 0.66 : 0.5) * beatPop;

  // ── Phase visual states ───────────────────────────────────────
  const phaseEls = [];
  const numberEls = [];
  const nodeEls = [];
  const connectorEls = [];

  PHASES.forEach((p, i) => {
    const rt = NODE_T[i];
    const nextT = i < 3 ? NODE_T[i + 1] : CLOSE_T;
    const appear = clamp((t - rt) / 0.55, 0, 1);
    const eApp = EASE(appear);
    const active = t >= rt && t < nextT;
    const completed = t >= nextT && t < CLOSE_T;
    const litNow = (active || closeOn) && appear > 0;   // neon bright
    const dimDone = completed;                          // deep / faded
    const revealed = appear > 0.001;

    // Entry pulse (0 → 1 → 0 across entry)
    const pulse = appear < 1 ? Math.sin(appear * Math.PI) : 0;
    const nodeScale = 1 + 0.55 * pulse;

    const x = NODE_X[i];

    // ring + node colors
    const ringColor = revealed ? (litNow ? NEON : DEEP) : RING;
    const nodeGlow = litNow
      ? `0 0 ${10 + pulse * 26}px rgba(57,255,20,${0.55 + pulse * 0.4}), 0 0 6px rgba(57,255,20,0.9)`
      : 'none';

    // base opacity for content
    const baseOp = active || closeOn ? 1 : completed ? 0.5 : 0;
    const contentOp = baseOp * (1 - closeFade);

    // ── Node ──
    nodeEls.push(
      <div key={'node' + i} style={{
        position: 'absolute', left: x, top: LINE_Y,
        transform: `translate(-50%,-50%) scale(${nodeScale})`,
        width: 26, height: 26, borderRadius: '50%',
        background: BLACK,
        border: `2px solid ${ringColor}`,
        boxShadow: nodeGlow,
        opacity: skelIn,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        willChange: 'transform',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: litNow ? NEON : dimDone ? DEEP : 'transparent',
          opacity: revealed ? (litNow ? 1 : 0.7) : 0,
          transform: `scale(${revealed ? 1 : 0})`,
        }} />
      </div>
    );

    // ── Vertical connector node → card ──
    connectorEls.push(
      <div key={'conn' + i} style={{
        position: 'absolute', left: x, top: LINE_Y + 16,
        width: 1, height: 36,
        transform: 'translateX(-50%)',
        background: litNow ? DEEP : FAINT,
        opacity: contentOp,
      }} />
    );

    // ── Big phase number (above) ──
    const numColor = litNow ? NEON : dimDone ? DEEP : WHITE;
    numberEls.push(
      <div key={'num' + i} style={{
        position: 'absolute', left: x, top: 372,
        transform: `translate(-50%, ${(1 - eApp) * 14}px)`,
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 132,
        letterSpacing: '-0.05em', lineHeight: 0.9,
        color: numColor,
        opacity: contentOp,
        textShadow: litNow ? `0 0 40px rgba(57,255,20,${0.35 + pulse * 0.4})` : 'none',
        willChange: 'transform, opacity',
      }}>
        {p.n}
      </div>
    );

    // ── Card (below) ──
    phaseEls.push(
      <div key={'card' + i} style={{
        position: 'absolute', left: x, top: 660, width: 360,
        transform: `translate(-50%, ${(1 - eApp) * 20}px)`,
        opacity: contentOp,
        textAlign: 'center',
        willChange: 'transform, opacity',
      }}>
        <div style={{
          fontFamily: DISPLAY, fontWeight: 800, fontSize: 30,
          letterSpacing: '-0.03em', color: WHITE, marginBottom: 12,
          lineHeight: 1.05,
        }}>
          {p.title}
        </div>
        <div style={{
          fontFamily: MONO, fontWeight: 600, fontSize: 14,
          letterSpacing: '0.12em', color: litNow ? NEON : DEEP,
          marginBottom: 16,
        }}>
          {p.weeks}
        </div>
        <div style={{
          fontFamily: BODY, fontWeight: 400, fontSize: 17.5,
          lineHeight: 1.5, color: GREY, maxWidth: 320, margin: '0 auto',
          textWrap: 'pretty',
        }}>
          {p.result}
        </div>
      </div>
    );
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, background: BLACK, overflow: 'hidden',
    }}>
     {/* everything below collapses in the CRT power-off */}
     <div style={{
       position: 'absolute', inset: 0,
       transform: `scaleY(${sdScaleY}) scaleX(${sdScaleX})`,
       transformOrigin: '50% 50%',
       filter: `brightness(${sdBright})`,
       opacity: rootOpacity,
       willChange: 'transform, filter, opacity',
     }}>
      {/* atmosphere */}
      <div style={blob(b1x, b1y, 620, 0.42)} />
      <div style={blob(b2x, b2y, 680, 0.34)} />

      {/* ── Header: logo (top-left) ── */}
      <div style={{
        position: 'absolute', left: 80, top: 66,
        opacity: headIn,
      }}>
        <img src="assets/cseekers-logo-white.png" alt="CSeekers" style={{ height: 42.5, width: 'auto', display: 'block' }} />
      </div>

      {/* ── Eyebrow (top-right) ── */}
      <div style={{
        position: 'absolute', right: 80, top: 74,
        fontFamily: MONO, fontWeight: 500, fontSize: 14,
        letterSpacing: '0.14em', color: GREY, textTransform: 'uppercase',
        opacity: headIn * (1 - closeFade * 0.4),
      }}>
        <span style={{ color: NEON }}>● </span>PROTOCOLO ACOS · PUNTO DE PARTIDA
      </div>

      {/* ── Intro title ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 430,
        textAlign: 'center', opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: DISPLAY, fontWeight: 900, fontSize: 92,
          letterSpacing: '-0.045em', lineHeight: 0.98, color: WHITE,
        }}>
          10 días. Línea base real.<br />
          <span style={{ color: NEON, textShadow: '0 0 50px rgba(57,255,20,0.4)' }}>Cero improvisación.</span>
        </div>
      </div>

      {/* ── Timeline base line ── */}
      <div style={{
        position: 'absolute', left: NODE_X[0], top: LINE_Y - 1,
        width: NODE_X[3] - NODE_X[0], height: 2,
        background: FAINT, opacity: skelIn,
      }} />
      {/* ── Green progress line ── */}
      <div style={{
        position: 'absolute', left: NODE_X[0], top: LINE_Y - 1.5,
        width: Math.max(0, lineHeadX - NODE_X[0]), height: 3,
        background: NEON,
        boxShadow: '0 0 14px rgba(57,255,20,0.7)',
        opacity: skelIn,
      }} />

      {connectorEls}
      {numberEls}
      {nodeEls}
      {phaseEls}

      {/* ── Close message ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 388,
        textAlign: 'center', opacity: msgIn,
        transform: `translateY(${(1 - msgIn) * 18}px)`,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: DISPLAY, fontWeight: 900, fontSize: 124,
          letterSpacing: '-0.05em', lineHeight: 0.92, color: NEON,
          textShadow: '0 0 60px rgba(57,255,20,0.5), 0 0 18px rgba(57,255,20,0.4)',
        }}>
          APLICAR AHORA
        </div>
        <div style={{
          marginTop: 28, fontFamily: MONO, fontWeight: 500, fontSize: 22,
          letterSpacing: '0.1em', color: GREY, opacity: subIn,
          textTransform: 'uppercase',
        }}>
          10 días · margen real · ESCALA TU ECOMMERCE
        </div>
      </div>

      {/* ── Scarcity counter (heartbeat, below the bar) ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 648,
        textAlign: 'center', opacity: spotsIn,
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          transform: `scale(${beatScale})`, transformOrigin: 'center',
          fontFamily: MONO, fontWeight: 600, fontSize: 24,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          willChange: 'transform',
        }}>
          <span style={{
            width: 11, height: 11, borderRadius: '50%', background: NEON,
            boxShadow: `0 0 ${8 + beatPop * 16}px rgba(57,255,20,${beatGlow})`,
          }} />
          <span style={{ color: GREY }}>Espacios disponibles</span>
          <span style={{
            color: NEON, fontWeight: 700,
            textShadow: `0 0 ${10 + beatPop * 22}px rgba(57,255,20,${beatGlow})`,
          }}>
            {spots} / 3
          </span>
        </div>
      </div>
     </div>

     {/* ── CRT power-off flash line (not scaled) ── */}
     <div style={{
       position: 'absolute', left: '8%', right: '8%', top: 539, height: 2,
       background: '#eaffe6',
       boxShadow: '0 0 34px 7px rgba(57,255,20,0.9)',
       opacity: sdFlash,
       transform: `scaleX(${0.35 + 0.65 * sdV})`,
       transformOrigin: '50% 50%',
       pointerEvents: 'none',
     }} />
    </div>
  );
}

function Roadmap() {
  return (
    <Stage width={1920} height={1080} duration={DURATION} background={BLACK} loop={true} autoplay={true}>
      <RoadmapScene />
    </Stage>
  );
}

window.RoadmapScene = RoadmapScene;
window.Roadmap = Roadmap;
if (typeof module !== 'undefined') module.exports = { Roadmap, RoadmapScene };
