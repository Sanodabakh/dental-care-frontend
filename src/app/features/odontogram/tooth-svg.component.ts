import { Component, input } from '@angular/core';
import { ToothCondition } from '../../shared/models/odontogram.model';

@Component({
  selector: 'app-tooth-svg',
  template: `
    <svg viewBox="0 0 42 48" role="img" [attr.aria-label]="'Dent ' + number() + ', ' + condition()">
      <path
        d="M11 5c-5 0-8 4-8 10 0 5 3 8 4 13l2 13c.4 2.5 3 3.2 4.2.7l4-9c1.4-3.1 3.8-3.1 5.2 0l4 9c1.2 2.5 3.8 1.8 4.2-.7l2-13c1-5 4-8 4-13 0-6-3-10-8-10-4 0-6 2-9 2s-4-2-9-2Z"
        [attr.fill]="fillColor()"
        stroke="#8ca1aa"
        stroke-width="1.5"
      />
      <text x="21" y="27" text-anchor="middle" fill="#46606d" font-size="8">{{ number() }}</text>
    </svg>
  `,
  styles: [
    `
      svg { display: block; width: 38px; height: 44px; }
      text { font-family: 'DM Sans', sans-serif; font-weight: 700; }
    `,
  ],
})
export class ToothSvgComponent {
  readonly number = input.required<number>();
  readonly condition = input.required<ToothCondition>();

  fillColor(): string {
    switch (this.condition()) {
      case 'SAINE': return '#fff';
      case 'CARIE': return '#f4c2b9';
      case 'ABSENTE':
      case 'EXTRACTEE': return '#e7ecee';
      case 'OBTURATION': return '#a9dbd2';
      case 'COURONNE': return '#f7dfa0';
      case 'IMPLANT': return '#b9def2';
      case 'DEVIALISEE': return '#d9c7f5';
      case 'EXTRACTION_INDIQUEE': return '#f4c89e';
      case 'FRACTURE': return '#e2a2a2';
      case 'PROTHESE': return '#b8e4e9';
      default: return '#fff';
    }
  }
}
