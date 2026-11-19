import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../../shared/models/user.model';

/** Annuaire des utilisateurs utiles au front (sélecteurs). */
@Injectable({ providedIn: 'root' })
export class DirectoryService {
  constructor(private api: ApiService) {}

  dentists(): Observable<User[]> {
    return this.api.get<User[]>('/directory/dentists');
  }
}
