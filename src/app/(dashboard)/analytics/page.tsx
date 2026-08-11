'use client';

import ErrorState from '@/src/components/ui/ErrorState';
import StageLoadAnalytics from '@/src/components/analytics/StageLoadAnalytics';
import { useGetAnalyticsQuery } from '@/src/services/api/analyticsApi';
import type { RootState } from '@/src/lib/store';
import { useSelector } from 'react-redux';
import {useTranslations} from 'next-intl';

const metricIcons = {
    completed: <path d="m5 12 4 4L19 6" />,
    progress: <><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /><circle cx="12" cy="12" r="3" /></>,
    overdue: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    average: <><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></>,
};

function DashboardMetric({ title, value, change, positive, icon }: { title: string; value: string; change: string; positive: boolean; icon: keyof typeof metricIcons }) {
    const t = useTranslations('analytics');
    return (
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/40">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">{title}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-violet-50 group-hover:text-violet-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">{metricIcons[icon]}</svg>
                </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
            <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
                <span>{positive ? '↗' : '↘'} {change}</span>
                <span className="font-normal text-slate-400">{t('versusPrevious')}</span>
            </div>
        </article>
    );
}

function MaterialDistribution({ shares }: { shares: Record<string, number> }) {
    const t = useTranslations('analytics.materials');
    const colors = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
    const items = Object.entries(shares).map(([name, value], index) => ({ name, value: Math.max(0, value), color: colors[index % colors.length] })).sort((a, b) => b.value - a.value);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const gradient = items.map((item, index) => {
        const previous = items.slice(0, index).reduce((sum, current) => sum + current.value, 0);
        const start = total ? (previous / total) * 100 : 0;
        const end = total ? ((previous + item.value) / total) * 100 : 0;
        return `${item.color} ${start}% ${end}%`;
    }).join(', ');

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">{t('title')}</h2>
            <p className="mt-1 text-xs text-slate-400">{t('subtitle')}</p>
            {items.length ? (
                <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row xl:flex-col 2xl:flex-row">
                    <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={t('distribution')}>
                        <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                            <span className="text-2xl font-bold text-slate-950">{total}</span>
                            <span className="text-[11px] text-slate-400">{t('total')}</span>
                        </div>
                    </div>
                    <div className="grid w-full gap-3">
                        {items.slice(0, 6).map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="min-w-0 flex-1 truncate text-slate-600" title={item.name}>{item.name}</span>
                                <span className="font-semibold text-slate-900">{total ? Math.round(item.value / total * 100) : 0}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <p className="mt-16 text-center text-sm text-slate-400">{t('empty')}</p>}
        </section>
    );
}

function formatChange(value: number, suffix = '') { return `${value > 0 ? '+' : ''}${value}${suffix}`; }

export default function AnalyticsPage() {
    const t = useTranslations('analytics');
    const { data, isLoading, isFetching, isError, refetch } = useGetAnalyticsQuery();
    const userId = useSelector((state: RootState) => state.auth.id);

    if (isLoading) return <div className="space-y-4" aria-busy="true"><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="h-[420px] animate-pulse rounded-2xl bg-slate-200" /></div>;

    if (isError || !data) return <ErrorState title={t('unavailable')} onRetry={() => void refetch()} isRetrying={isFetching}>{t('loadError')}</ErrorState>;

    const paidShare = data.totalOrdersCount > 0 ? Math.round((data.paidOrdersCount / data.totalOrdersCount) * 100) : 0;

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">{t('title')}</h1><p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p></div>
                <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-60">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>{isFetching ? t('refreshing') : t('refresh')}
                </button>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardMetric title={t('metrics.completedMonth')} value={String(data.completedThisMonth)} change={formatChange(data.completedPercentageChange, '%')} positive={data.completedPercentageChange >= 0} icon="completed" />
                <DashboardMetric title={t('metrics.inProgress')} value={String(data.inProgressCount)} change={formatChange(data.inProgressChange)} positive={data.inProgressChange <= 0} icon="progress" />
                <DashboardMetric title={t('metrics.overdue')} value={String(data.overdueCount)} change={formatChange(data.overdueChange)} positive={data.overdueChange <= 0} icon="overdue" />
                <DashboardMetric title={t('metrics.averageDuration')} value={t('metrics.days', {count: data.averageCompletionDays})} change={formatChange(data.averageDaysChange)} positive={data.averageDaysChange <= 0} icon="average" />
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.75fr)]">
                <StageLoadAnalytics stageLoads={data.stageLoads} userId={userId} />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <MaterialDistribution shares={data.materialShares} />
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
                        <div className="flex items-start justify-between"><div><h2 className="text-sm font-bold text-slate-900">{t('payments.title')}</h2><p className="mt-1 text-xs text-slate-400">{t('payments.subtitle')}</p></div><span className="text-2xl font-bold text-violet-600">{paidShare}%</span></div>
                        <div className="mt-8 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all" style={{ width: `${paidShare}%` }} /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[11px] text-emerald-600">{t('payments.paid')}</p><p className="mt-1 text-xl font-bold text-emerald-800">{data.paidOrdersCount}</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-[11px] text-amber-600">{t('payments.pending')}</p><p className="mt-1 text-xl font-bold text-amber-800">{data.unpaidOrdersCount}</p></div></div>
                    </section>
                </div>
            </div>
        </div>
    );
}
