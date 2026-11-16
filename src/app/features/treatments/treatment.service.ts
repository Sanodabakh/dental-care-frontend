import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Treatment, TreatmentCreateDto } from '../../shared/models/treatment.model';

const STORAGE_KEY = 'dc_treatments';

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private readonly _treatments = signal<Treatment[]>(this.loadFromStorage());
  readonly treatments = this._treatments.asReadonly();

  list(params?: { search?: string; category?: string; activeOnly?: boolean }): Observable<Treatment[]> {
    let items = [...this._treatments()];

    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(t =>
        t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
      );
    }
    if (params?.category && params.category !== 'ALL') {
      items = items.filter(t => t.category === params.category);
    }
    if (params?.activeOnly) {
      items = items.filter(t => t.active);
    }
    items.sort((a, b) => a.code.localeCompare(b.code));
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Treatment | undefined> {
    return of(this._treatments().find(t => t.id === id)).pipe(delay(150));
  }

  create(dto: TreatmentCreateDto): Observable<Treatment> {
    if (this._treatments().some(t => t.code === dto.code)) {
      return throwError(() => new Error('Ce code existe déjà'));
    }

    const treatment: Treatment = {
      id: this.generateUuid(),
      ...dto,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this._treatments.update(list => [...list, treatment]);
    this.saveToStorage();
    return of(treatment).pipe(delay(300));
  }

  update(id: string, dto: Partial<TreatmentCreateDto>): Observable<Treatment> {
    const existing = this._treatments().find(t => t.id === id);
    if (!existing) return throwError(() => new Error('Acte introuvable'));
    if (dto.code && this._treatments().some(t => t.id !== id && t.code === dto.code)) {
      return throwError(() => new Error('Ce code existe déjà'));
    }

    const updated: Treatment = { ...existing, ...dto };
    this._treatments.update(list => list.map(t => t.id === id ? updated : t));
    this.saveToStorage();
    return of(updated).pipe(delay(300));
  }

  toggleActive(id: string): Observable<Treatment> {
    const existing = this._treatments().find(t => t.id === id);
    if (!existing) return throwError(() => new Error('Acte introuvable'));

    const updated: Treatment = { ...existing, active: !existing.active };
    this._treatments.update(list => list.map(t => t.id === id ? updated : t));
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Treatment[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._treatments()));
  }

  private getSeedData(): Treatment[] {
    return [
      { id: 't1', code: 'ACT001', name: 'Consultation',       category: 'Consultation', priceFcfa: 10000, estimatedDurationMin: 30, active: true, createdAt: new Date().toISOString() },
      { id: 't2', code: 'ACT002', name: 'Détartrage',         category: 'Prophylaxie',  priceFcfa: 20000, estimatedDurationMin: 45, active: true, createdAt: new Date().toISOString() },
      { id: 't3', code: 'ACT003', name: 'Extraction simple',  category: 'Chirurgie',    priceFcfa: 15000, estimatedDurationMin: 30, active: true, createdAt: new Date().toISOString() },
      { id: 't4', code: 'ACT004', name: 'Extraction complexe',category: 'Chirurgie',    priceFcfa: 35000, estimatedDurationMin: 60, active: true, createdAt: new Date().toISOString() },
      { id: 't5', code: 'ACT005', name: 'Obturation composite',category: 'Restauration',priceFcfa: 25000, estimatedDurationMin: 45, active: true, createdAt: new Date().toISOString() },
      { id: 't6', code: 'ACT006', name: 'Dévitalisation',     category: 'Endodontie',   priceFcfa: 50000, estimatedDurationMin: 90, active: true, createdAt: new Date().toISOString() },
      { id: 't7', code: 'ACT007', name: 'Couronne céramique', category: 'Prothèse',     priceFcfa: 150000, estimatedDurationMin: 120, active: true, createdAt: new Date().toISOString() },
      { id: 't8', code: 'ACT008', name: 'Radiographie dentaire', category: 'Imagerie',  priceFcfa: 8000, estimatedDurationMin: 15, active: true, createdAt: new Date().toISOString() },
    ];
  }
}