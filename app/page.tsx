'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import {
  FileSpreadsheet, Settings, Edit3, BarChart2,
  CheckCircle, XCircle, ArrowRight,
} from 'lucide-react';

const VISITED_KEY = 'ds_nexus_visited';

/* ─── Design tokens ─── */
const T = {
  green900: '#0C2E1A',
  green800: '#0F3D22',
  green700: '#145230',
  green600: '#1A6B3E',
  green500: '#237A47',
  green200: '#A8D5B8',
  green100: '#D4EDE0',
  green50: '#EBF7EF',
  cream: '#FAFAF6',
  cream2: '#F3F3EE',
  gold: '#B8914A',
  goldLight: '#F5EDD8',
  text: '#0C2E1A',
  textMid: '#3A5A45',
  textSoft: '#6B8C75',
  border: '#D6E8DC',
  white: '#FFFFFF',
};

/* ─── Google Fonts injection ─── */
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
`;

/* ─── Global resets/base ─── */
const baseStyle = `
  * { box-sizing: border-box; }
  .nexus-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${T.text};
    overflow-x: hidden;
    background: ${T.cream};
  }
  .nexus-root h1, .nexus-root h2, .nexus-root h3 {
    font-family: 'Playfair Display', Georgia, serif;
  }
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 15px 36px;
    background: ${T.white};
    color: ${T.green700};
    border: none;
    border-radius: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.01em;
    transition: background 0.18s ease, transform 0.12s ease;
  }
  .btn-primary:hover { background: ${T.green50}; transform: translateY(-1px); }
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 20px;
    background: transparent;
    color: ${T.white};
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s ease;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.12); }
  .section-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  .eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .fade-divider {
    width: 48px; height: 2px; background: ${T.gold};
    border-radius: 2px; margin: 20px 0 28px;
  }

  /* ─── Preloader CSS ─── */
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  @keyframes fill-progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  .preloader-overlay {
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: radial-gradient(circle at center, #0F3D22 0%, #051A0E 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .preloader-overlay.fade-out {
    opacity: 0;
    pointer-events: none;
  }
  .outer-ring {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    border: 2px dashed #B8914A;
    animation: spin-slow 12s linear infinite;
  }
  .outer-pulse {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1px solid rgba(184, 145, 74, 0.15);
    animation: pulse-gold 3s ease-in-out infinite;
    pointer-events: none;
  }
  .inner-emblem {
    width: 84px;
    height: 84px;
    border-radius: 20px;
    background: #FFFFFF;
    border: 3px solid #B8914A;
    box-shadow: 0 12px 36px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .progress-container {
    width: 220px;
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 24px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #B8914A, #F5EDD8);
    border-radius: 10px;
    width: 0%;
    animation: fill-progress 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
`;

/* ─── Feature tile component ─── */
function FeatureTile({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '28px 28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: T.green50, border: `1px solid ${T.green100}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 10,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </div>
      <p style={{
        fontSize: 15, color: T.textMid, lineHeight: 1.75, margin: 0,
        fontWeight: 400,
      }}>
        {body}
      </p>
    </div>
  );
}

/* ─── Classification card ─── */
function ClassCard({
  accentColor, badge, badgeBg, badgeText,
  condition, payout, example,
}: {
  accentColor: string; badge: string; badgeBg: string; badgeText: string;
  condition: string; payout: string; example: string;
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: accentColor }} />
      <div style={{ padding: '22px 24px 26px' }}>
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          background: badgeBg,
          color: badgeText,
          letterSpacing: '0.02em',
          marginBottom: 16,
        }}>
          {badge}
        </span>
        <div style={{ fontSize: 14, color: T.textMid, marginBottom: 8, lineHeight: 1.6 }}>
          <span style={{ color: T.text, fontWeight: 500 }}>Condition : </span>{condition}
        </div>
        <div style={{ fontSize: 14, color: T.textMid, marginBottom: 14, lineHeight: 1.6 }}>
          <span style={{ color: T.text, fontWeight: 500 }}>Payout : </span>{payout}
        </div>
        <div style={{
          fontSize: 13, color: badgeText,
          background: badgeBg, padding: '8px 12px',
          borderRadius: 6, fontFamily: 'monospace',
          letterSpacing: '0.01em',
        }}>
          {example}
        </div>
      </div>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({
  num, title, body, formula,
}: { num: string; title: string; body: string; formula: string }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '28px',
      flex: 1,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: T.green800,
        color: T.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, marginBottom: 18,
        letterSpacing: '0.05em',
      }}>
        {num}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 10,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </div>
      <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.75, margin: '0 0 16px' }}>
        {body}
      </p>
      <div style={{
        fontFamily: 'monospace',
        background: T.cream,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        padding: '12px 14px',
        fontSize: 12.5,
        color: T.green700,
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
      }}>
        {formula}
      </div>
    </div>
  );
}

/* ═══════════════════ BRAND LOGO ═══════════════════ */
interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export function DsGroupLogo({ width = 48, height = 48, color = '#00A859' }: LogoProps) {
  return (
    <svg viewBox="0 0 100 100" width={width} height={height} style={{ display: 'block' }}>
      <g fill={color}>
        {/* Left Stem of D with S-curve cut */}
        <path d="M22 20 H45 C38 31, 31 40, 31 50 C31 60, 38 69, 45 80 H22 Z" />
        {/* Right Arch of D with S-curve cut */}
        <path d="M53 20 C68 20, 78 33, 78 50 C78 67, 68 80, 53 80 C46 69, 39 60, 39 50 C39 40, 46 31, 53 20 Z" />
      </g>
    </svg>
  );
}

/* ═══════════════════ PAGE ═══════════════════ */
export default function IntroPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Payout Engine...');

  useEffect(() => {
    // Dynamic status text updates
    const t1 = setTimeout(() => setStatusText('Analyzing Volumetric Models...'), 1000);
    const t2 = setTimeout(() => setStatusText('Nexus Engine Ready.'), 2000);
    
    // Smooth transition timers (3s spinner, 0.5s fade out)
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    const loadTimer = setTimeout(() => setLoading(false), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fadeTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  const enterDashboard = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(VISITED_KEY, 'true');
      document.cookie = `ds_nexus_visited=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    router.push('/dashboard');
  }, [router]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        background: '#FFFFFF',
      }}
    >
      {/* Beautiful Themed Preloader */}
      {loading && (
        <div className={`preloader-overlay ${fadeOut ? 'fade-out' : ''}`}>
          <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            {/* Spinning Dashed Ring */}
            <div className="outer-ring" style={{ position: 'absolute', inset: 0 }} />
            {/* Outer Pulsing Halo */}
            <div className="outer-pulse" />
            {/* Upright Solid DS Emblem */}
            <div className="inner-emblem">
              <DsGroupLogo width={48} height={48} color="#00A859" />
            </div>
          </div>

          {/* Premium brand subhead */}
          <div style={{ color: '#B8914A', fontSize: 11, letterSpacing: '0.22em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
            DS Group
          </div>
          {/* Dynamic loading text status */}
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 400, minHeight: 18 }}>
            {statusText}
          </div>

          {/* Thin progress bar line */}
          <div className="progress-container">
            <div className="progress-fill" />
          </div>
        </div>
      )}

      <div className="nexus-root">
        <style>{fontStyle}</style>
        <style>{baseStyle}</style>

        {/* ══ NAVBAR ══ */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 60,
          background: T.green800,
          borderBottom: `1px solid ${T.green700}`,
          display: 'flex', alignItems: 'center',
          padding: '0 40px', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* DS Group wordmark style */}
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: T.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
            }}>
              <DsGroupLogo width={22} height={22} color="#00A859" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 17, fontWeight: 600, color: T.white,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '-0.01em',
              }}>
                Nexus
              </span>
              <span style={{
                fontSize: 12, color: 'rgba(255,255,255,0.45)',
                fontWeight: 400,
              }}>
                Payout Intelligence
              </span>
            </div>
          </div>
          <button className="btn-ghost" onClick={enterDashboard}>
            Enter Dashboard <ArrowRight size={14} />
          </button>
        </nav>

        {/* ══ HERO ══ */}
        <section style={{
          background: T.green800,
          padding: '96px 40px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle decorative ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 600, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 900, height: 900, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.025)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 660, margin: '0 auto', position: 'relative' }}>
            <div className="section-eyebrow" style={{ color: T.gold, justifyContent: 'center' }}>
              <span className="eyebrow-dot" style={{ background: T.gold }} />
              DS Group · Rider Operations
            </div>

            <h1 style={{
              fontSize: 54,
              fontWeight: 500,
              color: T.white,
              margin: '0 0 24px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}>
              Fair pay, down to<br />
              <span style={{ fontStyle: 'normal', fontWeight: 600 }}>every last cubic centimetre.</span>
            </h1>

            <p style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.65)',
              margin: '0 auto 48px',
              maxWidth: 520,
              lineHeight: 1.7,
              fontWeight: 300,
            }}>
              Nexus calculates rider payouts based on what was actually delivered -
              volume, fulfilment ratio, and genuine cancellation attempts.
            </p>

            <button className="btn-primary" onClick={enterDashboard}>
              Enter Dashboard <ArrowRight size={16} />
            </button>

            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.3)',
              marginTop: 20, fontWeight: 400,
            }}>
              You can return to this guide any time from the dashboard
            </p>
          </div>
        </section>

        {/* ══ PROBLEM / SOLUTION ══ */}
        <section style={{ background: T.white, padding: '88px 40px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ color: T.green600 }}>
              <span className="eyebrow-dot" style={{ background: T.green600 }} />
              Why Nexus exists
            </div>
            <h2 style={{
              fontSize: 38, fontWeight: 500, color: T.text,
              margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.02em',
            }}>
              The old model pays everyone the same.<br />
              <em style={{ fontStyle: 'italic', color: T.green600 }}>That&apos;s not fair.</em>
            </h2>
            <div className="fade-divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
              {/* Before */}
              <div style={{
                borderRadius: 12, border: `1px solid #F5C5C5`,
                background: '#FFF8F8', padding: '28px 28px 32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <XCircle size={18} color="#C0392B" strokeWidth={2} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#C0392B' }}>Before Nexus</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {[
                    '₹40 flat per order - chips or pan masala sachets, same pay',
                    'Partial deliveries paid identically to full ones',
                    'No check on whether a cancellation was genuine',
                    'Riders skip heavy SKUs to maximise order count',
                  ].map((pt, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#C0392B', fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>—</span>
                      <span style={{ fontSize: 15, color: '#5A2020', lineHeight: 1.6 }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After */}
              <div style={{
                borderRadius: 12, border: `1px solid ${T.green200}`,
                background: T.green50, padding: '28px 28px 32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <CheckCircle size={18} color={T.green600} strokeWidth={2} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.green700 }}>With Nexus</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {[
                    'Payout scales with actual delivered volume (m³)',
                    'Partial deliveries earn proportional pay - nothing more',
                    'GPS drift distance validates every cancellation claim',
                    'Each hub sets its own rules and thresholds',
                    'Every rupee is traceable to a specific SKU line',
                  ].map((pt, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: T.green500, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 15, color: T.green900, lineHeight: 1.6 }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section style={{ background: T.cream, padding: '88px 40px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ color: T.green600 }}>
              <span className="eyebrow-dot" style={{ background: T.green600 }} />
              The calculation
            </div>
            <h2 style={{
              fontSize: 36, fontWeight: 500, color: T.text,
              margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.02em',
            }}>
              Three steps from order to payout
            </h2>
            <div className="fade-divider" />

            <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginTop: 8 }}>
              <StepCard
                num="01"
                title="Measure delivered volume"
                body="Each SKU has a unit volume in m³. Total order volume = sum of (unit volume × ordered qty). Delivered volume is the same but using delivered quantities."
                formula={`Fulfilment Ratio =\n  Delivered Volume ÷ Total Order Volume\n\nExample : 0.0236 m³ ÷ 0.0315 m³ = 0.75`}
              />
              <div style={{ display: 'flex', alignItems: 'center', color: T.textSoft, flexShrink: 0 }}>
                <ArrowRight size={18} />
              </div>
              <StepCard
                num="02"
                title="Scale payout proportionally"
                body="The base payout (default ₹40) is set per hub. The rider earns a fraction of that base, equal to their fulfilment ratio."
                formula={`Order Payout = Base × Fulfilment Ratio\n\nFull :    ₹40 × 1.00 = ₹40.00\n75% :     ₹40 × 0.75 = ₹30.00\nCancelled → see step 03`}
              />
              <div style={{ display: 'flex', alignItems: 'center', color: T.textSoft, flexShrink: 0 }}>
                <ArrowRight size={18} />
              </div>
              <StepCard
                num="03"
                title="Validate cancellations by GPS"
                body="Nexus checks the drift distance : how far the rider was from the drop point when they cancelled. Each hub sets its own distance threshold."
                formula={`Drift ≤ Hub threshold → Cancellation payout\nDrift > Hub threshold → ₹0.00\n\nDashboard cancellations → always ₹0`}
              />
            </div>
          </div>
        </section>

        {/* ══ ORDER TYPES ══ */}
        <section style={{ background: T.white, padding: '88px 40px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ color: T.green600 }}>
              <span className="eyebrow-dot" style={{ background: T.green600 }} />
              Order types
            </div>
            <h2 style={{
              fontSize: 36, fontWeight: 500, color: T.text,
              margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.02em',
            }}>
              Every order falls into one of four categories
            </h2>
            <div className="fade-divider" />

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 20, marginTop: 8,
            }}>
              <ClassCard
                accentColor={T.green600}
                badge="Fully Delivered"
                badgeBg={T.green50}
                badgeText={T.green700}
                condition="Completed status, all line items delivered"
                payout="Base Payout × 1.0 - full pay"
                example="4 / 4 DROP  →  ₹40.00"
              />
              <ClassCard
                accentColor="#D4A020"
                badge="Partially Delivered"
                badgeBg="#FDF8E8"
                badgeText="#7A5C10"
                condition="Completed status, some items not delivered"
                payout="Base Payout × (delivered ÷ total items)"
                example="3 / 4 DROP  →  ₹30.00"
              />
              <ClassCard
                accentColor="#2980B9"
                badge="Cancelled - Compensated"
                badgeBg="#EEF6FC"
                badgeText="#1A5580"
                condition="Rider cancelled, drift distance ≤ hub threshold"
                payout="Base Payout × hub cancellation percentage"
                example="Drift 0.11 km, threshold 0.5 km  →  ₹20.00"
              />
              <ClassCard
                accentColor="#C0392B"
                badge="Cancelled - No Payout"
                badgeBg="#FFF0EE"
                badgeText="#8B1A13"
                condition="Drift > threshold, or cancelled by ops dashboard"
                payout="₹0 - no compensation"
                example="Drift 0.72 km, threshold 0.5 km  →  ₹0.00"
              />
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section style={{ background: T.cream2, padding: '88px 40px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ color: T.green600 }}>
              <span className="eyebrow-dot" style={{ background: T.green600 }} />
              Getting started
            </div>
            <h2 style={{
              fontSize: 36, fontWeight: 500, color: T.text,
              margin: '0 0 12px', lineHeight: 1.25, letterSpacing: '-0.02em',
            }}>
              Four things you can do in Nexus
            </h2>
            <div className="fade-divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
              <FeatureTile
                icon={<FileSpreadsheet size={22} color={T.green600} />}
                title="Upload your Locus export"
                body="Drop in the daily Excel file exported from Locus. Nexus reads Task Details and Item Details, maps riders to hubs, computes fulfilment ratios, and populates the full payout dashboard - instantly."
              />
              <FeatureTile
                icon={<Settings size={22} color={T.green600} />}
                title="Configure your hub"
                body="Each hub can set its own drift threshold (km) and base payout (₹). Add HB002, HB007, or any hub - Nexus applies the right rules to every order based on the hub it belongs to."
              />
              <FeatureTile
                icon={<Edit3 size={22} color={T.green600} />}
                title="Enter orders manually"
                body="Enter individual orders directly - select hub, order status, add SKU lines with quantities and volumes. The cancellation drift field appears only when needed. Saved orders show instantly in the records table."
              />
              <FeatureTile
                icon={<BarChart2 size={22} color={T.green600} />}
                title="Review rider payouts"
                body="See per-rider totals, fulfilment ratios, cancellation counts, and compensation paid. Click any order to see hub, drift, SKU breakdown, and classification. Filter by rider, date, hub, or status."
              />
            </div>
          </div>
        </section>

        {/* ══ BOTTOM CTA ══ */}
        <section style={{
          background: T.green800,
          padding: '88px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: -120, right: -80,
            width: 400, height: 400, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
            <div className="section-eyebrow" style={{ color: T.gold, justifyContent: 'center' }}>
              <span className="eyebrow-dot" style={{ background: T.gold }} />
              Ready to begin
            </div>
            <h2 style={{
              fontSize: 38, fontWeight: 500, color: T.white,
              margin: '0 0 18px', lineHeight: 1.2, letterSpacing: '-0.02em',
            }}>
              Calculate fair payouts<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>starting today.</em>
            </h2>
            <p style={{
              fontSize: 17, color: 'rgba(255,255,255,0.55)',
              margin: '0 0 44px', lineHeight: 1.7, fontWeight: 300,
            }}>
              Upload today&apos;s Locus export or start entering orders manually.
            </p>
            <button className="btn-primary" onClick={enterDashboard}>
              Enter Dashboard <ArrowRight size={16} />
            </button>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.25)',
              marginTop: 36, fontWeight: 400,
            }}>
              DS Group · Nexus Payout Intelligence · Internal Tool
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
