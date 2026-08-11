'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';

import {mockPatients} from '@/src/mock/patients.mock';
import type {PatientStatus} from '@/src/types/patient.type';
import {useTranslations} from 'next-intl';
import {useAppFormatters} from '@/src/i18n/provider';

const statusClasses: Record<PatientStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
};

export default function ClinicPatientsPage() {
    const t = useTranslations('clinics.patients');
    const clinicT = useTranslations('clinics.details');
    const {date: formatDate} = useAppFormatters();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'ALL' | PatientStatus>('ALL');

    const filteredPatients = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return mockPatients.filter((patient) => {
            const matchesStatus = status === 'ALL' || patient.status === status;
            const matchesSearch =
                !searchValue ||
                patient.fullName.toLowerCase().includes(searchValue) ||
                patient.clinicName.toLowerCase().includes(searchValue) ||
                patient.doctorName.toLowerCase().includes(searchValue) ||
                patient.phone?.toLowerCase().includes(searchValue);

            return matchesStatus && matchesSearch;
        });
    }, [search, status]);
    const activeCount = mockPatients.filter((patient) => patient.status === 'ACTIVE').length;
    const ordersCount = mockPatients.reduce((sum, patient) => sum + patient.orders.length, 0);
    const filesCount = mockPatients.reduce((sum, patient) => sum + patient.files.length, 0);

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Link
                        href="/clinics"
                        className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-violet-600 hover:underline"
                    >
                        ← {clinicT('back')}
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t('title')}</h1>
                    <p className="text-sm text-slate-500">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="font-bold text-slate-900">{filteredPatients.length}</span>
                    <span className="ml-1 text-slate-500">{t('inRegistry')}</span>
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    [t('total'), mockPatients.length, t('inRegistry'), 'bg-violet-500'],
                    [t('active'), activeCount, t('currentPatients'), 'bg-emerald-500'],
                    [t('orders'), ordersCount, t('linkedPatients'), 'bg-blue-500'],
                    [t('files'), filesCount, t('patientRecords'), 'bg-amber-500'],
                ].map(([label, value, note, color]) => <article key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`h-2.5 w-2.5 rounded-full ${color}`} /></div><p className="mt-5 text-3xl font-black text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-400">{note}</p></article>)}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('search')}
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 md:max-w-md"
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as 'ALL' | PatientStatus)}
                        className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-violet-500 focus:bg-white md:w-56"
                    >
                        <option value="ALL">{t('allStatuses')}</option>
                        <option value="ACTIVE">{t('active')}</option>
                        <option value="ARCHIVED">{t('archived')}</option>
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div><h2 className="text-sm font-bold text-slate-900">{t('cards')}</h2><p className="mt-1 text-xs text-slate-400">{t('cardsSubtitle')}</p></div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{t('found', {count: filteredPatients.length})}</span>
                </div>

                <div className="grid max-h-[720px] gap-4 overflow-y-auto p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredPatients.map((patient) => (
                        <article key={patient.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5">
                            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
                            <div className="flex items-start gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-sm font-black text-violet-700">{patient.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase()}</span>
                                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate text-sm font-black text-slate-900" title={patient.fullName}>{patient.fullName}</h3><span className={`${statusClasses[patient.status]} shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold uppercase`}>{t(`statuses.${patient.status}`)}</span></div><p className="mt-1 text-xs text-slate-500">{patient.phone ?? t('phoneMissing')}</p><p className="mt-0.5 text-[10px] text-slate-400">{t('birthDate', {date: patient.birthDate ? formatDate(patient.birthDate) : '-'})}</p></div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-400">{t('clinic')}</p><p className="mt-1 truncate font-bold text-slate-700" title={patient.clinicName}>{patient.clinicName}</p></div>
                                <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-400">{t('doctor')}</p><p className="mt-1 truncate font-bold text-slate-700" title={patient.doctorName}>{patient.doctorName}</p></div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                                <div className="flex flex-1 items-center justify-between rounded-lg bg-violet-50 px-3 py-2"><span className="text-[10px] text-violet-600">{t('orders')}</span><strong className="text-sm text-violet-800">{patient.orders.length}</strong></div>
                                <div className="flex flex-1 items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-[10px] text-slate-500">{t('files')}</span><strong className="text-sm text-slate-800">{patient.files.length}</strong></div>
                            </div>
                        </article>
                    ))}
                    {filteredPatients.length === 0 && <div className="col-span-full py-16 text-center text-sm text-slate-400">{t('empty')}</div>}
                </div>
            </section>
        </div>
    );
}
