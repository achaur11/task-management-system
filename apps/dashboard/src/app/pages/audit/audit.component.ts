import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';
import { ApiService } from '../../../shared/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuditLog, AuditAction, AuditFilters } from '../../../shared/models/audit.model';
import { UiButtonComponent } from '../../../shared/ui/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/ui/components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiBadgeComponent],
  template: `
    <div class="notion-page">
      <!-- Page Header -->
      <div class="notion-card-header">
        <div>
          <h1 class="text-3xl font-semibold mb-2">Audit Logs</h1>
          <p class="notion-text-muted">
            View system activity and track changes across your organization
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="notion-card notion-mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Action Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Action
            </label>
            <select
              [(ngModel)]="filters.action"
              class="notion-select"
              (change)="loadAuditLogs()"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="READ">Read</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <!-- Resource Type Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Resource Type
            </label>
            <select
              [(ngModel)]="filters.resourceType"
              class="notion-select"
              (change)="loadAuditLogs()"
            >
              <option value="">All Types</option>
              <option value="Task">Task</option>
              <option value="User">User</option>
              <option value="Organization">Organization</option>
            </select>
          </div>

          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium mb-2">
              From Date
            </label>
            <input
              type="date"
              [(ngModel)]="filters.from"
              class="notion-input"
              (change)="loadAuditLogs()"
            />
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium mb-2">
              To Date
            </label>
            <input
              type="date"
              [(ngModel)]="filters.to"
              class="notion-input"
              (change)="loadAuditLogs()"
            />
          </div>

          <!-- Resource ID -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Resource ID
            </label>
            <input
              type="text"
              [(ngModel)]="filters.resourceId"
              placeholder="Specific resource ID"
              class="notion-input"
              (keyup.enter)="loadAuditLogs()"
            />
          </div>
        </div>

        <div class="notion-flex notion-items-center notion-justify-between notion-mt-4">
          <app-ui-button
            (click)="loadAuditLogs()"
            class="notion-btn-secondary"
          >
            Apply Filters
          </app-ui-button>
          
          <div class="notion-text-small notion-text-muted">
            {{ paginatedAuditLogs()?.total || 0 }} logs found
          </div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="notion-card">
        <div class="overflow-x-auto">
          <table class="notion-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of (paginatedAuditLogs()?.data || [])">
                <td>
                  <app-ui-badge
                    [variant]="getActionVariant(log.action)"
                    size="sm"
                  >
                    {{ log.action }}
                  </app-ui-badge>
                </td>
                <td>
                  <div>
                    <div class="font-medium">
                      {{ log.user?.displayName || 'Unknown' }}
                    </div>
                    <div class="notion-text-small notion-text-muted">
                      {{ log.user?.email || log.userId }}
                    </div>
                  </div>
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ log.resourceType }}
                </td>
                <td class="notion-text-small notion-text-muted font-mono">
                  {{ log.resourceId }}
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ formatDateTime(log.timestamp) }}
                </td>
                <td class="notion-text-small notion-text-muted max-w-xs">
                  <div *ngIf="log.metadata" class="truncate">
                    {{ formatMetadata(log.metadata) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div *ngIf="!paginatedAuditLogs()?.data || !paginatedAuditLogs()?.data?.length" class="notion-empty">
          <div class="notion-empty-icon">
            <svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="notion-empty-title">No audit logs</h3>
          <p class="notion-empty-description">
            No audit logs match your current filters
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="paginatedAuditLogs()?.total && paginatedAuditLogs()!.total > 0" class="notion-flex notion-items-center notion-justify-between notion-mt-4">
        <div class="notion-text-small notion-text-muted">
          Showing {{ ((paginatedAuditLogs()!.page - 1) * paginatedAuditLogs()!.pageSize) + 1 }} to 
          {{ Math.min(paginatedAuditLogs()!.page * paginatedAuditLogs()!.pageSize, paginatedAuditLogs()!.total) }} of 
          {{ paginatedAuditLogs()!.total }} results
        </div>
        <div class="notion-flex notion-gap-2">
          <app-ui-button
            (click)="previousPage()"
            class="notion-btn-secondary"
            [disabled]="filters.page === 1"
          >
            Previous
          </app-ui-button>
          <app-ui-button
            (click)="nextPage()"
            class="notion-btn-secondary"
            [disabled]="!this.filters?.page || !this.filters?.pageSize || ((this.filters.page! * this.filters.pageSize!) >= (paginatedAuditLogs()?.total || 0))"
          >
            Next
          </app-ui-button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AuditComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  // Signals for reactive state
  paginatedAuditLogs = signal<any>({
    data: [],
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Filters
  filters: AuditFilters = {
    page: 1,
    pageSize: 20
  };

  // Make Math available in template
  Math = Math;

  constructor() {
    // Check if user has access to audit logs
    if (this.authService && !this.authService.canAccessAudit()) {
      this.toastService?.error('You do not have permission to view audit logs');
      // Redirect to tasks page
      // this.router.navigate(['/tasks']);
    }
    
    this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    try {
      const response = await this.apiService?.getAuditLogs(this.filters).toPromise();
      console.log('🔍 Audit API Response:', response);
      
      // Ensure we have a valid response with data array
      if (response && Array.isArray(response.data)) {
        this.paginatedAuditLogs.set(response);
      } else {
        console.warn('Invalid audit response structure:', response);
        this.paginatedAuditLogs.set({
          data: [],
          page: 1,
          pageSize: 20,
          total: 0
        });
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      this.toastService?.error('Failed to load audit logs');
      // Set empty state on error
      this.paginatedAuditLogs.set({
        data: [],
        page: 1,
        pageSize: 20,
        total: 0
      });
    }
  }

  getActionVariant(action: AuditAction): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch (action) {
      case AuditAction.CREATE:
        return 'success';
      case AuditAction.READ:
        return 'info';
      case AuditAction.UPDATE:
        return 'warning';
      case AuditAction.DELETE:
        return 'danger';
      default:
        return 'default';
    }
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatMetadata(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  previousPage(): void {
    if (this.filters?.page && this.filters?.page > 1) {
      this.filters.page--;
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    const paginatedData = this.paginatedAuditLogs();
    if (!paginatedData) return;
    
    const total = paginatedData.total || 0;
    if ((this.filters?.page && this.filters?.pageSize) && ((this.filters.page! * this.filters.pageSize!) < total)) {
      this.filters.page++;
      this.loadAuditLogs();
    }
  }
}
