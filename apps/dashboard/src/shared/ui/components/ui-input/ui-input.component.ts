import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <label *ngIf="label" [for]="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>
      <input
        [id]="id"
        [type]="type"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class]="inputClasses"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()"
      />
      <p *ngIf="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      <p *ngIf="hint && !error" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ hint }}</p>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ],
  styles: []
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;

  value = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get inputClasses(): string {
    let classes = 'input-field';
    
    if (this.error) classes += ' border-red-500';
    if (this.disabled) classes += ' opacity-50 cursor-not-allowed';
    
    return classes;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onFocus(): void {
    // Handle focus if needed
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
