import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="dc-badge" [ngClass]="'dc-badge-' + variant">
      @if (dot) { <i class="w-1.5 h-1.5 rounded-full bg-current"></i> }
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'neutral';
  @Input() dot = false;
}