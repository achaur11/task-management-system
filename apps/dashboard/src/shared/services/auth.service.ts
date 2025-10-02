import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthState, User, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private apiService = inject(ApiService);

  // Signals for reactive state management
  private _authState = signal<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false
  });

  // Public readonly signals
  readonly authState = this._authState.asReadonly();
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly user = computed(() => this._authState().user);
  readonly token = computed(() => {
    const token = this._authState().token;
    console.log('🔍 AuthService - Token getter called, returning:', token ? 'Present' : 'Missing');
    return token;
  });

  // Legacy BehaviorSubject for compatibility
  private authStateSubject = new BehaviorSubject<AuthState>(this._authState());
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user') || localStorage.getItem('auth_user');
    
    console.log('🔍 AuthService - Initializing auth, token found:', !!token);
    console.log('🔍 AuthService - User found:', !!userStr);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🔍 AuthService - Setting auth state with token:', token.substring(0, 20) + '...');
        this.setAuthState({ token, user, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuth();
      }
    }
  }

  private setAuthState(state: AuthState): void {
    console.log('🔍 AuthService - Setting auth state:', { 
      hasToken: !!state.token, 
      hasUser: !!state.user, 
      isAuthenticated: state.isAuthenticated 
    });
    
    this._authState.set(state);
    this.authStateSubject.next(state);
    
    if (state.token && state.user) {
      console.log('🔍 AuthService - Storing token:', state.token.substring(0, 20) + '...');
      localStorage.setItem('accessToken', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
      // Clean up old keys
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Verify the token is stored
      const storedToken = localStorage.getItem('accessToken');
      console.log('🔍 AuthService - Token verification - stored:', !!storedToken);
    }
  }

  private clearAuth(): void {
    this.setAuthState({ token: null, user: null, isAuthenticated: false });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  async login(credentials: LoginRequest): Promise<void> {
    try {
      console.log('🔍 AuthService - Starting login process');
      const response = await this.apiService.login(credentials).toPromise();
      console.log('🔍 AuthService - Login response:', response);
      
      if (response) {
        console.log('🔍 AuthService - Setting auth state with response');
        // Handle the nested response structure
        const authData = response.data || response;
        this.setAuthState({
          token: authData.accessToken,
          user: authData.user,
          isAuthenticated: true
        });
        console.log('🔍 AuthService - Auth state set, navigating to tasks');
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          this.router.navigate(['/tasks']);
        }, 100);
      } else {
        console.error('🔍 AuthService - No response received from login');
      }
    } catch (error) {
      console.error('🔍 AuthService - Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<void> {
    try {
      const response = await this.apiService.register(userData).toPromise();
      if (response) {
        // After registration, automatically log in
        await this.login({
          email: userData.email,
          password: userData.password
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    const user = this.user();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.user();
    return user ? roles.includes(user.role) : false;
  }

  canAccessAudit(): boolean {
    return this.hasAnyRole(['Admin', 'Owner']);
  }

  // Method to refresh user data
  async refreshUser(): Promise<void> {
    if (!this.isAuthenticated()) return;
    
    try {
      const user = await this.apiService.getCurrentUser().toPromise();
      if (user) {
        const currentState = this._authState();
        this.setAuthState({
          ...currentState,
          user: user
        });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, logout user
      this.logout();
    }
  }
}
