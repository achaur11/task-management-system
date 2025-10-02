import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UiInputComponent } from '../../../shared/ui/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../shared/ui/components/ui-button/ui-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiInputComponent, UiButtonComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or
            <a routerLink="/register" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              create a new account
            </a>
          </p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="space-y-4">
            <app-ui-input
              id="email"
              type="email"
              label="Email address"
              placeholder="Enter your email"
              formControlName="email"
              [error]="getFieldError('email')"
              [required]="true"
            />
            
            <app-ui-input
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              formControlName="password"
              [error]="getFieldError('password')"
              [required]="true"
            />
          </div>

          <div>
            <app-ui-button
              type="submit"
              variant="primary"
              size="lg"
              [fullWidth]="true"
              [loading]="isLoading"
              [disabled]="loginForm.invalid || isLoading"
            >
              Sign in
            </app-ui-button>
          </div>

          <div *ngIf="errorMessage" class="rounded-md bg-red-50 dark:bg-red-900 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ errorMessage }}
                </h3>
              </div>
            </div>
          </div>
        </form>

        <!-- Demo credentials -->
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Demo Credentials:</h3>
          <div class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div><strong>Owner:</strong> john.doe@acme.com / password123</div>
            <div><strong>Admin:</strong> jane.smith@acme.com / password123</div>
            <div><strong>Viewer:</strong> bob.wilson@acme.com / password123</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.loginForm.value);
      this.toastService.success('Login successful!');
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
      this.toastService.error(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return 'Password must be at least 6 characters';
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
