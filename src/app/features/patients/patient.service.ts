import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import {
  Patient, PatientCreateDto, PatientUpdateDto, PatientStatus,
} from '../../shared/models/patient.model';

const STORAGE_KEY = 'dc_patients';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly _patients = signal<Patient[]>(this.loadFromStorage());

  readonly patients = this._patients.asReadonly();

  // ==========================================
  // LISTE + RECHERCHE + FILTRES
  // ==========================================
  list(params?: {
    search?: string;
    status?: PatientStatus | 'ALL';
    page?: number;
    size?: number;
  }): Observable<{ items: Patient[]; total: number }> {
    let items = [...this._patients()];

    // Filtre recherche (nom, prénom, numéro, téléphone)
    const search = params?.search?.toLowerCase().trim();
    if (search) {
      items = items.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search) ||
        p.patientNumber.toLowerCase().includes(search) ||
        (p.phone ?? '').includes(search),
      );
    }

    // Filtre statut
    if (params?.status && params.status !== 'ALL') {
      items = items.filter(p => p.status === params.status);
    }

    // Tri par date de création décroissante
    items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    const total = items.length;
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const paginated = items.slice(page * size, (page + 1) * size);

    return of({ items: paginated, total }).pipe(delay(250));
  }

  // ==========================================
  // DÉTAIL
  // ==========================================
  getById(id: string): Observable<Patient | undefined> {
    return of(this._patients().find(p => p.id === id)).pipe(delay(200));
  }

  getByNumber(patientNumber: string): Observable<Patient | undefined> {
    return of(this._patients().find(p => p.patientNumber === patientNumber)).pipe(delay(200));
  }

  // ==========================================
  // CRÉATION (génère le numéro de référence)
  // ==========================================
  create(dto: PatientCreateDto): Observable<Patient> {
    const year = new Date().getFullYear();
    const count = this._patients().filter(p => p.patientNumber.startsWith(`PAT-${year}-`)).length;
    const nextNumber = String(count + 1).padStart(4, '0');
    const patientNumber = `PAT-${year}-${nextNumber}`;

    const newPatient: Patient = {
      id: this.generateUuid(),
      patientNumber,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      birthDate: dto.birthDate,
      gender: dto.gender,
      phone: dto.phone,
      secondaryPhone: dto.secondaryPhone,
      email: dto.email,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      emergencyPhone: dto.emergencyPhone,
      createdAt: new Date().toISOString(),
      status: 'ACTIF',
    };

    this._patients.update(list => [newPatient, ...list]);
    this.saveToStorage();
    return of(newPatient).pipe(delay(300));
  }

  // ==========================================
  // MISE À JOUR
  // ==========================================
  update(id: string, dto: PatientUpdateDto): Observable<Patient> {
    const patient = this._patients().find(p => p.id === id);
    if (!patient) throw new Error('Patient introuvable');

    const updated: Patient = { ...patient, ...dto, updatedAt: new Date().toISOString() };
    this._patients.update(list => list.map(p => p.id === id ? updated : p));
    this.saveToStorage();
    return of(updated).pipe(delay(300));
  }

  // ==========================================
  // ARCHIVAGE (suppression logique)
  // ==========================================
  archive(id: string): Observable<void> {
    this._patients.update(list =>
      list.map(p =>
        p.id === id ? { ...p, status: 'ARCHIVE', deletedAt: new Date().toISOString() } : p,
      ),
    );
    this.saveToStorage();
    return of(void 0).pipe(delay(200));
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Patient[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._patients()));
  }

  // ==========================================
  // DONNÉES DE DÉMONSTRATION
  // ==========================================
  private getSeedData(): Patient[] {
    return [
      { id: 'p1', patientNumber: 'PAT-2026-0001', firstName: 'Aminata', lastName: 'Diallo',
        phone: '77 123 45 67', gender: 'F', birthDate: '1990-03-15',
        address: 'Sacré-Cœur 3, Dakar', email: 'aminata.diallo@email.sn',
        createdAt: '2026-11-14T08:30:00Z', lastConsultation: '2026-11-14', status: 'ACTIF' },
      { id: 'p2', patientNumber: 'PAT-2026-0002', firstName: 'Moussa', lastName: 'Ndiaye',
        phone: '76 234 56 78', gender: 'M', birthDate: '1985-07-22',
        address: 'Almadies, Dakar', email: 'moussa.ndiaye@email.sn',
        createdAt: '2026-11-13T09:15:00Z', lastConsultation: '2026-11-10', status: 'ACTIF' },
      { id: 'p3', patientNumber: 'PAT-2026-0003', firstName: 'Fatou', lastName: 'Sow',
        phone: '78 345 67 89', gender: 'F', birthDate: '1992-11-30',
        address: 'Plateau, Dakar', email: 'fatou.sow@email.sn',
        createdAt: '2026-11-12T10:30:00Z', lastConsultation: '2026-11-12', status: 'ACTIF' },
      { id: 'p4', patientNumber: 'PAT-2026-0004', firstName: 'Ibrahima', lastName: 'Ba',
        phone: '70 456 78 90', gender: 'M', birthDate: '1978-05-10',
        address: 'Yoff, Dakar', email: 'ibrahima.ba@email.sn',
        createdAt: '2026-11-10T11:30:00Z', lastConsultation: '2026-11-08', status: 'ACTIF' },
      { id: 'p5', patientNumber: 'PAT-2026-0005', firstName: 'Awa', lastName: 'Diop',
        phone: '77 567 89 01', gender: 'F', birthDate: '1995-09-14',
        address: 'Point E, Dakar', createdAt: '2026-11-08T14:00:00Z',
        lastConsultation: '2026-11-05', status: 'ACTIF' },
      { id: 'p6', patientNumber: 'PAT-2026-0006', firstName: 'Cheikh', lastName: 'Fall',
        phone: '76 678 90 12', gender: 'M', birthDate: '1980-12-03',
        address: 'Ouakam, Dakar', createdAt: '2026-11-05T15:20:00Z',
        lastConsultation: '2026-11-01', status: 'ACTIF' },
      { id: 'p7', patientNumber: 'PAT-2026-0007', firstName: 'Mariama', lastName: 'Sarr',
        phone: '78 789 01 23', gender: 'F', birthDate: '1988-04-18',
        address: 'Liberté 6, Dakar', createdAt: '2026-11-02T09:45:00Z',
        lastConsultation: '2026-10-28', status: 'ACTIF' },
    ];
  }
}