import { NgComponentOutlet } from '@angular/common';
import { Component, Input } from '@angular/core';
import type { LucideIcon } from '@lucide/angular';

@Component({
  selector: 'lucide-icon',
  standalone: true,
  imports: [NgComponentOutlet],
  template: '<ng-container [ngComponentOutlet]="img" [ngComponentOutletInputs]="{ size: size }"></ng-container>',
})
export class LucideIconComponent {
  @Input({ required: true }) img!: LucideIcon;
  @Input() size: number | string = 24;
}
