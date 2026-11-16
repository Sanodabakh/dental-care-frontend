import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideSave, LucideX } from '@lucide/angular';
import { TreatmentService } from '../treatment.service';
import { Treatment } from '../../../shared/models/treatment.model';

@Component({
  selector: 'app-treatment-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideArrowLeft, LucideSave, LucideX],
  templateUrl: './treatment-form.component.html',
  styleUrls: ['./treatment-form.component.css'],
})
export class TreatmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TreatmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly treatment = signal<Treatment | null>(null);

  readonly categories = ['Consultation', 'Prophylaxie', 'Chirurgie', 'Restauration', 'Endodontie', 'Prothèse', 'Imagerie'];

  readonly form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{3,10}$/)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    description: [''],
    priceFcfa: [0, [Validators.required, Validators.min(0)]],
    estimatedDurationMin: [30, [Validators.min(1)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.getById(id).subscribe(t => {
        if (!t) { this.router.navigate(['/treatments']); return; }
        this.treatment.set(t);
        this.form.patchValue({
          code: t.code, name: t.name, category: t.category,
          description: t.description ?? '',
          priceFcfa: t.priceFcfa,
          estimatedDurationMin: t.estimatedDurationMin ?? 30,
        });
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);

    if (this.isEdit() && this.treatment()) {
      this.service.update(this.treatment()!.id, this.form.value).subscribe({
        next: () => this.router.navigate(['/treatments']),
        error: (e: Error) => { this.saving.set(false); this.error.set(e.message); },
      });
    } else {
      this.service.create(this.form.value).subscribe({
        next: () => this.router.navigate(['/treatments']),
        error: (e: Error) => { this.saving.set(false); this.error.set(e.message); },
      });
    }
  }

  cancel(): void { this.router.navigate(['/treatments']); }
}