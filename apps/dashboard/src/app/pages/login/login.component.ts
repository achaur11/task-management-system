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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-1/2">
        <!-- Card Container -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700">
          <!-- Header Section -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>
          
          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-5">
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

            <div class="pt-2">
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

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 animate-in fade-in">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800 dark:text-red-200">
                    {{ errorMessage }}
                  </p>
                </div>
              </div>
            </div>
          </form>

          <!-- Register Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?
              <a routerLink="/register" class="ml-1 font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Create one now
              </a>
            </p>
          </div>

          <!-- Demo Credentials Section -->
          <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <h3 class="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wide mb-3 text-center">
                Demo Credentials
              </h3>
              <br>
              
              <div class="space-y-2.5 text-xs text-blue-800 dark:text-blue-300">
                <div class="flex items-start">
                  <span class="font-semibold min-w-[50px]">Owner: &nbsp;</span>
                  <span class="ml-2 font-mono text-blue-700 dark:text-blue-400">john.doe@acme.com / password123</span>
                </div>
                <div class="flex items-start">
                  <span class="font-semibold min-w-[50px]">Admin: &nbsp;</span>
                  <span class="ml-2 font-mono text-blue-700 dark:text-blue-400">jane.smith@acme.com / password123</span>
                </div>
                <div class="flex items-start">
                  <span class="font-semibold min-w-[50px]">Viewer: &nbsp;</span>
                  <span class="ml-2 font-mono text-blue-700 dark:text-blue-400">bob.wilson@acme.com / password123</span>
                </div>
              </div>
            </div>
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
