'use client';

import Link from 'next/link';
import {useMemo, useState, type ReactNode} from 'react';
import {useMessages, useTranslations} from 'next-intl';
import {useSelector} from 'react-redux';

import {useAppLocale} from '@/src/i18n/provider';
import type {RootState} from '@/src/lib/store';

type GuideRole = 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN' | 'FINANCIER' | 'CHIEF_TECHNICIAN';
type GuideKind = 'orders' | 'tasks' | 'materials' | 'payroll-plan' | 'payroll-rule' | 'payroll-calc' | 'payroll-payment' | 'workflow';

type GuideContent = {
    category: string;
    title: string;
    result: string;
    path: string;
    duration: string;
    steps: Array<{title: string; action: string; example: string; check: string}>;
};

type Guide = GuideContent & {
    id: string;
    kind: GuideKind;
    href: string;
    roles: GuideRole[];
};

const guideDefinitions: Array<Pick<Guide, 'id' | 'kind' | 'href' | 'roles'>> = [
    {id: 'createOrder', kind: 'orders', href: '/orders', roles: ['ADMIN', 'DISPATCHER']},
    {id: 'processTask', kind: 'tasks', href: '/employee', roles: ['TECHNICIAN', 'CHIEF_TECHNICIAN', 'ADMIN']},
    {id: 'materials', kind: 'materials', href: '/employee', roles: ['TECHNICIAN', 'CHIEF_TECHNICIAN', 'ADMIN', 'DISPATCHER']},
    {id: 'payrollPlan', kind: 'payroll-plan', href: '/accounting/payroll', roles: ['ADMIN', 'FINANCIER']},
    {id: 'payrollRules', kind: 'payroll-rule', href: '/accounting/payroll', roles: ['ADMIN', 'FINANCIER']},
    {id: 'payrollCalculate', kind: 'payroll-calc', href: '/accounting/payroll', roles: ['ADMIN', 'FINANCIER']},
    {id: 'payrollPayment', kind: 'payroll-payment', href: '/accounting', roles: ['ADMIN', 'FINANCIER']},
    {id: 'workflow', kind: 'workflow', href: '/laboratory/work-types', roles: ['ADMIN', 'CHIEF_TECHNICIAN']},
];

function BrowserFrame({children, title}: {children: ReactNode; title: string}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,.45)]">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate rounded-md bg-white px-3 py-1 text-[9px] font-semibold text-slate-400">{title}</span>
            </div>
            {children}
        </div>
    );
}

function GuidePreview({
    guide,
    stepIndex,
    labels,
}: {
    guide: Guide;
    stepIndex: number;
    labels: {currentAction: string; example: string; check: string; ready: string};
}) {
    const step = guide.steps[stepIndex];

    return (
        <BrowserFrame title={guide.path}>
            <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[9px] font-black uppercase text-violet-600">{guide.category}</p>
                <p className="text-sm font-black text-slate-900">{guide.title}</p>
            </div>
            <div className="bg-slate-50 p-4">
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-[9px] font-black uppercase tracking-wide text-violet-600">{labels.currentAction}</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{step.title}</p>
                    <p className="mt-2 text-[10px] leading-5 text-slate-600">{step.action}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[8px] font-black uppercase text-slate-400">{labels.example}</p>
                        <p className="mt-1 text-[10px] leading-4 text-slate-700">{step.example}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-[8px] font-black uppercase text-emerald-600">{labels.check}</p>
                        <p className="mt-1 text-[10px] leading-4 text-emerald-900">{step.check}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 p-3">
                <span className="rounded-lg bg-emerald-600 px-4 py-2 text-[9px] font-black text-white">{labels.ready}</span>
            </div>
        </BrowserFrame>
    );
}

export default function KnowledgeBasePage() {
    const t = useTranslations('knowledgeBase');
    const messages = useMessages();
    const {locale} = useAppLocale();
    const {role, roles} = useSelector((state: RootState) => state.auth);
    const knowledgeMessages = messages.knowledgeBase as unknown as {
        guides: Record<string, GuideContent>;
        roles: Record<string, string>;
        warnings: Partial<Record<GuideKind, string>>;
    };
    const content = knowledgeMessages.guides;
    const guides = useMemo(
        () => guideDefinitions.map((definition) => ({...definition, ...content[definition.id]})),
        [content],
    );
    const normalizedRoles = useMemo(() => {
        const result = new Set([role, ...roles].filter(Boolean).map((item) => String(item).replace(/^ROLE_/u, '').toUpperCase()));
        if (result.has('HEAD_TECHNICIAN')) result.add('CHIEF_TECHNICIAN');
        return result;
    }, [role, roles]);
    const visibleGuides = useMemo(
        () => guides.filter((guide) => guide.roles.some((allowedRole) => normalizedRoles.has(allowedRole))),
        [guides, normalizedRoles],
    );
    const [search, setSearch] = useState('');
    const [activeGuideId, setActiveGuideId] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const activeGuide = visibleGuides.find((guide) => guide.id === activeGuideId) ?? visibleGuides[0];
    const searchLocale = locale === 'ru' ? 'ru-RU' : locale === 'kk' ? 'kk-KZ' : 'en-US';
    const normalizedSearch = search.trim().toLocaleLowerCase(searchLocale);
    const filteredGuides = visibleGuides.filter((guide) =>
        `${guide.title} ${guide.result} ${guide.category}`.toLocaleLowerCase(searchLocale).includes(normalizedSearch),
    );
    const roleNames = knowledgeMessages.roles;
    const displayRole = roleNames[String(role).replace(/^ROLE_/u, '')] ?? t('employee');
    const isFinanceUser = normalizedRoles.has('FINANCIER');
    const warnings = knowledgeMessages.warnings;

    const selectGuide = (id: string) => {
        setActiveGuideId(id);
        setActiveStep(0);
    };

    if (!activeGuide) return null;

    return (
        <div className="mx-auto max-w-7xl pb-10">
            <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">{t('trainingCenter', {role: displayRole})}</p>
                    <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{t('title')}</h1>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{t('subtitle')}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:max-w-sm">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-slate-400"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path d="m16 16 4 4" strokeWidth="2"/></svg>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs font-semibold outline-none" placeholder={t('search')} />
                    </label>
                    <Link href="/knowledge-base?tour=welcome" className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-100">
                        <span aria-hidden="true">✦</span>
                        {t('tour.restartIntro')}
                    </Link>
                </div>
            </header>

            {isFinanceUser && (
                <section className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-5 text-white shadow-lg shadow-violet-200 sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200">{t('finance.firstDay')}</p>
                            <h2 className="mt-1 text-xl font-black">{t('finance.title')}</h2>
                            <p className="mt-1 text-xs leading-5 text-violet-100">{t('finance.subtitle')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(['payrollPlan', 'payrollRules', 'payrollCalculate', 'payrollPayment'] as const).map((id, index) => (
                                <button key={id} type="button" onClick={() => selectGuide(id)} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left transition hover:bg-white/20">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-black text-violet-700">{index + 1}</span>
                                    <span className="text-[10px] font-black">{t(`finance.lessons.${id}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-4 lg:self-start">
                    <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{t('availableGuides')}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible">
                        {filteredGuides.map((guide, index) => (
                            <button key={guide.id} type="button" onClick={() => selectGuide(guide.id)} className={`min-w-[230px] rounded-2xl border p-3 text-left transition lg:w-full ${activeGuide.id === guide.id ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200'}`}>
                                <span className="flex items-center gap-3">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${activeGuide.id === guide.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                                    <span className="min-w-0"><span className="block text-[9px] font-black uppercase text-violet-600">{guide.category}</span><span className="mt-0.5 block text-xs font-black leading-4 text-slate-800">{guide.title}</span></span>
                                </span>
                            </button>
                        ))}
                        {filteredGuides.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">{t('notFound')}</p>}
                    </div>
                    <div className="mt-3 hidden rounded-2xl bg-slate-900 p-4 text-white lg:block">
                        <p className="text-[9px] font-black uppercase text-slate-400">{t('roleFocus.title')}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{t('roleFocus.body')}</p>
                    </div>
                </aside>

                <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-5 sm:p-7">
                        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[9px] font-black uppercase text-violet-700">{activeGuide.category}</span><span className="text-[10px] font-bold text-slate-400">{activeGuide.duration}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">{t('tour.available')}</span></div>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-2xl font-black text-slate-950">{activeGuide.title}</h2>
                            <Link
                                href={{pathname: activeGuide.href, query: {tour: activeGuide.id}}}
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-center text-xs font-black text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
                            >
                                <span aria-hidden="true">▶</span>
                                {t('tour.startGuide')}
                            </Link>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-violet-600">{t('tour.startHint')}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[9px] font-black uppercase text-emerald-700">{t('result')}</p><p className="mt-1 text-xs leading-5 text-emerald-900">{activeGuide.result}</p></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">{t('where')}</p><p className="mt-1 text-xs font-black text-slate-800">{activeGuide.path}</p></div>
                        </div>
                        {warnings[activeGuide.kind] && <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"><span>!</span><p className="text-[10px] font-semibold leading-4 text-amber-900">{warnings[activeGuide.kind]}</p></div>}
                    </div>

                    <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,.85fr)_minmax(380px,1.15fr)]">
                        <section>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{t('clickSteps')}</p>
                            <ol className="space-y-2">
                                {activeGuide.steps.map((step, index) => (
                                    <li key={step.title}>
                                        <button type="button" onClick={() => setActiveStep(index)} className={`w-full rounded-2xl border p-4 text-left transition ${activeStep === index ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-violet-200'}`}>
                                            <span className="flex gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${activeStep === index ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span><span><span className="block text-sm font-black text-slate-900">{step.title}</span>{activeStep === index && <span className="mt-2 block text-xs leading-5 text-slate-600">{step.action}</span>}</span></span>
                                            {activeStep === index && <span className="mt-3 block space-y-2 pl-10"><span className="block rounded-lg bg-white px-3 py-2 text-[10px] text-slate-600"><b className="text-violet-700">{t('example')}:</b> {step.example}</span><span className="block text-[10px] font-bold text-emerald-700">✓ {t('check')}: {step.check}</span></span>}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className="xl:sticky xl:top-4 xl:self-start">
                            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('windowExample')}</p><p className="text-[10px] font-bold text-violet-600">{t('stepProgress', {current: activeStep + 1, total: activeGuide.steps.length})}</p></div>
                            <GuidePreview guide={activeGuide} stepIndex={activeStep} labels={{currentAction: t('currentAction'), example: t('example'), check: t('check'), ready: t('ready')}} />
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                                <button type="button" disabled={activeStep === 0} onClick={() => setActiveStep((step) => Math.max(0, step - 1))} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-30">← {t('previous')}</button>
                                {activeStep < activeGuide.steps.length - 1
                                    ? <button type="button" onClick={() => setActiveStep((step) => step + 1)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">{t('next')} →</button>
                                    : <Link href={activeGuide.href} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-xs font-black text-white">{t('openSection')} →</Link>}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
