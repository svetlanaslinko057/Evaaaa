/**
 * AdminMarketingPage — configure the site promo banner + view contact leads.
 * Bilingual UK/EN (driven by useLang().lang). Theme-aware via design tokens.
 * Banner content itself is free-text (any language).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, Save, Trash2, Plus, Power, Eye, Inbox, RefreshCw, Check, ArrowUpRight, Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { useLang } from '@/contexts/LanguageContext';

const L = {
  pageTitle: { en: 'Marketing · Promo banner', uk: 'Маркетинг · Промо-банер' },
  pageSub: { en: 'Configure the site banner and special offers. One banner is active at a time.', uk: 'Налаштуйте банер сайту та спецпропозиції. Активний лише один банер.' },
  tabBanner: { en: 'Banner', uk: 'Банер' },
  tabLeads: { en: 'Requests', uk: 'Заявки' },
  newBanner: { en: 'New banner', uk: 'Новий банер' },
  existing: { en: 'Saved banners', uk: 'Збережені банери' },
  none: { en: 'No banners yet.', uk: 'Банерів ще немає.' },
  active: { en: 'ACTIVE', uk: 'АКТИВНИЙ' },
  enabled: { en: 'Enabled (show on site)', uk: 'Увімкнено (показувати на сайті)' },
  enabledHint: { en: 'Turning on deactivates any other active banner.', uk: 'Увімкнення вимикає інший активний банер.' },
  type: { en: 'Type', uk: 'Тип' },
  tDiscount: { en: 'Discount', uk: 'Знижка' },
  tSpecial: { en: 'Special offer', uk: 'Спецпропозиція' },
  tAnnounce: { en: 'Announcement', uk: 'Анонс' },
  tApp: { en: 'App promo', uk: 'Промо застосунку' },
  placement: { en: 'Placement', uk: 'Розміщення' },
  pTop: { en: 'Top bar (thin)', uk: 'Верхня смуга (тонка)' },
  pHero: { en: 'Hero card (rich)', uk: 'Картка в hero (велика)' },
  pBoth: { en: 'Both', uk: 'Обидва' },
  placementHint: { en: 'Top bar is subtle; hero card sells with conditions + price.', uk: 'Верхня смуга — ненав’язлива; hero-картка продає з умовами + ціною.' },
  title: { en: 'Title', uk: 'Заголовок' },
  titlePh: { en: 'Landing + Telegram bot', uk: 'Landing + Telegram-бот' },
  subtitle: { en: 'Subtitle', uk: 'Підзаголовок' },
  subtitlePh: { en: 'Special offer this week', uk: 'Спеціальна пропозиція цього тижня' },
  features: { en: 'Conditions (one per line)', uk: 'Умови (по одному в рядку)' },
  featuresPh: { en: 'Design\nSEO\nTelegram bot\nMobile-first\nPayment + support', uk: 'Дизайн\nSEO\nTelegram-бот\nMobile-first\nОплата + підтримка' },
  price: { en: 'Price', uk: 'Ціна' },
  oldPrice: { en: 'Old price', uk: 'Стара ціна' },
  currency: { en: 'Currency', uk: 'Валюта' },
  starts: { en: 'Starts at', uk: 'Початок' },
  ends: { en: 'Ends at', uk: 'Кінець' },
  countdown: { en: 'Show live countdown', uk: 'Показувати таймер відліку' },
  countdownHint: { en: 'Counts down to the end date (e.g. 72 hours).', uk: 'Відлік до дати завершення (напр. 72 години).' },
  ctaText: { en: 'Button text', uk: 'Текст кнопки' },
  ctaTextPh: { en: 'Leave a request', uk: 'Залишити заявку' },
  ctaMode: { en: 'Button action', uk: 'Дія кнопки' },
  ctaContact: { en: 'Open request modal', uk: 'Відкрити форму заявки' },
  ctaRegister: { en: 'Go to registration', uk: 'Перейти до реєстрації' },
  ctaUrl: { en: 'Custom link / Telegram', uk: 'Власне посилання / Telegram' },
  ctaUrlField: { en: 'Link URL', uk: 'URL посилання' },
  accent: { en: 'Accent colour', uk: 'Акцентний колір' },
  badge: { en: 'Badge (small label)', uk: 'Бейдж (мала позначка)' },
  badgePh: { en: 'LIMITED', uk: 'LIMITED' },
  visibility: { en: 'Visibility', uk: 'Видимість' },
  showWeb: { en: 'Show on website', uk: 'Показувати на сайті' },
  showExpo: { en: 'Show in Expo app', uk: 'Показувати в Expo-застосунку' },
  save: { en: 'Save banner', uk: 'Зберегти банер' },
  saving: { en: 'Saving…', uk: 'Збереження…' },
  saved: { en: 'Saved', uk: 'Збережено' },
  preview: { en: 'Live preview', uk: 'Перегляд' },
  edit: { en: 'Edit', uk: 'Редагувати' },
  del: { en: 'Delete', uk: 'Видалити' },
  confirmDel: { en: 'Delete this banner?', uk: 'Видалити цей банер?' },
  leadsTitle: { en: 'Contact requests', uk: 'Заявки на зв’язок' },
  leadsNew: { en: 'new', uk: 'нових' },
  noLeads: { en: 'No requests yet.', uk: 'Заявок ще немає.' },
  markHandled: { en: 'Mark handled', uk: 'Опрацьовано' },
  refresh: { en: 'Refresh', uk: 'Оновити' },
  colName: { en: 'Name', uk: 'Ім’я' },
  colContact: { en: 'Contact', uk: 'Контакт' },
  colMsg: { en: 'Message', uk: 'Повідомлення' },
  colSrc: { en: 'Source', uk: 'Джерело' },
  colDate: { en: 'Date', uk: 'Дата' },
  colStatus: { en: 'Status', uk: 'Статус' },
};

const EMPTY = {
  enabled: false, type: 'special', placement: 'both',
  title: '', subtitle: '', features: [],
  price: '', old_price: '', currency: '$',
  starts_at: null, ends_at: null, show_countdown: true,
  cta_text: '', cta_mode: 'contact', cta_url: '',
  accent: '#D4A574', badge: '', show_on_web: true, show_in_expo: false,
};

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export default function AdminMarketingPage() {
  const { lang } = useLang();
  const tr = (k) => (L[k] ? (L[k][lang] || L[k].en) : k);

  const [tab, setTab] = useState('banner');
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadsMeta, setLeadsMeta] = useState({ total: 0, new: 0 });

  const loadBanners = async () => {
    try { const d = await api.get('/admin/banners'); setBanners(d.banners || []); } catch (_e) { /* ignore */ }
  };
  const loadLeads = async () => {
    try { const d = await api.get('/admin/contact-leads'); setLeads(d.leads || []); setLeadsMeta({ total: d.total || 0, new: d.new || 0 }); } catch (_e) { /* ignore */ }
  };
  useEffect(() => { loadBanners(); loadLeads(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm(EMPTY); setEditId(null); };
  const startEdit = (b) => {
    setForm({ ...EMPTY, ...b, features: Array.isArray(b.features) ? b.features : [] });
    setEditId(b.id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: (form.features || []).filter((x) => (x || '').trim()),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editId) await api.put(`/admin/banners/${editId}`, payload);
      else { const created = await api.post('/admin/banners', payload); setEditId(created.id); }
      setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800);
      await loadBanners();
    } catch (_e) { /* ignore */ } finally { setSaving(false); }
  };

  const toggle = async (b) => { try { await api.post(`/admin/banners/${b.id}/toggle`); await loadBanners(); } catch (_e) { /* ignore */ } };
  const remove = async (b) => {
    if (!window.confirm(tr('confirmDel'))) return;
    try { await api.delete(`/admin/banners/${b.id}`); if (editId === b.id) startNew(); await loadBanners(); } catch (_e) { /* ignore */ }
  };
  const markHandled = async (id) => { try { await api.patch(`/admin/contact-leads/${id}`, { status: 'handled' }); await loadLeads(); } catch (_e) { /* ignore */ } };

  // ─── styles via design tokens ─────────────────────────────────────────────
  const card = { background: 'var(--token-surface)', border: '1px solid var(--token-border)', borderRadius: 16 };
  const field = { width: '100%', background: 'var(--token-surface-elevated)', border: '1px solid var(--token-border)', borderRadius: 10, padding: '10px 12px', color: 'var(--token-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--token-muted)', fontWeight: 600, marginBottom: 6, display: 'block' };
  const hint = { fontSize: 11.5, color: 'var(--token-muted)', marginTop: 5, lineHeight: 1.4 };

  const Toggle = ({ k, label, hintKey }) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
      <input type="checkbox" data-testid={`banner-${k}`} checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: form.accent }} />
      <span>
        <span style={{ color: 'var(--token-primary)', fontSize: 13.5, fontWeight: 500 }}>{label}</span>
        {hintKey ? <span style={hint}>{tr(hintKey)}</span> : null}
      </span>
    </label>
  );

  const preview = useMemo(() => form, [form]);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto" data-testid="admin-marketing-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Megaphone className="w-6 h-6" style={{ color: form.accent }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--token-primary)' }}>{tr('pageTitle')}</h1>
      </div>
      <p style={{ color: 'var(--token-muted)', fontSize: 14, marginBottom: 22 }}>{tr('pageSub')}</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[['banner', tr('tabBanner'), null], ['leads', tr('tabLeads'), leadsMeta.new]].map(([id, label, badge]) => (
          <button
            key={id}
            data-testid={`tab-${id}`}
            onClick={() => setTab(id)}
            style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${tab === id ? form.accent : 'var(--token-border)'}`,
              background: tab === id ? `${form.accent}1A` : 'transparent',
              color: tab === id ? 'var(--token-primary)' : 'var(--token-muted)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {id === 'leads' ? <Inbox className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
            {label}
            {badge ? <span style={{ background: form.accent, color: '#16120C', borderRadius: 99, fontSize: 11, padding: '1px 7px', fontWeight: 700 }}>{badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'banner' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }} className="marketing-grid">
          {/* FORM */}
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--token-primary)' }}>{editId ? tr('edit') : tr('newBanner')}</h2>
              {editId ? <button onClick={startNew} data-testid="banner-new-btn" style={{ fontSize: 12.5, color: form.accent, background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Plus className="w-4 h-4" />{tr('newBanner')}</button> : null}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...card, padding: 14, background: 'var(--token-surface-elevated)' }}>
                <Toggle k="enabled" label={tr('enabled')} hintKey="enabledHint" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>{tr('type')}</label>
                  <select data-testid="banner-type" style={field} value={form.type} onChange={(e) => set('type', e.target.value)}>
                    <option value="discount">{tr('tDiscount')}</option>
                    <option value="special">{tr('tSpecial')}</option>
                    <option value="announcement">{tr('tAnnounce')}</option>
                    <option value="app">{tr('tApp')}</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>{tr('placement')}</label>
                  <select data-testid="banner-placement" style={field} value={form.placement} onChange={(e) => set('placement', e.target.value)}>
                    <option value="top_bar">{tr('pTop')}</option>
                    <option value="hero_card">{tr('pHero')}</option>
                    <option value="both">{tr('pBoth')}</option>
                  </select>
                  <div style={hint}>{tr('placementHint')}</div>
                </div>
              </div>

              <div>
                <label style={lbl}>{tr('title')}</label>
                <input data-testid="banner-title" style={field} value={form.title} placeholder={tr('titlePh')} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>{tr('subtitle')}</label>
                <input data-testid="banner-subtitle" style={field} value={form.subtitle} placeholder={tr('subtitlePh')} onChange={(e) => set('subtitle', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>{tr('features')}</label>
                <textarea
                  data-testid="banner-features"
                  style={{ ...field, minHeight: 96, resize: 'vertical', fontFamily: 'inherit' }}
                  value={(form.features || []).join('\n')}
                  placeholder={tr('featuresPh')}
                  onChange={(e) => set('features', e.target.value.split('\n'))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 14 }}>
                <div><label style={lbl}>{tr('price')}</label><input data-testid="banner-price" style={field} value={form.price} placeholder="150" onChange={(e) => set('price', e.target.value)} /></div>
                <div><label style={lbl}>{tr('oldPrice')}</label><input data-testid="banner-oldprice" style={field} value={form.old_price} placeholder="300" onChange={(e) => set('old_price', e.target.value)} /></div>
                <div><label style={lbl}>{tr('currency')}</label><input data-testid="banner-currency" style={field} value={form.currency} onChange={(e) => set('currency', e.target.value)} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>{tr('starts')}</label><input type="datetime-local" data-testid="banner-starts" style={field} value={toLocalInput(form.starts_at)} onChange={(e) => set('starts_at', fromLocalInput(e.target.value))} /></div>
                <div><label style={lbl}>{tr('ends')}</label><input type="datetime-local" data-testid="banner-ends" style={field} value={toLocalInput(form.ends_at)} onChange={(e) => set('ends_at', fromLocalInput(e.target.value))} /></div>
              </div>
              <div style={{ ...card, padding: 14, background: 'var(--token-surface-elevated)' }}>
                <Toggle k="show_countdown" label={tr('countdown')} hintKey="countdownHint" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>{tr('ctaText')}</label>
                  <input data-testid="banner-cta-text" style={field} value={form.cta_text} placeholder={tr('ctaTextPh')} onChange={(e) => set('cta_text', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>{tr('ctaMode')}</label>
                  <select data-testid="banner-cta-mode" style={field} value={form.cta_mode} onChange={(e) => set('cta_mode', e.target.value)}>
                    <option value="contact">{tr('ctaContact')}</option>
                    <option value="register">{tr('ctaRegister')}</option>
                    <option value="url">{tr('ctaUrl')}</option>
                  </select>
                </div>
              </div>
              {form.cta_mode === 'url' && (
                <div><label style={lbl}>{tr('ctaUrlField')}</label><input data-testid="banner-cta-url" style={field} value={form.cta_url} placeholder="https://t.me/yourbot" onChange={(e) => set('cta_url', e.target.value)} /></div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>{tr('accent')}</label>
                  <input type="color" data-testid="banner-accent" value={form.accent} onChange={(e) => set('accent', e.target.value)} style={{ ...field, height: 42, padding: 4, cursor: 'pointer' }} />
                </div>
                <div><label style={lbl}>{tr('badge')}</label><input data-testid="banner-badge" style={field} value={form.badge} placeholder={tr('badgePh')} onChange={(e) => set('badge', e.target.value)} /></div>
              </div>

              <div style={{ ...card, padding: 14, background: 'var(--token-surface-elevated)' }}>
                <label style={{ ...lbl, marginBottom: 10 }}>{tr('visibility')}</label>
                <Toggle k="show_on_web" label={tr('showWeb')} />
                <Toggle k="show_in_expo" label={tr('showExpo')} />
              </div>

              <button
                onClick={save}
                disabled={saving}
                data-testid="banner-save-btn"
                style={{ background: form.accent, color: '#16120C', border: 'none', borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? tr('saving') : savedFlash ? tr('saved') : tr('save')}
              </button>
            </div>
          </div>

          {/* PREVIEW + LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Eye className="w-4 h-4" style={{ color: 'var(--token-muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--token-primary)' }}>{tr('preview')}</span>
              </div>
              <PreviewCard b={preview} />
            </div>

            <div style={{ ...card, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--token-primary)', marginBottom: 12 }}>{tr('existing')}</h3>
              {banners.length === 0 ? (
                <p style={{ color: 'var(--token-muted)', fontSize: 13 }}>{tr('none')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {banners.map((b) => (
                    <div key={b.id} data-testid={`banner-row-${b.id}`} style={{ ...card, padding: 12, background: 'var(--token-surface-elevated)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 99, background: b.enabled ? '#3FB950' : 'var(--token-border)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--token-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--token-muted)' }}>{b.type} · {b.placement}{b.enabled ? ` · ${tr('active')}` : ''}</div>
                      </div>
                      <button onClick={() => toggle(b)} title="toggle" data-testid={`banner-toggle-${b.id}`} style={iconBtn(b.enabled ? '#3FB950' : 'var(--token-muted)')}><Power className="w-4 h-4" /></button>
                      <button onClick={() => startEdit(b)} title={tr('edit')} data-testid={`banner-edit-${b.id}`} style={iconBtn('var(--token-muted)')}><RefreshCw className="w-4 h-4" /></button>
                      <button onClick={() => remove(b)} title={tr('del')} data-testid={`banner-del-${b.id}`} style={iconBtn('#E5645B')}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'leads' && (
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--token-primary)' }}>
              {tr('leadsTitle')} <span style={{ color: 'var(--token-muted)', fontWeight: 500 }}>· {leadsMeta.total} ({leadsMeta.new} {tr('leadsNew')})</span>
            </h2>
            <button onClick={loadLeads} data-testid="leads-refresh" style={{ ...iconBtn('var(--token-muted)'), display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '7px 12px', fontSize: 13 }}><RefreshCw className="w-4 h-4" />{tr('refresh')}</button>
          </div>
          {leads.length === 0 ? (
            <p style={{ color: 'var(--token-muted)', fontSize: 13 }}>{tr('noLeads')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} data-testid="leads-table">
                <thead>
                  <tr style={{ color: 'var(--token-muted)', textAlign: 'left' }}>
                    {['colName', 'colContact', 'colMsg', 'colSrc', 'colDate', 'colStatus'].map((c) => (
                      <th key={c} style={{ padding: '8px 10px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--token-border)' }}>{tr(c)}</th>
                    ))}
                    <th style={{ borderBottom: '1px solid var(--token-border)' }} />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} data-testid={`lead-row-${l.id}`} style={{ color: 'var(--token-primary)' }}>
                      <td style={td}>{l.name || '—'}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{l.contact || '—'}</td>
                      <td style={{ ...td, maxWidth: 240, color: 'var(--token-muted)' }}>{l.message || '—'}</td>
                      <td style={td}>{l.source || '—'}</td>
                      <td style={{ ...td, color: 'var(--token-muted)', whiteSpace: 'nowrap' }}>{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                      <td style={td}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: l.status === 'new' ? '#3FB95022' : 'var(--token-border)', color: l.status === 'new' ? '#3FB950' : 'var(--token-muted)' }}>{l.status}</span>
                      </td>
                      <td style={td}>
                        {l.status === 'new' ? <button onClick={() => markHandled(l.id)} data-testid={`lead-handle-${l.id}`} style={{ fontSize: 12, color: 'var(--token-muted)', background: 'transparent', border: '1px solid var(--token-border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{tr('markHandled')}</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@media (max-width: 920px){ .marketing-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

const iconBtn = (color) => ({ background: 'transparent', border: '1px solid var(--token-border)', borderRadius: 8, padding: 7, color, cursor: 'pointer', flexShrink: 0 });
const td = { padding: '10px', borderBottom: '1px solid var(--token-border)', verticalAlign: 'top' };

// Compact live preview that mirrors the hero-card look.
function PreviewCard({ b }) {
  const accent = b.accent || '#D4A574';
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${accent}55`, background: 'var(--token-surface-elevated)', padding: 18, position: 'relative', overflow: 'hidden' }}>
      <span aria-hidden style={{ position: 'absolute', top: -60, right: -30, width: 180, height: 180, borderRadius: 999, background: `radial-gradient(circle, ${accent}22, transparent 70%)` }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {b.badge ? <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', color: accent, border: `1px solid ${accent}66`, borderRadius: 4, padding: '2px 7px' }}>{b.badge}</span> : null}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--token-primary)', lineHeight: 1.15 }}>{b.title || '—'}</div>
      {b.subtitle ? <div style={{ fontSize: 13, color: 'var(--token-muted)', marginTop: 4 }}>{b.subtitle}</div> : null}
      {Array.isArray(b.features) && b.features.filter((x) => x.trim()).length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {b.features.filter((x) => x.trim()).map((f, i) => (
            <span key={i} style={{ fontSize: 11.5, color: 'var(--token-primary)', background: 'var(--token-surface)', border: '1px solid var(--token-border)', borderRadius: 6, padding: '3px 8px' }}>{f}</span>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {b.old_price ? <s style={{ color: 'var(--token-muted)', fontSize: 15 }}>{b.currency}{b.old_price}</s> : null}
          {b.price ? <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--token-primary)', letterSpacing: '-0.02em' }}>{b.currency}{b.price}</span> : null}
        </div>
        {b.cta_text ? <span style={{ background: accent, color: '#16120C', borderRadius: 9, padding: '9px 16px', fontSize: 13.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{b.cta_text}<ArrowUpRight size={14} /></span> : null}
      </div>
      {b.show_countdown && b.ends_at ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: accent, fontFamily: 'monospace' }}>
          <Clock size={12} /> {new Date(b.ends_at).toLocaleString()}
        </div>
      ) : null}
    </div>
  );
}
