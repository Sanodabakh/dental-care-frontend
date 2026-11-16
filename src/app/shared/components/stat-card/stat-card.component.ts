import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LucideIcon } from '@lucide/angular';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';

export type StatCardColor = 'blue' | 'teal' | 'violet' | 'amber' | 'green' | 'red';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css'],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() note = '';
  @Input() trend = '';
  @Input() trendPositive = true;
  @Input() context = '';
  @Input() contextLive = false;
  @Input({ required: true }) icon!: LucideIcon;
  @Input() color: StatCardColor = 'blue';
  @Input() small = false;
}