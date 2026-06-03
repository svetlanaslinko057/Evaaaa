/**
 * PromoBanner — configurable marketing banner shown on the public site.
 * Fetches the single active banner from /api/public/banner?platform=web.
 *
 * Two render slots (controlled by the banner's `placement`):
 *   slot="top"  → thin sticky top bar (dismissible)
 *   slot="hero" → rich promo card (title, conditions, price, countdown, CTA)
 *
 * Theme-aware (light/dark), live countdown to `ends_at`, CTA modes:
 *   url | register | contact (opens the site-wide lead modal).
 * Content is rendered as-is (any language) — set in admin.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowUpRight, Clock, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { useContactModal } from '@/contexts/ContactModalContext';

// ─── module-level cache so top + hero slots share one fetch ──────────────────
let _cache = { value: undefined, in_flight: null };
async function fetchActiveBanner() {
  if (_cache.value !== undefined) return _cache.value;
  if (_cache.in_flight) return _cache.in_flight;
  _cache.in_flight = (async () => {
    try {
      const data = await api.get('/public/banner', { params: { platform: 'web' } });
      _cache.value = data?.banner || null;
    } catch (_e) {
      _cache.value = null;
    }
    _cache.in_flight = null;
    return _cache.value;
  })();
  return _cache.in_flight;
}

function useCountdown(endsAt) {
  const [left, setLeft] = useState(() => computeLeft(endsAt));
  useEffect(() => {
    if (!endsAt) return undefined;
    const id = setInterval(() => setLeft(computeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}
function computeLeft(endsAt) {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: false };
}
const pad = (n) => String(n).padStart(2, '0');

function paletteFor(dark, accent) {
  return dark
    ? { bar: '#0B0B0D', card: '#16161A', border: 'rgba(245,242,236,0.14)', text: '#F5F2EC', sub: '#A09A92', chip: '#1E1E24', accent, ctaInk: '#16120C' }
    : { bar: '#1A1714', card: '#FFFFFF', border: 'rgba(0,0,0,0.10)', text: '#1A1714', sub: '#5C544D', chip: '#F1EDE3', accent, ctaInk: '#FFFFFF' };
}

function useBannerCta(banner) {
  const navigate = useNavigate();
  const { openContact } = useContactModal();
  return () => {
    if (!banner) return;
    if (banner.cta_mode === 'url' && banner.cta_url) {
      const url = banner.cta_url;
      if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener');
      else navigate(url);
    } else if (banner.cta_mode === 'register') {
      navigate('/auth?mode=register&role=client');
    } else {
      openContact({ source: 'banner', bannerId: banner.id, title: banner.title, subtitle: banner.subtitle });
    }
  };
}

export default function PromoBanner({ slot = 'hero' }) {
  const { theme } = useTheme();
  const dark = theme !== 'light';
  const [banner, setBanner] = useState(undefined);
  const [dismissed, setDismissed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchActiveBanner().then((b) => { if (mounted.current) setBanner(b); });
    return () => { mounted.current = false; };
  }, []);

  const endsAt = banner?.show_countdown ? banner?.ends_at : null;
  const left = useCountdown(endsAt);
  const onCta = useBannerCta(banner);

  if (!banner) return null;
  const placement = banner.placement || 'both';
  const showsTop = placement === 'top_bar' || placement === 'both';
  const showsHero = placement === 'hero_card' || placement === 'both';
  if (slot === 'top' && !showsTop) return null;
  if (slot === 'hero' && !showsHero) return null;
  if (left?.done) return null; // expired locally

  const accent = banner.accent || '#D4A574';
  const pal = paletteFor(dark, accent);
  const ctaText = banner.cta_text || 'Learn more';

  // ─── TOP BAR ───────────────────────────────────────────────────────────────
  if (slot === 'top') {
    const dismissKey = `promo_dismissed_${banner.id}_${banner.updated_at || ''}`;
    if (dismissed) return null;
    try { if (localStorage.getItem(dismissKey) === '1') return null; } catch (_e) { /* ignore */ }

    return (
      <div
        data-testid="promo-top-bar"
        style={{
          position: 'relative', width: '100%', background: pal.bar,
          borderBottom: `1px solid ${accent}55`, color: '#F5F2EC',
          overflow: 'hidden', animation: 'promo-slidedown 420ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <style>{promoKeyframes}</style>
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${accent}22, transparent)`, backgroundSize: '200% 100%', animation: 'promo-shimmer 4s linear infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '9px 44px 9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13.5 }}>
          {banner.badge ? (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: accent, border: `1px solid ${accent}66`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase' }}>{banner.badge}</span>
          ) : null}
          <span style={{ fontWeight: 600 }}>{banner.title}</span>
          {(banner.price || banner.old_price) ? (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
              {banner.old_price ? <s style={{ color: 'rgba(245,242,236,0.45)' }}>{banner.currency}{banner.old_price}</s> : null}
              {banner.price ? <b style={{ color: accent }}>{banner.currency}{banner.price}</b> : null}
            </span>
          ) : null}
          {left && banner.show_countdown ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'IBM Plex Mono', monospace", color: accent }}>
              <Clock size={13} />{left.d > 0 ? `${left.d}d ` : ''}{pad(left.h)}:{pad(left.m)}:{pad(left.s)}
            </span>
          ) : null}
          <button
            onClick={onCta}
            data-testid="promo-top-cta"
            style={{ background: accent, color: pal.ctaInk, border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {ctaText}<ArrowUpRight size={14} />
          </button>
        </div>
        <button
          onClick={() => { setDismissed(true); try { localStorage.setItem(dismissKey, '1'); } catch (_e) { /* ignore */ } }}
          data-testid="promo-top-dismiss"
          aria-label="Dismiss"
          style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(245,242,236,0.6)', cursor: 'pointer', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // ─── HERO CARD ───────────────────────────────────────────────────────────────
  return (
    <div data-testid="promo-hero-wrap" style={{ padding: '0 32px', maxWidth: 1240, margin: '24px auto 0' }}>
      <style>{promoKeyframes}</style>
      <div
        data-testid="promo-hero-card"
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 18,
          background: pal.card, border: `1px solid ${accent}55`,
          padding: '24px 28px',
          boxShadow: dark ? `0 18px 50px rgba(0,0,0,0.30), 0 0 0 1px ${accent}18` : `0 16px 40px rgba(0,0,0,0.08)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap',
          animation: 'promo-rise 520ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <span aria-hidden style={{ position: 'absolute', top: -80, right: -40, width: 280, height: 280, borderRadius: 999, background: `radial-gradient(circle, ${accent}22, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', flex: '1 1 380px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            {banner.badge ? (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: accent, border: `1px solid ${accent}66`, background: `${accent}14`, borderRadius: 4, padding: '3px 8px', textTransform: 'uppercase' }}>{banner.badge}</span>
            ) : null}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '0.08em', color: pal.sub, textTransform: 'uppercase' }}>
              <Lock size={11} /> {banner.type === 'discount' ? 'OFFER' : banner.type === 'app' ? 'APP' : banner.type === 'announcement' ? 'NEWS' : 'SPECIAL'}
            </span>
          </div>

          <h3 style={{ color: pal.text, fontSize: 'clamp(22px,2.6vw,30px)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px', lineHeight: 1.1 }}>{banner.title}</h3>
          {banner.subtitle ? <p style={{ color: pal.sub, fontSize: 15, lineHeight: 1.5, margin: '0 0 14px', maxWidth: 560 }}>{banner.subtitle}</p> : null}

          {Array.isArray(banner.features) && banner.features.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {banner.features.map((f, i) => (
                <span key={i} style={{ fontSize: 12.5, color: pal.text, background: pal.chip, border: `1px solid ${pal.border}`, borderRadius: 7, padding: '5px 10px' }}>{f}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ position: 'relative', flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, minWidth: 180 }}>
          {(banner.price || banner.old_price) ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              {banner.old_price ? <s style={{ color: pal.sub, fontSize: 18 }}>{banner.currency}{banner.old_price}</s> : null}
              {banner.price ? <span style={{ color: pal.text, fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.03em', lineHeight: 1 }}>{banner.currency}{banner.price}</span> : null}
            </div>
          ) : null}

          {left && banner.show_countdown ? (
            <div data-testid="promo-hero-countdown" style={{ display: 'flex', gap: 8 }}>
              {[['d', left.d], ['h', left.h], ['m', left.m], ['s', left.s]].map(([u, v]) => (
                <div key={u} style={{ textAlign: 'center', background: pal.chip, border: `1px solid ${pal.border}`, borderRadius: 8, padding: '6px 9px', minWidth: 42 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 17, color: pal.text, lineHeight: 1 }}>{pad(v)}</div>
                  <div style={{ fontSize: 9, letterSpacing: '0.08em', color: pal.sub, marginTop: 3, textTransform: 'uppercase' }}>{u}</div>
                </div>
              ))}
            </div>
          ) : null}

          <button
            onClick={onCta}
            data-testid="promo-hero-cta"
            style={{ background: accent, color: pal.ctaInk, border: 'none', borderRadius: 11, padding: '13px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 22px ${accent}40` }}
          >
            {ctaText}<ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const promoKeyframes = `
  @keyframes promo-slidedown { from { transform: translateY(-100%); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes promo-rise { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
  @keyframes promo-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
`;
