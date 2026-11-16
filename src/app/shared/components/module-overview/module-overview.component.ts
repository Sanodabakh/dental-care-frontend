import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ModuleOverviewConfig {
  title: string;
  subtitle: string;
  panelTitle: string;
  description: string;
  nextSteps: string[];
}

@Component({
  selector: 'app-module-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.css'],
})
export class ModuleOverviewComponent {
  @Input({ required: true }) config!: ModuleOverviewConfig;
}
