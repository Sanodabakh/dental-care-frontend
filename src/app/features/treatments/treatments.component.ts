import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideSearch, LucidePlus, LucideEdit, LucidePower, LucideFilter,
} from '@lucide/angular';
import { TreatmentService } from './treatment.service';
import { Treatment } from '../../shared/models/treatment.model';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-treatment-list',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    LucideSearch, LucidePlus, LucideEdit, LucidePower, LucideFilter,
    FcfaPipe,
  ],
  templateUrl: './treatments.component.html',
  styleUrls: ['./treatments.component.css'],
})
export class TreatmentListComponent implements OnInit {
  private readonly service = inject(TreatmentService);

  readonly loading = signal(true);
  readonly treatments = signal<Treatment[]>([]);
  readonly search = signal('');
  readonly category = signal('ALL');

  readonly categories = [
    'Consultation', 'Prophylaxie', 'Chirurgie', 'Restauration',
    'Endodontie', 'Prothèse', 'Imagerie',
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.list({
      search: this.search(),
      category: this.category(),
    }).subscribe(items => {
      this.treatments.set(items);
      this.loading.set(false);
    });
  }

  onSearch(v: string): void { this.search.set(v); this.load(); }
  onCategory(v: string): void { this.category.set(v); this.load(); }

  toggle(t: Treatment): void {
    this.service.toggleActive(t.id).subscribe(() => this.load());
  }
}