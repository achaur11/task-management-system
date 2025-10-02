import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Top Navigation -->
      <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <!-- Left side - Logo and nav -->
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Task Manager
                </h1>
              </div>
              
              <!-- Desktop navigation -->
              <div class="hidden md:ml-6 md:flex md:space-x-8">
                <a 
                  routerLink="/tasks" 
                  routerLinkActive="border-blue-500 text-gray-900 dark:text-gray-100"
                  class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Tasks
                </a>
                <a 
                  *ngIf="canAccessAudit()"
                  routerLink="/audit" 
                  routerLinkActive="border-blue-500 text-gray-900 dark:text-gray-100"
                  class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                >
                  Audit
                </a>
              </div>
            </div>

            <!-- Right side - Theme toggle and user menu -->
            <div class="flex items-center space-x-4">
              <!-- Theme toggle -->
              <button
                (click)="toggleTheme()"
                class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Toggle theme"
              >
                <svg *ngIf="theme() === 'light'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <svg *ngIf="theme() === 'dark'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>

              <!-- User menu -->
              <div class="relative" #userMenu>
                <button
                  (click)="toggleUserMenu()"
                  class="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {{ getUserInitials() }}
                  </div>
                  <span class="hidden md:block text-sm font-medium">{{ user()?.displayName }}</span>
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown menu -->
                <div 
                  *ngIf="showUserMenu"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div class="py-1">
                    <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <div class="font-medium">{{ user()?.displayName }}</div>
                      <div class="text-gray-500 dark:text-gray-400">{{ user()?.email }}</div>
                      <div class="text-xs text-blue-600 dark:text-blue-400">{{ user()?.role }}</div>
                    </div>
                    <button
                      (click)="logout()"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile menu -->
        <div *ngIf="showMobileMenu" class="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div class="px-2 pt-2 pb-3 space-y-1">
            <a 
              routerLink="/tasks" 
              routerLinkActive="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium"
            >
              Tasks
            </a>
            <a 
              *ngIf="canAccessAudit()"
              routerLink="/audit" 
              routerLinkActive="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 block px-3 py-2 rounded-md text-base font-medium"
            >
              Audit
            </a>
          </div>
        </div>
      </nav>

      <!-- Main content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let toast of toasts()"
        class="max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out"
        [class]="getToastClasses(toast.type)"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg *ngIf="toast.type === 'success'" class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'error'" class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'warning'" class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'info'" class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ toast.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              (click)="removeToast(toast.id)"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AppLayoutComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  showUserMenu = false;
  showMobileMenu = false;

  user = computed(() => this.authService.user());
  theme = computed(() => this.themeService.theme());
  toasts = computed(() => this.toastService.toasts());

  canAccessAudit(): boolean {
    return this.authService.canAccessAudit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user?.displayName) return '?';
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  getToastClasses(type: string): string {
    const baseClasses = 'transform transition-all duration-300 ease-in-out';
    switch (type) {
      case 'success':
        return `${baseClasses} animate-slide-up`;
      case 'error':
        return `${baseClasses} animate-slide-up`;
      case 'warning':
        return `${baseClasses} animate-slide-up`;
      case 'info':
        return `${baseClasses} animate-slide-up`;
      default:
        return baseClasses;
    }
  }
}
