import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';

@Pipe({ name: 'dateFr', standalone: true })
export class DateFrPipe implements PipeTransform {
  private readonly datePipe = inject(DatePipe);

  transform(value: string | Date | null | undefined, format = 'dd/MM/yyyy'): string {
    return this.datePipe.transform(value ?? null, format, undefined, 'fr-FR') ?? '—';
  }
}
