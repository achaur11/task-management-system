import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ApiService } from '../../../shared/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UiInputComponent } from '../../../shared/ui/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../shared/ui/components/ui-button/ui-button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiInputComponent, UiButtonComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <!-- Card Container -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700">
          <!-- Header Section -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Register New User
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Add a new user to your organization
            </p>
          </div>
          
          <!-- Registration Form -->
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
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
                placeholder="Enter your password (min. 8 characters)"
                formControlName="password"
                [error]="getFieldError('password')"
                [required]="true"
              />

              <app-ui-input
                id="displayName"
                type="text"
                label="Display Name"
                placeholder="Enter display name"
                formControlName="displayName"
                [error]="getFieldError('displayName')"
                [required]="true"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (Optional)
                </label>
                <select
                  formControlName="role"
                  class="notion-select"
                >
                  <option value="">Select a role (default: Viewer)</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
            </div>

            <div class="pt-2">
              <app-ui-button
                type="submit"
                variant="primary"
                size="lg"
                [fullWidth]="true"
                [loading]="isLoading"
                [disabled]="registerForm.invalid || isLoading"
              >
                Register User
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
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    displayName: ['', [Validators.required, Validators.maxLength(50)]],
    role: ['']
  });

  ngOnInit(): void {
    // Check if user is Owner
    if (!this.authService.hasRole('Owner')) {
      this.router.navigate(['/tasks']);
      this.toastService.error('Only Owners can register new users');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const currentUser = this.authService.user();
      if (!currentUser || !currentUser.orgId) {
        throw new Error('Unable to determine your organization');
      }

      const formValue = this.registerForm.value;
      const registerData = {
        email: formValue.email,
        password: formValue.password,
        displayName: formValue.displayName,
        orgId: currentUser.orgId, // Use Owner's organization
        ...(formValue.role && { role: formValue.role })
      };

      // Call API directly (don't use AuthService.register which auto-logs in)
      await this.apiService.register(registerData).toPromise();
      this.toastService.success('User registered successfully!');
      this.registerForm.reset();
      // Optionally redirect back to tasks
      // this.router.navigate(['/tasks']);
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Registration failed. Please check your information and try again.';
      this.toastService.error(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return 'Password must be at least 8 characters';
      }
      if (field.errors['maxlength']) {
        return 'Display name must be less than 50 characters';
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}

