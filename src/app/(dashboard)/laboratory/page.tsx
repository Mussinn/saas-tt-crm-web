'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useGetColorsQuery } from '@/src/services/api/laboratory/colorsApi';
import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';

type ModuleIconName = 'employees' | 'colors' | 'workTypes';

function ModuleIcon({ name }: { name: ModuleIconName }) {
    const iconClassName = 'h-5 w-5';

    if (name === 'employees') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 5" />
            </svg>
        );
    }

    if (name === 'colors') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a9 9 0 1 0 0 18h1.3a2 2 0 0 0 1.4-3.4 2 2 0 0 1 1.4-3.4H18A3 3 0 0 0 21 11a8 8 0 0 0-9-8Z" />
                <circle cx="7.5" cy="10" r=".8" fill="currentColor" stroke="none" />
                <circle cx="10" cy="6.8" r=".8" fill="currentColor" stroke="none" />
                <circle cx="14.2" cy="6.7" r=".8" fill="currentColor" stroke="none" />
            </svg>
        );
    }

    if (name === 'workTypes') {
        return (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={iconClassName} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M8 9h8M8 13h5M8 17h7" />
                <path d="M8 4V2.8M16 4V2.8" />
            </svg>
        );
    }

    return null;
}

export default function LaboratoryPage() {
    const t = useTranslations('laboratory.overview');
    const modules: {
        title: string;
        description: string;
        href: string;
        icon: ModuleIconName;
        tone: string;
    }[] = [
        { title: t('modules.employeesTitle'), description: t('modules.employeesDescription'), href: '/laboratory/employees', icon: 'employees', tone: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
        { title: t('modules.colorsTitle'), description: t('modules.colorsDescription'), href: '/laboratory/colors', icon: 'colors', tone: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300' },
        { title: t('modules.workTypesTitle'), description: t('modules.workTypesDescription'), href: '/laboratory/work-types', icon: 'workTypes', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
    ];
    const usersQuery = useGetUsersQuery();
    const colorsQuery = useGetColorsQuery(false);
    const workTypesQuery = useGetWorkTypesQuery();
    const users = usersQuery.data ?? [];
    const colors = colorsQuery.data ?? [];
    const workTypes = workTypesQuery.data ?? [];
    const activeUsers = users.filter((user) => user.status?.toUpperCase() === 'ACTIVE').length;
    const tasksInProgress = users.reduce((sum, user) => sum + (user.stats?.inProgress ?? 0), 0);
    const overdueTasks = users.reduce((sum, user) => sum + (user.stats?.overdue ?? 0), 0);

    return (
        <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    [t('employees'), users.length, t('activeCount', {count: activeUsers}), 'bg-violet-500'],
                    [t('tasksInProgress'), tasksInProgress, t('teamWide'), 'bg-blue-500'],
                    [t('overdue'), overdueTasks, t('needsAttention'), 'bg-red-500'],
                    [t('workTypes'), workTypes.length, t('colorsCount', {count: colors.length}), 'bg-fuchsia-500'],
                ].map(([label, value, note, color]) => <article key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`h-2.5 w-2.5 rounded-full ${color}`} /></div><p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-400">{note}</p></article>)}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div><h1 className="text-xl font-black text-slate-950">{t('title')}</h1><p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p></div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {modules.map((module) => <Link key={module.href} href={module.href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-950/10"><span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${module.tone}`}><ModuleIcon name={module.icon} /></span><h2 className="mt-5 text-base font-black text-slate-900 group-hover:text-violet-700">{module.title}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{module.description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-violet-600">{t('open')} <span className="transition-transform group-hover:translate-x-1">→</span></span></Link>)}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">{t('teamLoad')}</h2><p className="mt-1 text-xs text-slate-400">{t('activeTasks')}</p></div><Link href="/laboratory/employees" className="text-xs font-bold text-violet-600">{t('allEmployees')}</Link></div><div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">{users.slice(0, 8).map((user) => { const load = (user.stats?.inProgress ?? 0) + (user.stats?.overdue ?? 0); const max = Math.max(1, ...users.map((item) => (item.stats?.inProgress ?? 0) + (item.stats?.overdue ?? 0))); return <div key={user.id} className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)_32px] items-center gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{user.fullName || user.name}</p><p className="text-[9px] text-slate-400">{user.specialization || user.role || t('employee')}</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${user.stats?.overdue ? 'bg-gradient-to-r from-violet-600 to-red-400' : 'bg-gradient-to-r from-violet-600 to-fuchsia-400'}`} style={{width: `${load / max * 100}%`}} /></div><span className="text-right text-xs font-black text-slate-700">{load}</span></div>;})}{!usersQuery.isLoading && users.length === 0 && <p className="py-12 text-center text-sm text-slate-400">{t('employeesEmpty')}</p>}</div></div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-900">{t('directoryReadiness')}</h2><p className="mt-1 text-xs text-slate-400">{t('orderData')}</p><div className="mt-6 space-y-4">{[[t('modules.colorsTitle'), colors.length, '/laboratory/colors'], [t('modules.workTypesTitle'), workTypes.length, '/laboratory/work-types']].map(([label, count, href]) => <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50"><span className="text-xs font-semibold text-slate-600">{label}</span><span className="rounded-lg bg-violet-50 px-2.5 py-1 text-sm font-black text-violet-700">{count}</span></Link>)}</div></div>
            </section>
        </div>
    );
}
