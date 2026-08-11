export type PatientStatus = 'ACTIVE' | 'ARCHIVED';

export interface PatientFile {
    id: string;
    name: string;
    type: 'FILE' | 'IMAGE' | 'VIDEO';
    url: string;
    createdAt: string;
}

export interface PatientOrder {
    id: string;
    orderNumber: string;
    workType: string;
    clinicName: string;
    doctorName: string;
    status: string;
    createdAt: string;
    deadline: string;
}

export interface MedicalNote {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface Patient {
    id: string;
    fullName: string;
    phone?: string;
    birthDate?: string;
    clinicName: string;
    doctorName: string;
    status: PatientStatus;
    notes: MedicalNote[];
    orders: PatientOrder[];
    files: PatientFile[];
}