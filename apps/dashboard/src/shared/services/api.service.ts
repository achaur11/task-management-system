import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models/auth.model';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters, PaginatedTasks } from '../models/task.model';
import { AuditLog, AuditFilters, PaginatedAuditLogs } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth endpoints
  login(credentials: LoginRequest): Observable<any> {
    console.log('🔍 ApiService - Making login request to:', `${this.baseUrl}/auth/login`);
    console.log('🔍 ApiService - Credentials:', { email: credentials.email, password: '***' });
    return this.http.post<{ data: any }>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(map(response => response.data));
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<{ data: RegisterResponse }>(`${this.baseUrl}/auth/register`, userData)
      .pipe(map(response => response.data));
  }

  getCurrentUser(): Observable<any> {
    return this.http.get<{ data: any }>(`${this.baseUrl}/auth/me`)
      .pipe(map(response => response.data));
  }

  // Task endpoints
  getTasks(filters: TaskFilters = {}): Observable<PaginatedTasks> {
    let params = new HttpParams();
    
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);

    return this.http.get<{ data: PaginatedTasks }>(`${this.baseUrl}/tasks`, { params })
      .pipe(map(response => response.data));
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<{ data: Task }>(`${this.baseUrl}/tasks/${id}`)
      .pipe(map(response => response.data));
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<{ data: Task }>(`${this.baseUrl}/tasks`, task)
      .pipe(map(response => response.data));
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<{ data: Task }>(`${this.baseUrl}/tasks/${id}`, task)
      .pipe(map(response => response.data));
  }

  deleteTask(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ data: { success: boolean } }>(`${this.baseUrl}/tasks/${id}`)
      .pipe(map(response => response.data));
  }

  // Audit endpoints
  getAuditLogs(filters: AuditFilters = {}): Observable<PaginatedAuditLogs> {
    let params = new HttpParams();
    
    if (filters.action) params = params.set('action', filters.action);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType);
    if (filters.resourceId) params = params.set('resourceId', filters.resourceId);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<{ data: PaginatedAuditLogs }>(`${this.baseUrl}/audit-log`, { params })
      .pipe(map(response => response.data));
  }
}
