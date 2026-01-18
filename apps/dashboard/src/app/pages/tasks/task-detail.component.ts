import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../shared/services/api.service';
import { Task, TaskStatus, TaskCategory } from '../../../shared/models/task.model';
import { AuditLog, AuditAction } from '../../../shared/models/audit.model';
import { UiBadgeComponent } from '../../../shared/ui/components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, UiBadgeComponent],
  template: `
    <!-- Overlay backdrop -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
      (click)="close()"
      style="position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 9998 !important; pointer-events: auto !important;"
    ></div>

    <!-- Modal container - centered -->
    <div 
      class="fixed inset-0 flex items-center justify-center p-4"
      (click)="close()"
      style="position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 9999 !important; pointer-events: none !important; display: flex !important; align-items: center !important; justify-content: center !important;"
    >
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
        style="pointer-events: auto !important; position: relative !important; width: 90vw !important; max-width: 1400px !important; max-height: 90vh !important; margin: 0 auto !important;"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Task Details</h2>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Close"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
          <!-- Left Panel - Task Details -->
          <div class="flex-1 overflow-y-auto p-6 border-r border-gray-200 dark:border-gray-700">
            <div class="space-y-6">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ task()?.title || 'Untitled Task' }}
                </h3>
              </div>

              <!-- Status & Category -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <app-ui-badge
                    [variant]="getStatusVariant(task()?.status)"
                    size="md"
                  >
                    {{ task()?.status }}
                  </app-ui-badge>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <app-ui-badge
                    [variant]="getCategoryVariant(task()?.category)"
                    size="md"
                  >
                    {{ task()?.category }}
                  </app-ui-badge>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <p class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap min-h-[60px]">
                  {{ task()?.description || 'No description provided' }}
                </p>
              </div>

              <!-- Task Metadata -->
              <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created
                  </label>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(task()?.createdAt) }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated
                  </label>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatDate(task()?.updatedAt) }}
                  </p>
                </div>
                <div *ngIf="lastUpdatedBy()">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated By
                  </label>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ lastUpdatedBy() }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Panel - Task History -->
          <div class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Task History</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                All changes and activities for this task
              </p>
            </div>

            <div *ngIf="isLoading()" class="flex items-center justify-center py-8">
              <div class="text-gray-600 dark:text-gray-400">Loading history...</div>
            </div>

            <div *ngIf="!isLoading() && auditLogs().length === 0" class="flex items-center justify-center py-8">
              <div class="text-center">
                <p class="text-gray-600 dark:text-gray-400">No history available</p>
              </div>
            </div>

            <div *ngIf="!isLoading() && auditLogs().length > 0" class="space-y-4">
              <div
                *ngFor="let log of auditLogs()"
                class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span 
                      class="px-2 py-1 text-xs font-semibold rounded"
                      [ngClass]="getActionBadgeClass(log.action)"
                    >
                      {{ log.action }}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      by {{ log.user?.displayName || log.user?.email || 'Unknown' }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-500">
                    {{ formatDateTime(log.timestamp) }}
                  </span>
                </div>
                <div *ngIf="log.metadata" class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <div *ngIf="log.metadata['changes']" class="space-y-1">
                    <div *ngFor="let change of getMetadataChanges(log.metadata)">
                      <span class="font-medium">{{ change.field }}:</span>
                      <span *ngIf="change.oldValue" class="text-gray-500 dark:text-gray-400">
                        "{{ change.oldValue }}" → 
                      </span>
                      <span>{{ change.newValue }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9998 !important;
    }
  `]
})
export class TaskDetailComponent implements OnInit {
  @Input() set taskInput(value: Task | null) {
    this.task.set(value);
    if (value) {
      this.loadAuditLogs();
    }
  }
  @Output() closeEvent = new EventEmitter<void>();

  private apiService = inject(ApiService);

  task = signal<Task | null>(null);
  auditLogs = signal<AuditLog[]>([]);
  isLoading = signal(false);
  lastUpdatedBy = signal<string | null>(null);

  ngOnInit(): void {
    // Task input is handled via setter
  }

  private async loadAuditLogs(): Promise<void> {
    const currentTask = this.task();
    if (!currentTask) return;

    this.isLoading.set(true);
    try {
      const response = await this.apiService.getAuditLogs({
        resourceType: 'Task',
        resourceId: currentTask.id,
        page: 1,
        pageSize: 100 // Get all history for this task
      }).toPromise();

      if (response?.data) {
        // Sort by timestamp descending (newest first)
        const sorted = [...response.data].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.auditLogs.set(sorted);

        // Find the most recent UPDATE action to get "last updated by"
        const lastUpdate = sorted.find(log => log.action === AuditAction.UPDATE);
        if (lastUpdate?.user) {
          this.lastUpdatedBy.set(lastUpdate.user.displayName || lastUpdate.user.email || null);
        }
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  close(): void {
    this.closeEvent.emit();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusVariant(status?: TaskStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case TaskStatus.Done:
        return 'success';
      case TaskStatus.InProgress:
        return 'warning';
      case TaskStatus.Backlog:
        return 'info';
      default:
        return 'default';
    }
  }

  getCategoryVariant(category?: TaskCategory): 'danger' | 'success' | 'warning' | 'info' | 'default' {
    switch (category) {
      case TaskCategory.Work:
        return 'info';
      case TaskCategory.Personal:
        return 'warning';
      case TaskCategory.Learning:
        return 'success';
      default:
        return 'default';
    }
  }

  getActionBadgeClass(action: AuditAction): string {
    switch (action) {
      case AuditAction.CREATE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case AuditAction.UPDATE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case AuditAction.DELETE:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case AuditAction.READ:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getMetadataChanges(metadata: Record<string, any>): Array<{ field: string; oldValue?: string; newValue: string }> {
    if (!metadata['changes']) return [];
    
    const changes: Array<{ field: string; oldValue?: string; newValue: string }> = [];
    const changesObj = metadata['changes'];
    
    Object.keys(changesObj).forEach(field => {
      const change = changesObj[field];
      if (typeof change === 'object' && change !== null) {
        changes.push({
          field: field.charAt(0).toUpperCase() + field.slice(1),
          oldValue: change['oldValue'],
          newValue: change['newValue']
        });
      } else {
        changes.push({
          field: field.charAt(0).toUpperCase() + field.slice(1),
          newValue: String(change)
        });
      }
    });
    
    return changes;
  }
}

