import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="onClick.emit($event)"
    >
      <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() fullWidth = false;

  @Output() onClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    let classes = 'btn-primary';
    
    if (this.variant === 'secondary') classes = 'btn-secondary';
    if (this.variant === 'danger') classes = 'btn-danger';
    if (this.variant === 'ghost') classes = 'btn-ghost';
    
    if (this.size === 'sm') classes += ' btn-sm';
    if (this.size === 'lg') classes += ' btn-lg';
    
    if (this.fullWidth) classes += ' w-full';
    
    if (this.disabled || this.loading) classes += ' opacity-50 cursor-not-allowed';
    
    return classes;
  }
}
