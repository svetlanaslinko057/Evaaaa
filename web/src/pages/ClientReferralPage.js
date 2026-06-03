import { useState, useEffect } from 'react';
import { useLang } from '../contexts/LanguageContext';
import { useAuth, API } from '@/App';
import { runtime } from '@/runtime';
import { ApiError } from '@/runtime-client';
import {
  Gift,
  Copy,
  CheckCircle2,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  ExternalLink,
  ArrowUpRight,
  Star,
  Shield,
  Zap,
  Crown,
  Award,
  Trophy
} from 'lucide-react';

const ClientReferralPage = () => {
  const { t, tByEn } = useLang();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const res = await runtime.get(`/api/referral/dashboard`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const referralUrl = data?.link?.code
    ? `${window.location.origin}/client/auth?ref=${data.link.code}`
    : null;

  const handleCopy = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tierConfig = {
    basic: { label: 'Basic', color: 'text-muted-foreground', bg: 'bg-muted', rate: '5%', icon: Star },
    client: { label: 'Client', color: 'text-signal', bg: 'bg-signal/10', rate: '7%', icon: Shield },
    trusted: { label: 'Trusted Partner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', rate: '10%', icon: Zap },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTier = tierConfig[data?.current_tier || 'basic'];
  const CurrentTierIcon = currentTier.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-8" data-testid="client-referral-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-signal/15">
            <Gift className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tByEn('Referral Program')}</h1>
            <p className="text-sm text-muted-foreground">{tByEn('Earn commission by inviting new clients')}</p>
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-600/40 bg-emerald-500/15 dark:border-emerald-800/30 dark:bg-emerald-500/5 p-5" data-testid="available-balance">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400/70 mb-2">
            <DollarSign className="w-4 h-4" />
            {tByEn('Available')}
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
            ${(data?.wallet?.available_balance || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-600/40 bg-amber-500/15 dark:border-amber-800/30 dark:bg-amber-500/5 p-5" data-testid="pending-balance">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400/70 mb-2">
            <Clock className="w-4 h-4" />
            {tByEn('Pending')}
          </div>
          <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
            ${(data?.wallet?.pending_balance || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/50 dark:bg-card p-5" data-testid="lifetime-earned">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            {tByEn('Lifetime')}
          </div>
          <div className="text-3xl font-bold text-foreground">
            ${(data?.wallet?.lifetime_earned || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/50 dark:bg-card p-5" data-testid="total-referrals">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            {tByEn('Referrals')}
          </div>
          <div className="text-3xl font-bold text-foreground">
            {data?.total_referrals || 0}
          </div>
        </div>
      </div>

      {/* Referral Link + Tier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Referral Link */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6" data-testid="referral-link-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            {tByEn('Your Referral Link')}
          </h3>
          {referralUrl ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground truncate font-mono">
                {referralUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-black hover:bg-muted'
                }`}
                data-testid="copy-link-btn"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {tByEn('Copied!')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {tByEn('Copy')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{tByEn('Loading your referral link...')}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{tByEn('Clicks')}: {data?.link?.clicks || 0}</span>
            <span>{tByEn('Conversions')}: {data?.link?.conversions || 0}</span>
          </div>
        </div>

        {/* Client Tier - Enhanced */}
        <div className="rounded-2xl border border-border bg-card p-6" data-testid="tier-card">
          <h3 className="font-semibold mb-3">{tByEn('Your Status Tier')}</h3>
          {data?.client_tier ? (() => {
            const ct = data.client_tier;
            const tierIconMap = {
              catalyst: <Crown className="w-6 h-6 text-amber-400" />,
              alliance: <Award className="w-6 h-6 text-signal" />,
              advocate: <Zap className="w-6 h-6 text-signal" />,
              partner: <Shield className="w-6 h-6 text-emerald-400" />,
              starter: <Star className="w-6 h-6 text-muted-foreground" />,
            };
            const tierColorMap = {
              catalyst: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              alliance: 'bg-signal/10 border-signal/20 text-signal',
              advocate: 'bg-signal/10 border-signal/20 text-signal',
              partner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              starter: 'bg-muted border-border text-muted-foreground',
            };
            const tc = tierColorMap[ct.tier] || tierColorMap.starter;
            return (
              <>
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${tc}`}>
                  {tierIconMap[ct.tier] || tierIconMap.starter}
                  <div>
                    <div className="font-bold capitalize text-lg">{ct.tier}</div>
                    <div className="text-xs opacity-70">
                      {(ct.benefits?.commission_rate * 100).toFixed(0)}% commission &middot; {ct.benefits?.discount_percent}% discount
                    </div>
                  </div>
                </div>
                {ct.next_tier && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {tByEn('Next:')} <span className="text-foreground capitalize font-medium">{ct.next_tier.name}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{tByEn('Revenue')}</span>
                        <span>${Math.round(ct.metrics?.revenue || 0)} / ${ct.next_tier.revenue_needed}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-signal transition-all"
                          // presentation-only: CSS progress-bar visual width clamp [0..100]
                          style={{ width: `${Math.min(100, ((ct.metrics?.revenue || 0) / ct.next_tier.revenue_needed) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>{tByEn('Referrals')}</span>
                        <span>{ct.metrics?.referrals_count || 0} / {ct.next_tier.referrals_needed}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-signal transition-all"
                          // presentation-only: CSS progress-bar visual width clamp [0..100]
                          style={{ width: `${Math.min(100, ((ct.metrics?.referrals_count || 0) / ct.next_tier.referrals_needed) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )}
                {/* All tiers */}
                {data.all_client_tiers && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex gap-1">
                      {data.all_client_tiers.map((t) => (
                        <div key={t.name} className={`flex-1 py-1 px-1 rounded text-center text-[9px] font-medium capitalize ${
                          t.name === ct.tier ? 'bg-signal/20 text-signal border border-signal/30' : 'bg-muted/50 text-muted-foreground'
                        }`}>{t.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })() : (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${currentTier.bg} border border-border`}>
              <CurrentTierIcon className={`w-6 h-6 ${currentTier.color}`} />
              <div>
                <div className={`font-semibold ${currentTier.color}`}>{currentTier.label}</div>
                <div className="text-xs text-muted-foreground">{tByEn('Commission:')} {currentTier.rate}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Referrals Table */}
      <div className="rounded-2xl border border-border bg-card p-6" data-testid="referrals-table">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          {tByEn('Your Referrals')}
        </h3>
        {data?.referrals?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">{tByEn('Person')}</th>
                  <th className="pb-3 font-medium">{tByEn('Rate')}</th>
                  <th className="pb-3 font-medium">{tByEn('Earned')}</th>
                  <th className="pb-3 font-medium">{tByEn('Payouts')}</th>
                  <th className="pb-3 font-medium">{tByEn('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((ref) => (
                  <tr key={ref.referral_id} className="border-b border-border/50">
                    <td className="py-3">
                      <div className="font-medium text-foreground">{ref.referred_name}</div>
                      <div className="text-xs text-muted-foreground">{ref.referred_email}</div>
                    </td>
                    <td className="py-3 text-muted-foreground">{(ref.commission_rate * 100).toFixed(0)}%</td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-medium">${ref.total_earned}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">{ref.payouts_count}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        ref.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{tByEn('No referrals yet. Share your link to start earning!')}</p>
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      {data?.payouts?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6" data-testid="payouts-history">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            {tByEn('Recent Payouts')}
          </h3>
          <div className="space-y-2">
            {data.payouts.map((p) => (
              <div key={p.payout_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <span className="text-sm text-foreground font-medium">${p.amount}</span>
                  <span className="text-xs text-muted-foreground ml-2">from ${p.source_invoice_amount} invoice</span>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                  p.status === 'approved' ? 'bg-signal/10 text-signal' :
                  p.status === 'accrued' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">{tByEn('How it works')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: tByEn('Share'),   desc: tByEn('Share your referral link with potential clients') },
            { step: '2', title: tByEn('Sign Up'), desc: tByEn('They sign up and submit a project idea') },
            { step: '3', title: tByEn('Project'), desc: tByEn('Project is completed and invoice is paid') },
            { step: '4', title: tByEn('Earn'),    desc: tByEn('You automatically earn commission from each payment') },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-signal/10 flex items-center justify-center text-sm font-bold text-signal flex-shrink-0">
                {s.step}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientReferralPage;
