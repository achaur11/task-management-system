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
              <div class="flex-shrink-0 flex items-center notion-logo">
                <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Task Manager
                </h1>
              </div>
              
              <!-- Desktop navigation -->
              <div class="hidden md:ml-8 md:flex md:space-x-3 notion-nav-group">
                <button 
                  routerLink="/tasks" 
                  routerLinkActive="notion-nav-active"
                  class="notion-nav-btn"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Tasks
                </button>
                <button 
                  *ngIf="canAccessAudit()"
                  routerLink="/audit" 
                  routerLinkActive="notion-nav-active"
                  class="notion-nav-btn"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Audit
                </button>
                <button 
                  *ngIf="isOwner()"
                  routerLink="/register" 
                  routerLinkActive="notion-nav-active"
                  class="notion-nav-btn"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register User
                </button>
              </div>
            </div>

            <!-- Right side - Mobile menu, Theme toggle and user menu -->
            <div class="flex items-center space-x-8">
              <!-- Theme toggle -->
              <button
                (click)="toggleTheme()"
                class="notion-theme-toggle"
                [title]="theme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
              >
                <div class="notion-theme-icon-container">
                  <svg *ngIf="theme() === 'light'" class="notion-theme-icon notion-theme-moon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <svg *ngIf="theme() === 'dark'" class="notion-theme-icon notion-theme-sun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span class="notion-theme-label">{{ theme() === 'light' ? 'Dark' : 'Light' }}</span>
              </button>

              <!-- User menu -->
              <div class="relative" #userMenu>
                <button
                  (click)="toggleUserMenu()"
                  class="notion-user-menu-btn"
                >
                  <div class="notion-user-avatar">
                    {{ getUserInitials() }}
                  </div>
                  <div class="hidden md:block notion-user-info">
                    <div class="notion-user-name">{{ user()?.displayName }}</div>
                    <div class="notion-user-role">{{ user()?.role }}</div>
                  </div>
                  <svg class="notion-user-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown menu -->
                <div 
                  *ngIf="showUserMenu"
                  class="notion-user-dropdown"
                >
                  <div class="notion-user-dropdown-content">
                    <div class="notion-user-profile">
                      <div class="notion-user-profile-avatar">
                        {{ getUserInitials() }}
                      </div>
                      <div class="notion-user-profile-info">
                        <div class="notion-user-profile-name">{{ user()?.displayName }}</div>
                        <div class="notion-user-profile-email">{{ user()?.email }}</div>
                        <div class="notion-user-profile-role">{{ user()?.role }}</div>
                      </div>
                    </div>
                    <div class="notion-user-dropdown-divider"></div>
                    <button
                      (click)="logout()"
                      class="notion-user-logout-btn"
                    >
                      <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </nav>

      <!-- Main content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Toast notifications -->
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts()"
        class="toast-item"
        [class]="'toast-' + toast.type"
      >
        <div class="toast-content">
          <div class="toast-icon">
            <svg *ngIf="toast.type === 'success'" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'error'" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'warning'" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'info'" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="toast-message">
            {{ toast.message }}
          </div>
          <button
            (click)="removeToast(toast.id)"
            class="toast-close"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

  user = computed(() => this.authService.user());
  theme = computed(() => this.themeService.theme());
  toasts = computed(() => this.toastService.toasts());

  canAccessAudit(): boolean {
    return this.authService.canAccessAudit();
  }

  isOwner(): boolean {
    return this.authService.hasRole('Owner');
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

}
