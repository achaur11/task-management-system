import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `,
  styles: []
})
export class UiBadgeComponent {
  @Input() variant: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() size: 'sm' | 'md' = 'md';

  get badgeClasses(): string {
    let classes = 'badge';
    
    classes += ` badge-${this.variant}`;
    
    if (this.size === 'sm') classes += ' text-xs';
    if (this.size === 'md') classes += ' text-sm';
    
    return classes;
  }
}
