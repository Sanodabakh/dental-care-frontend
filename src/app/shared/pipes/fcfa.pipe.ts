import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fcfa', standalone: true })
export class FcfaPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  }
}