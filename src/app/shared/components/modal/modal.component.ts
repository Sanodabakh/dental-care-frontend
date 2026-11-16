import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="backdrop" (click)="closed.emit()" (keydown.escape)="closed.emit()">
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <header><h2>{{ title() }}</h2><button type="button" aria-label="Fermer" (click)="closed.emit()">×</button></header>
          <ng-content />
        </section>
      </div>
    }
  `,
  styles: [
    `
      .backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 20px; background: rgb(16 43 58 / 48%); }
      .dialog { width: min(100%, 560px); padding: 24px; border-radius: 14px; background: #fff; box-shadow: 0 20px 70px rgb(16 43 58 / 22%); }
      header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
      h2 { margin: 0; font: 700 18px 'Manrope', sans-serif; }
      button { border: 0; background: transparent; color: #70808a; font-size: 25px; }
    `,
  ],
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('Détails');
  readonly closed = output<void>();
}
