import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../shared/services/auth.service';
import { ApiService } from '../../../shared/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Task, TaskStatus, TaskCategory, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../../../shared/models/task.model';
import { UiButtonComponent } from '../../../shared/ui/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/ui/components/ui-badge/ui-badge.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    UiButtonComponent,
    UiBadgeComponent
  ],
  template: `
    <div class="notion-page">
      <!-- Page Header -->
      <div class="notion-card-header">
        <div class="notion-flex notion-items-center notion-justify-between notion-card-header-inner">
          <div>
            <h1 class="text-3xl font-semibold mb-2">Tasks</h1>
            <p class="notion-text-muted">
              Manage your organization's tasks and stay organized
            </p>
          </div>
          <div class="notion-flex notion-items-center notion-gap-3">
            <!-- View Toggle -->
            <div class="notion-flex notion-items-center notion-gap-1 notion-bg-gray-100 dark:notion-bg-gray-700 notion-rounded-lg notion-p-1">
              <button
                (click)="setView('table')"
                [class]="view() === 'table' ? 'notion-view-toggle notion-view-toggle-active' : 'notion-view-toggle'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Table
              </button>
              <button
                (click)="setView('kanban')"
                [class]="view() === 'kanban' ? 'notion-view-toggle notion-view-toggle-active' : 'notion-view-toggle'"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Kanban
              </button>
            </div>
            
            <app-ui-button
              (click)="openCreateModal()"
              class="notion-btn notion-btn-primary"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </app-ui-button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="notion-card notion-mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              [(ngModel)]="filters.q"
              placeholder="Search tasks..."
              class="notion-input"
              (keyup.enter)="loadTasks()"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              [(ngModel)]="filters.status"
              class="notion-select"
              (change)="loadTasks()"
            >
              <option value="">All Statuses</option>
              <option value="Backlog">Backlog</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              [(ngModel)]="filters.category"
              class="notion-select"
              (change)="loadTasks()"
            >
              <option value="">All Categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Learning">Learning</option>
            </select>
          </div>
        </div>

        <div class="notion-flex notion-items-center notion-justify-between notion-mt-4">
          <app-ui-button
            (click)="loadTasks()"
            class="notion-btn-secondary"
          >
            Apply Filters
          </app-ui-button>
          
          <div class="notion-text-small notion-text-muted">
            {{ paginatedTasks()?.total || 0 }} tasks found
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div *ngIf="view() === 'kanban'" class="notion-kanban-board">
        <div class="notion-kanban-columns">
          <!-- Backlog Column -->
          <div class="notion-kanban-column">
            <div class="notion-kanban-header">
              <h3 class="notion-kanban-title">Backlog</h3>
              <span class="notion-kanban-count">{{ backlogTasks().length }}</span>
            </div>
            <div 
              cdkDropList
              #backlogList="cdkDropList"
              id="backlog"
              [cdkDropListData]="backlogTasks()"
              [cdkDropListConnectedTo]="[inprogressList, doneList]"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="notion-kanban-list"
            >
              <div 
                *ngFor="let task of backlogTasks()"
                cdkDrag
                [cdkDragData]="task"
                [cdkDragDisabled]="isSaving()"
                [ngClass]="{'opacity-60': isSaving()}"
                [attr.data-id]="task.id"
                [attr.data-status]="task.status"
                class="notion-kanban-card"
                [attr.aria-grabbed]="true"
              >
                <div class="notion-kanban-card-content">
                  <!-- Inline editable title -->
                  <h4 
                    *ngIf="editingInlineId !== task.id || inlineField !== 'title'"
                    class="notion-kanban-card-title notion-inline-view"
                    (click)="startInlineEdit(task, 'title')"
                    title="Click to edit title"
                  >
                    {{ task.title || 'Untitled task' }}
                  </h4>
                  <input
                    *ngIf="editingInlineId === task.id && inlineField === 'title'"
                    class="notion-inline-input notion-kanban-card-title"
                    type="text"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  />

                  <!-- Inline editable description -->
                  <p
                    *ngIf="(editingInlineId !== task.id || inlineField !== 'description') && task.description"
                    class="notion-kanban-card-description notion-inline-view"
                    (click)="startInlineEdit(task, 'description')"
                    title="Click to edit description"
                  >
                    {{ task.description }}
                  </p>
                  <textarea
                    *ngIf="editingInlineId === task.id && inlineField === 'description'"
                    class="notion-inline-textarea notion-kanban-card-description"
                    rows="2"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="$event.preventDefault(); commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  ></textarea>
                  <div class="notion-kanban-card-meta">
                    <app-ui-badge
                      [variant]="getCategoryVariant(task.category)"
                      size="sm"
                    >
                      {{ task.category }}
                    </app-ui-badge>
                    <span class="notion-kanban-card-date">{{ formatDate(task.updatedAt) }}</span>
                  </div>
                </div>
                <div class="notion-kanban-card-actions">
                  <button
                    (click)="editTask(task)"
                    class="notion-kanban-card-action"
                    title="Edit task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    (click)="deleteTask(task)"
                    class="notion-kanban-card-action notion-kanban-card-action-danger"
                    title="Delete task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div *ngIf="backlogTasks().length === 0" class="notion-kanban-empty">
                <p class="notion-kanban-empty-text">No tasks in backlog</p>
              </div>
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="notion-kanban-column">
            <div class="notion-kanban-header">
              <h3 class="notion-kanban-title">In Progress</h3>
              <span class="notion-kanban-count">{{ inProgressTasks().length }}</span>
            </div>
            <div 
              cdkDropList
              #inprogressList="cdkDropList"
              id="inprogress"
              [cdkDropListData]="inProgressTasks()"
              [cdkDropListConnectedTo]="[backlogList, doneList]"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="notion-kanban-list"
            >
              <div 
                *ngFor="let task of inProgressTasks()"
                cdkDrag
                [cdkDragData]="task"
                [cdkDragDisabled]="isSaving()"
                [ngClass]="{'opacity-60': isSaving()}"
                [attr.data-id]="task.id"
                [attr.data-status]="task.status"
                class="notion-kanban-card"
                [attr.aria-grabbed]="true"
              >
                <div class="notion-kanban-card-content">
                  <!-- Inline editable title -->
                  <h4 
                    *ngIf="editingInlineId !== task.id || inlineField !== 'title'"
                    class="notion-kanban-card-title notion-inline-view"
                    (click)="startInlineEdit(task, 'title')"
                    title="Click to edit title"
                  >
                    {{ task.title || 'Untitled task' }}
                  </h4>
                  <input
                    *ngIf="editingInlineId === task.id && inlineField === 'title'"
                    class="notion-inline-input notion-kanban-card-title"
                    type="text"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  />

                  <!-- Inline editable description -->
                  <p
                    *ngIf="(editingInlineId !== task.id || inlineField !== 'description') && task.description"
                    class="notion-kanban-card-description notion-inline-view"
                    (click)="startInlineEdit(task, 'description')"
                    title="Click to edit description"
                  >
                    {{ task.description }}
                  </p>
                  <textarea
                    *ngIf="editingInlineId === task.id && inlineField === 'description'"
                    class="notion-inline-textarea notion-kanban-card-description"
                    rows="2"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="$event.preventDefault(); commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  ></textarea>
                  <div class="notion-kanban-card-meta">
                    <app-ui-badge
                      [variant]="getCategoryVariant(task.category)"
                      size="sm"
                    >
                      {{ task.category }}
                    </app-ui-badge>
                    <span class="notion-kanban-card-date">{{ formatDate(task.updatedAt) }}</span>
                  </div>
                </div>
                <div class="notion-kanban-card-actions">
                  <button
                    (click)="editTask(task)"
                    class="notion-kanban-card-action"
                    title="Edit task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    (click)="deleteTask(task)"
                    class="notion-kanban-card-action notion-kanban-card-action-danger"
                    title="Delete task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div *ngIf="inProgressTasks().length === 0" class="notion-kanban-empty">
                <p class="notion-kanban-empty-text">No tasks in progress</p>
              </div>
            </div>
          </div>

          <!-- Done Column -->
          <div class="notion-kanban-column">
            <div class="notion-kanban-header">
              <h3 class="notion-kanban-title">Done</h3>
              <span class="notion-kanban-count">{{ doneTasks().length }}</span>
            </div>
            <div 
              cdkDropList
              #doneList="cdkDropList"
              id="done"
              [cdkDropListData]="doneTasks()"
              [cdkDropListConnectedTo]="[backlogList, inprogressList]"
              (cdkDropListDropped)="onTaskDrop($event)"
              class="notion-kanban-list"
            >
              <div 
                *ngFor="let task of doneTasks()"
                cdkDrag
                [cdkDragData]="task"
                [cdkDragDisabled]="isSaving()"
                [ngClass]="{'opacity-60': isSaving()}"
                [attr.data-id]="task.id"
                [attr.data-status]="task.status"
                class="notion-kanban-card"
                [attr.aria-grabbed]="true"
              >
                <div class="notion-kanban-card-content">
                  <!-- Inline editable title -->
                  <h4 
                    *ngIf="editingInlineId !== task.id || inlineField !== 'title'"
                    class="notion-kanban-card-title notion-inline-view"
                    (click)="startInlineEdit(task, 'title')"
                    title="Click to edit title"
                  >
                    {{ task.title || 'Untitled task' }}
                  </h4>
                  <input
                    *ngIf="editingInlineId === task.id && inlineField === 'title'"
                    class="notion-inline-input notion-kanban-card-title"
                    type="text"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  />

                  <!-- Inline editable description -->
                  <p
                    *ngIf="(editingInlineId !== task.id || inlineField !== 'description') && task.description"
                    class="notion-kanban-card-description notion-inline-view"
                    (click)="startInlineEdit(task, 'description')"
                    title="Click to edit description"
                  >
                    {{ task.description }}
                  </p>
                  <textarea
                    *ngIf="editingInlineId === task.id && inlineField === 'description'"
                    class="notion-inline-textarea notion-kanban-card-description"
                    rows="2"
                    [value]="inlineValue"
                    (input)="inlineValue = $any($event.target).value"
                    (blur)="commitInlineEdit(task)"
                    (keydown.enter)="$event.preventDefault(); commitInlineEdit(task)"
                    (keydown.escape)="cancelInlineEdit()"
                    autofocus
                  ></textarea>
                  <div class="notion-kanban-card-meta">
                    <app-ui-badge
                      [variant]="getCategoryVariant(task.category)"
                      size="sm"
                    >
                      {{ task.category }}
                    </app-ui-badge>
                    <span class="notion-kanban-card-date">{{ formatDate(task.updatedAt) }}</span>
                  </div>
                </div>
                <div class="notion-kanban-card-actions">
                  <button
                    (click)="editTask(task)"
                    class="notion-kanban-card-action"
                    title="Edit task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    (click)="deleteTask(task)"
                    class="notion-kanban-card-action notion-kanban-card-action-danger"
                    title="Delete task"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div *ngIf="doneTasks().length === 0" class="notion-kanban-empty">
                <p class="notion-kanban-empty-text">No completed tasks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Table -->
      <div *ngIf="view() === 'table'" class="notion-card">
        <div class="overflow-x-auto">
          <table class="notion-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Category</th>
                <th>Updated</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of (paginatedTasks()?.data || [])">
                <td>
                  <div>
                    <div class="font-medium mb-1">
                      {{ task.title }}
                    </div>
                    <div *ngIf="task.description" class="notion-text-small notion-text-muted truncate max-w-xs">
                      {{ task.description }}
                    </div>
                  </div>
                </td>
                <td>
                  <app-ui-badge
                    [variant]="getStatusVariant(task.status)"
                    size="sm"
                  >
                    {{ task.status }}
                  </app-ui-badge>
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ task.category }}
                </td>
                <td class="notion-text-small notion-text-muted">
                  {{ formatDate(task.updatedAt) }}
                </td>
                <td class="text-right">
                  <div class="notion-flex notion-justify-end notion-gap-2">
                    <button
                      (click)="editTask(task)"
                      class="notion-btn notion-btn-secondary notion-btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      (click)="deleteTask(task)"
                      class="notion-btn notion-btn-danger notion-btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div *ngIf="!paginatedTasks()?.data || !paginatedTasks()?.data?.length" class="notion-empty">
          <div class="notion-empty-icon">
            <svg class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 class="notion-empty-title">No tasks yet</h3>
          <p class="notion-empty-description">Get started by creating your first task</p>
          <app-ui-button
            (click)="openCreateModal()"
            class="notion-btn-primary"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Task
          </app-ui-button>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="paginatedTasks()?.total && paginatedTasks()!.total > 0" class="notion-flex notion-items-center notion-justify-between notion-mt-4">
        <div class="notion-text-small notion-text-muted">
          Showing {{ ((paginatedTasks()!.page - 1) * paginatedTasks()!.pageSize) + 1 }} to 
          {{ Math.min(paginatedTasks()!.page * paginatedTasks()!.pageSize, paginatedTasks()!.total) }} of 
          {{ paginatedTasks()!.total }} results
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
            [disabled]="!this.filters?.page || !this.filters?.pageSize || ((this.filters.page! * this.filters.pageSize!) >= (paginatedTasks()?.total || 0))"
          >
            Next
          </app-ui-button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Modal -->
    <div *ngIf="showModal()" class="notion-modal-overlay" (click)="closeModal()">
      <div class="notion-modal" (click)="$event.stopPropagation()">
        <div class="notion-modal-header">
          <h3 class="text-lg font-semibold">{{ editingTask() ? 'Edit Task' : 'Create Task' }}</h3>
        </div>
        <div class="notion-modal-body">
          <form [formGroup]="taskForm" (ngSubmit)="saveTask()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                formControlName="title"
                placeholder="Enter task title"
                class="notion-input"
                [class.border-red-500]="taskForm.get('title')?.invalid && taskForm.get('title')?.touched"
              />
              <p *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched" class="mt-1 text-sm text-red-600">
                Title is required
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                formControlName="description"
                placeholder="Enter task description"
                rows="3"
                class="notion-textarea"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Status
                </label>
                <select formControlName="status" class="notion-select">
                  <option value="Backlog">Backlog</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">
                  Category
                </label>
                <select formControlName="category" class="notion-select">
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="notion-modal-footer">
          <app-ui-button
            type="button"
            class="notion-btn-secondary"
            (click)="closeModal()"
          >
            Cancel
          </app-ui-button>
          <app-ui-button
            type="submit"
            class="notion-btn-primary"
            [loading]="isSaving()"
            [disabled]="taskForm.invalid || isSaving()"
            (click)="saveTask()"
          >
            {{ editingTask() ? 'Update' : 'Create' }}
          </app-ui-button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TasksComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Signals for reactive state
  paginatedTasks = signal<any>({
    data: [],
    page: 1,
    pageSize: 20,
    total: 0
  });
  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  isSaving = signal(false);
  view = signal<'table' | 'kanban'>('table');
  
  // Make enums available in template
  TaskStatus = TaskStatus;
  TaskCategory = TaskCategory;
  
  // Separate arrays for each column to enable proper drag-and-drop
  backlogTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  doneTasks = signal<Task[]>([]);

  // Inline edit state
  editingInlineId: string | null = null;
  inlineField: 'title' | 'description' | null = null;
  inlineValue = '';

  // Filters
  filters: TaskFilters = {
    page: 1,
    pageSize: 20,
    sortBy: 'updatedAt',
    sortDir: 'desc'
  };

  private fb = inject(FormBuilder);

  // Form
  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    status: ['Backlog'],
    category: ['Work']
  });

  // Computed properties
  Math = Math; // Make Math available in template

  constructor() {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    try {
      const response = await this.apiService.getTasks(this.filters).toPromise();
      console.log('🔍 Tasks API Response:', response);
      console.log('🔍 Tasks API Response data:', response?.data);
      // Ensure we have a valid response with data array
      if (response && Array.isArray(response.data)) {
        this.paginatedTasks.set(response);
        // Update separate arrays for Kanban columns
        this.updateKanbanArrays(response.data);
      } else {
        console.warn('Invalid response structure:', response);
        this.paginatedTasks.set({
          data: [],
          page: 1,
          pageSize: 20,
          total: 0
        });
        this.updateKanbanArrays([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.toastService.error('Failed to load tasks');
      // Set empty state on error
      this.paginatedTasks.set({
        data: [],
        page: 1,
        pageSize: 20,
        total: 0
      });
      this.updateKanbanArrays([]);
    }
  }

  // Inline edit handlers
  startInlineEdit(task: Task, field: 'title' | 'description'): void {
    this.editingInlineId = task.id;
    this.inlineField = field;
    this.inlineValue = (task as any)[field] || '';
  }

  cancelInlineEdit(): void {
    this.editingInlineId = null;
    this.inlineField = null;
    this.inlineValue = '';
  }

  commitInlineEdit(task: Task): void {
    if (!this.inlineField) { this.cancelInlineEdit(); return; }
    const field = this.inlineField;
    const newValue = this.inlineValue.trim();
    const oldValue = (task as any)[field] || '';

    // If unchanged, just close
    if (newValue === oldValue) { this.cancelInlineEdit(); return; }

    // Optimistic update in local caches
    (task as any)[field] = newValue;
    const current = this.paginatedTasks();
    const optimistic = current.data.map((t: Task) => t.id === task.id ? { ...t, [field]: newValue } as Task : t);
    this.paginatedTasks.set({ ...current, data: optimistic });
    this.updateKanbanArrays(optimistic);

    // Persist
    const payload: Partial<Task> = { [field]: newValue } as any;
    this.apiService.updateTask(task.id, payload as any).subscribe({
      next: (serverTask) => {
        // Merge server response
        const fresh = this.paginatedTasks();
        const synced = fresh.data.map((t: Task) => t.id === task.id ? ({ ...t, ...serverTask } as Task) : t);
        this.paginatedTasks.set({ ...fresh, data: synced });
        this.updateKanbanArrays(synced);
      },
      error: () => {
        // Revert on error
        (task as any)[field] = oldValue;
        const fresh = this.paginatedTasks();
        const reverted = fresh.data.map((t: Task) => t.id === task.id ? ({ ...t, [field]: oldValue } as Task) : t);
        this.paginatedTasks.set({ ...fresh, data: reverted });
        this.updateKanbanArrays(reverted);
        this.toastService.error('Failed to update task');
      }
    });

    this.cancelInlineEdit();
  }

  private updateKanbanArrays(tasks: Task[]): void {
    this.backlogTasks.set(tasks.filter(task => task.status === TaskStatus.Backlog));
    this.inProgressTasks.set(tasks.filter(task => task.status === TaskStatus.InProgress));
    this.doneTasks.set(tasks.filter(task => task.status === TaskStatus.Done));
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'Backlog',
      category: 'Work'
    });
    this.showModal.set(true);
  }

  editTask(task: Task): void {
    this.editingTask.set(task);
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      category: task.category
    });
    this.showModal.set(true);
  }

  async saveTask(): Promise<void> {
    if (this.taskForm.invalid) return;

    this.isSaving.set(true);

    try {
      const taskData = this.taskForm.value;
      const updateData: UpdateTaskRequest = {
        title: taskData.title || undefined,
        description: taskData.description || undefined,
        status: taskData.status as TaskStatus || undefined,
        category: taskData.category as TaskCategory || undefined
      };
      
      if (this.editingTask()) {
        await this.apiService.updateTask(this.editingTask()!.id, updateData).toPromise();
        this.toastService.success('Task updated successfully');
      } else {
        await this.apiService.createTask(taskData as CreateTaskRequest).toPromise();
        this.toastService.success('Task created successfully');
      }

      this.closeModal();
      await this.loadTasks();
    } catch (error) {
      this.toastService.error('Failed to save task');
      console.error('Error saving task:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTask(task: Task): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      await this.apiService.deleteTask(task.id).toPromise();
      this.toastService.success('Task deleted successfully');
      await this.loadTasks();
    } catch (error) {
      this.toastService.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
    this.taskForm.reset();
  }

  getStatusVariant(status: TaskStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  previousPage(): void {
    if (this.filters?.page && this.filters?.page > 1) {
      this.filters.page--;
      this.loadTasks();
    }
  }

  nextPage(): void {
    const total = this.paginatedTasks()?.total || 0;
    if ((this.filters?.page && this.filters?.pageSize) && ((this.filters.page! * this.filters.pageSize!) < total)) {
      this.filters.page++;
      this.loadTasks();
    }
  }

  // Kanban view methods
  setView(viewType: 'table' | 'kanban'): void {
    this.view.set(viewType);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.paginatedTasks()?.data?.filter((task: Task) => task.status === status) || [];
  }

  getCategoryVariant(category: TaskCategory): 'danger' | 'success' | 'warning' | 'info' | 'default' {
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

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    const sameContainer = event.previousContainer === event.container;

    if (sameContainer) {
      // Same column - reorder locally and re-set signal to trigger UI update
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.setListById(event.container.id, [...event.container.data]);
      return;
    }

    // Cross-column move
    const task = event.item.data as Task;
    const sourceId = event.previousContainer.id;
    const targetId = event.container.id;
    const newStatus = this.getStatusFromContainerId(targetId);
    const oldStatus = task.status;

    // Optimistically move item between lists
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    // Update lists' signals to trigger render
    this.setListById(sourceId, [...event.previousContainer.data]);
    this.setListById(targetId, [...event.container.data]);

    // Optimistically update task status locally (lists + paginated cache)
    task.status = newStatus;
    const current = this.paginatedTasks();
    const optimisticData = current.data.map((t: Task) => (t.id === task.id ? { ...t, status: newStatus } : t));
    this.paginatedTasks.set({ ...current, data: optimisticData });

    // Persist via API; on error, revert UI and data
    this.apiService.updateTask(task.id, { status: newStatus }).subscribe({
      next: (serverTask) => {
        // Merge server response onto existing task to avoid losing fields when API returns partials
        const fresh = this.paginatedTasks();
        const synced = fresh.data.map((t: Task) => {
          if (t.id !== task.id) return t;
          return { ...t, ...serverTask } as Task;
        });
        this.paginatedTasks.set({ ...fresh, data: synced });
        this.updateKanbanArrays(synced);
        this.toastService.show('Task status updated successfully', 'success');
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.toastService.show('Failed to update task status', 'error');

        // Revert task status and move back
        task.status = oldStatus;
        // Move back in lists
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex
        );
        this.setListById(sourceId, [...event.previousContainer.data]);
        this.setListById(targetId, [...event.container.data]);

        // Revert paginated cache
        const fresh = this.paginatedTasks();
        const reverted = fresh.data.map((t: Task) => (t.id === task.id ? { ...t, status: oldStatus } : t));
        this.paginatedTasks.set({ ...fresh, data: reverted });
      }
    });
  }

  private getStatusFromContainerId(containerId: string): TaskStatus {
    switch (containerId) {
      case 'backlog':
        return TaskStatus.Backlog;
      case 'inprogress':
        return TaskStatus.InProgress;
      case 'done':
        return TaskStatus.Done;
      default:
        return TaskStatus.Backlog;
    }
  }

  private getListById(listId: string): Task[] {
    switch (listId) {
      case 'backlog':
        return this.backlogTasks();
      case 'inprogress':
        return this.inProgressTasks();
      case 'done':
        return this.doneTasks();
      default:
        return [];
    }
  }

  private setListById(listId: string, tasks: Task[]): void {
    switch (listId) {
      case 'backlog':
        this.backlogTasks.set(tasks);
        break;
      case 'inprogress':
        this.inProgressTasks.set(tasks);
        break;
      case 'done':
        this.doneTasks.set(tasks);
        break;
    }
  }
}
