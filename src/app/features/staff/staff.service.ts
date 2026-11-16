import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Staff, StaffCreateDto } from '../../shared/models/staff.model';

const STORAGE_KEY = 'dc_staff';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly _staff = signal<Staff[]>(this.loadFromStorage());
  readonly staff = this._staff.asReadonly();

  list(params?: { search?: string }): Observable<Staff[]> {
    let items = [...this._staff()];
    const query = params?.search?.trim().toLocaleLowerCase('fr-FR');
    if (query) {
      items = items.filter(member =>
        `${member.firstName} ${member.lastName}`.toLocaleLowerCase('fr-FR').includes(query) ||
        member.email.toLocaleLowerCase('fr-FR').includes(query),
      );
    }
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Staff | undefined> {
    return of(this._staff().find(member => member.id === id)).pipe(delay(150));
  }

  create(dto: StaffCreateDto): Observable<Staff> {
    const email = dto.email.trim().toLowerCase();
    if (this._staff().some(member => member.email.toLowerCase() === email)) {
      return throwError(() => new Error('Cet email est déjà utilisé.'));
    }
    if (!dto.firstName.trim() || !dto.lastName.trim() || !email) {
      return throwError(() => new Error('Le prénom, le nom et l’email sont obligatoires.'));
    }

    const member: Staff = {
      id: this.generateUuid(),
      ...dto,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email,
      phone: dto.phone?.trim() || undefined,
      specialty: dto.specialty?.trim() || undefined,
      active: true,
      hiredAt: new Date().toISOString(),
    };
    this._staff.update(list => [member, ...list]);
    this.saveToStorage();
    return of(member).pipe(delay(300));
  }

  toggleActive(id: string): Observable<Staff> {
    const existing = this._staff().find(member => member.id === id);
    if (!existing) return throwError(() => new Error('Membre introuvable.'));
    const updated: Staff = { ...existing, active: !existing.active };
    this._staff.update(list => list.map(member => member.id === id ? updated : member));
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
      const random = (Math.random() * 16) | 0;
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  private loadFromStorage(): Staff[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Staff[];
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._staff()));
  }

  private getSeedData(): Staff[] {
    return [
      { id: 's1', firstName: 'Omar', lastName: 'Fall', email: 'o.fall@dentalcare.sn', phone: '77 123 45 67', role: 'DENTIST', specialty: 'Chirurgien-dentiste', active: true, hiredAt: '2020-01-15' },
      { id: 's2', firstName: 'Mamadou', lastName: 'Diop', email: 'm.diop@dentalcare.sn', phone: '76 234 56 78', role: 'DENTIST', specialty: 'Orthodontiste', active: true, hiredAt: '2021-03-10' },
      { id: 's3', firstName: 'Fatou', lastName: 'Sow', email: 'f.sow@dentalcare.sn', phone: '78 345 67 89', role: 'SECRETARY', active: true, hiredAt: '2022-06-01' },
      { id: 's4', firstName: 'Ibrahima', lastName: 'Ba', email: 'i.ba@dentalcare.sn', phone: '70 456 78 90', role: 'CASHIER', active: true, hiredAt: '2023-09-15' },
      { id: 's5', firstName: 'Awa', lastName: 'Diop', email: 'a.diop@dentalcare.sn', phone: '77 567 89 01', role: 'ASSISTANT', active: true, hiredAt: '2024-02-20' },
    ];
  }
}
