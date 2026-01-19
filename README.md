# Task Management System

A modern, secure task management application built with Angular and NestJS, featuring organization-based access control, Kanban boards, and comprehensive audit logging.

## Overview

This application provides a complete task management solution designed for both individual users and teams following Kanban methodologies. It features a clean interface with powerful organizational controls and role-based access management.

### Key Features

- **Multi-View Task Management**: Table view, Kanban board, and data visualization charts
- **Organization-Based Access Control**: Hierarchical organization structure with role-based permissions
- **Role-Based Access Control (RBAC)**: Three-tier role system (Owner, Admin, Viewer)
- **Real-time Drag & Drop**: Intuitive Kanban board with status updates
- **Inline Editing**: Direct task editing without separate forms
- **Comprehensive Audit Logging**: Track all system activities with detailed logs
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Mode**: User preference theme switching
- **JWT Authentication**: Secure token-based authentication system

## Technology Stack

### Frontend
- **Angular 17+** - Modern reactive framework
- **Angular CDK** - Drag and drop functionality
- **RxJS** - Reactive programming
- **Custom CSS** - Notion-inspired styling

### Backend
- **NestJS** - Scalable Node.js framework
- **TypeORM** - TypeScript ORM
- **PostgreSQL** - Primary database
- **SQLite** - Development fallback
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Swagger/OpenAPI** - API documentation

### Development Tools
- **Nx** - Monorepo management
- **TypeScript** - Type-safe development
- **Jest** - Testing framework
- **ESLint** - Code quality
- **Prettier** - Code formatting

## Architecture

### Architecture Diagram

![System Architecture](Architecure_diagram.png)

*The above diagram shows the overall system architecture including the frontend, backend, database, and shared libraries with their data flow and key components.*

### Monorepo Structure

```
task-management-system/
├── apps/
│   ├── api/                    # NestJS backend application
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── tasks/         # Task management module
│   │   │   ├── audit/         # Audit logging module
│   │   │   ├── entities/      # TypeORM entities
│   │   │   ├── migrations/    # Database migrations
│   │   │   └── common/        # Shared utilities
│   │   └── test/              # Backend tests
│   └── dashboard/             # Angular frontend application
│       ├── src/
│       │   ├── app/
│       │   │   ├── pages/     # Feature pages
│       │   │   ├── layout/    # App layout components
│       │   │   ├── shared/    # Shared components & services
│       │   │   └── guards/    # Route guards
│       │   └── environments/  # Environment configuration
│       └── test/              # Frontend tests
├── libs/
│   ├── data/                  # Shared data types & DTOs
│   │   └── src/lib/
│   │       ├── dto/          # Data transfer objects
│   │       └── enums.ts      # Shared enumerations
│   └── auth/                 # RBAC utilities
│       └── src/lib/
│           ├── decorators/   # Custom decorators
│           ├── guards/       # Authorization guards
│           └── utils/        # RBAC helper functions
└── tools/                    # Build and development tools
```

### Shared Libraries

#### `libs/data`
Contains shared TypeScript interfaces, DTOs, and enums used by both frontend and backend:
- **DTOs**: `LoginDto`, `RegisterDto`, `CreateTaskDto`, `UpdateTaskDto`, `TaskResponse`
- **Enums**: `Role`, `TaskStatus`, `TaskCategory`, `AuditAction`
- **Interfaces**: Common data structures for API communication

#### `libs/auth`
Provides reusable RBAC utilities and decorators:
- **Decorators**: `@Roles()`, `@JwtUser()`, `@OrgScoped()`
- **Guards**: `JwtAuthGuard`, `RolesGuard`
- **Utils**: Role hierarchy, organization scoping, permission checks

## Prerequisites

- **Node.js** 18+ (see `.nvmrc` for exact version)
- **npm** 9+
- **PostgreSQL** 13+ (optional - application automatically falls back to SQLite if PostgreSQL isn't running)
- **Git**

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp apps/api/.env.example apps/api/.env
   
   # Edit the .env file with your configuration
   # Minimum required variables:
   # JWT_SECRET=your-secret-key
   # JWT_EXPIRES_IN=1h
   # DATABASE_URL=postgresql://user:password@localhost:5432/taskdb
   ```

4. **Database setup** (Optional)
   
   **No database setup required!** The application automatically detects if PostgreSQL is running:
   - ✅ **PostgreSQL available**: Uses PostgreSQL database (recommended for production)
   - ✅ **PostgreSQL not available**: Automatically falls back to SQLite (works out of the box)
   
   If you want to use PostgreSQL, ensure it's running and configure the connection in your `.env` file:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/taskdb
   ```
   
   **Note**: Whether using PostgreSQL or SQLite, the application will automatically run migrations and seed data on first startup. You don't need to manually run migration or seed scripts.

5. **Build shared libraries**
   ```bash
   npm run build:libs
   ```

## Development

### Start Development Servers

**Recommended:** Start the frontend and backend in separate terminal windows for better reliability:

```bash
# Terminal 1 - Start the backend API
npm run dev:api      # Backend (http://localhost:3000)

# Terminal 2 - Start the frontend dashboard
npm run dev:dashboard # Frontend (http://localhost:4200)
```

**Note:** The `npm run dev:all` command exists but can be unreliable. It's recommended to use the individual commands above in separate terminal windows.

### Available Scripts

```bash
# Development
npm run dev:api          # Start API server (recommended)
npm run dev:dashboard    # Start dashboard (recommended)
npm run dev:all          # Start both apps (can be unreliable - use individual commands instead)

# Building
npm run build:api        # Build API
npm run build:dashboard  # Build dashboard
npm run build:libs       # Build shared libraries
npm run build           # Build everything

# Database
npm run migration:generate # Generate new migration
npm run migration:run     # Run pending migrations
npm run migration:revert  # Revert last migration
npm run seed             # Seed database

# Testing
npm run test:api         # API unit tests
npm run test:dashboard   # Dashboard unit tests
npm run test:e2e         # End-to-end tests
npm run test            # All tests

# Linting
npm run lint            # Lint all code
npm run lint:fix        # Fix linting issues
```

## Authentication & Authorization

### Demo Credentials

**Admin User:**
- Email: `admin@example.com`
- Password: `password123`
- Role: Admin
- Organization: Main Organization

### Role-Based Access Control (RBAC)

The system implements a three-tier role hierarchy with organization scoping:

#### Roles
1. **Owner** - Full access to own organization and all child organizations
2. **Admin** - Read/write access to own organization and direct children
3. **Viewer** - Read-only access to own organization and direct children

#### Role Hierarchy
```
Owner > Admin > Viewer
```

#### Organization Structure
- **2-Level Hierarchy**: Parent organizations can have child organizations
- **Task Access**: Only child organizations can have tasks, but parent organizations can view child tasks
- **User Management**: Users can be moved between organizations without restrictions

#### Permission Matrix

| Action | Owner | Admin | Viewer |
|--------|-------|-------|--------|
| Create Tasks | ✅ (own + child orgs) | ✅ (own + child orgs) | ❌ |
| Read Tasks | ✅ (own + child orgs) | ✅ (own + child orgs) | ✅ (own + child orgs) |
| Update Tasks | ✅ (own + child orgs) | ✅ (own + child orgs) | ❌ |
| Delete Tasks | ✅ (own + child orgs) | ✅ (own org only) | ❌ |
| View Audit Logs | ✅ (own + child orgs) | ✅ (own org only) | ❌ |

## Database Schema

### Core Entities

#### Organizations
- **Hierarchical Structure**: Parent-child relationships
- **Task Ownership**: Only child organizations can have tasks
- **User Assignment**: Users belong to one organization

#### Users
- **Authentication**: Email/password with bcrypt hashing
- **Role Assignment**: Owner, Admin, or Viewer
- **Organization Membership**: Each user belongs to one organization

#### Tasks
- **Status Management**: Backlog, In Progress, Done
- **Categorization**: Custom task categories
- **Audit Trail**: Full creation and modification history
- **Organization Scoping**: Tasks belong to specific organizations

#### Audit Logs
- **Action Tracking**: CREATE, READ, UPDATE, DELETE operations
- **Resource Identification**: Tracks what was modified
- **User Attribution**: Links actions to specific users
- **Organization Scoping**: Logs are filtered by user's accessible organizations

## API Documentation

### Authentication Endpoints

```bash
POST /auth/register    # User registration
POST /auth/login       # User login
GET  /auth/me         # Get current user info
```

### Task Management Endpoints

```bash
GET    /tasks         # List tasks (with filtering & pagination)
POST   /tasks         # Create new task
PUT    /tasks/:id     # Update task
DELETE /tasks/:id     # Delete task
```

### Audit Log Endpoints

```bash
GET /audit-log        # List audit logs (Admin/Owner only)
```

### Swagger Documentation

When the API is running, visit: `http://localhost:3000/api/docs`

## Frontend Features

### Task Management Interface

#### Table View
- **Sortable Columns**: Title, Status, Category, Updated Date
- **Filtering**: By status, category, and search text
- **Pagination**: Configurable page size
- **Inline Editing**: Click to edit task details directly

#### Kanban Board
- **Drag & Drop**: Move tasks between columns
- **Status Updates**: Automatic API calls on status changes
- **Visual Workflow**: Backlog → In Progress → Done
- **Empty State**: Helpful placeholders for empty columns

#### Data Visualization
- **Bar Charts**: Task count by status
- **Pie Charts**: Percentage distribution
- **Toggle Views**: Switch between chart types

### User Experience

#### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Collapsible Sidebar**: Space-efficient navigation
- **Touch-Friendly**: Optimized for mobile interactions

#### Theme System
- **Dark/Light Mode**: User preference toggle
- **Notion-Inspired**: Clean, professional aesthetic
- **Consistent Styling**: Unified design language

#### Navigation
- **Role-Based Menu**: Shows only accessible features
- **Breadcrumb Navigation**: Clear page hierarchy
- **Keyboard Shortcuts**: Power user features

## Project Structure Details

### Backend Architecture (NestJS)

#### Module Organization
- **AuthModule**: JWT authentication, registration, login
- **TasksModule**: CRUD operations, RBAC enforcement
- **AuditModule**: Activity logging and retrieval
- **DatabaseModule**: TypeORM configuration and entities

#### Security Features
- **Global Guards**: JWT authentication on all routes
- **Role Decorators**: Fine-grained permission control
- **Organization Scoping**: Automatic data filtering
- **Input Validation**: DTO validation with class-validator

#### Data Layer
- **TypeORM Entities**: Database models with relationships
- **Migrations**: Version-controlled schema changes
- **Seed Data**: Automatic sample data creation
- **Repository Pattern**: Clean data access layer

### Frontend Architecture (Angular)

#### Component Structure
- **Pages**: Feature-specific components (tasks, audit, login)
- **Layout**: Shared layout components (header, sidebar, toast)
- **Shared**: Reusable UI components and services
- **Guards**: Route protection and role-based access

#### State Management
- **Signals**: Reactive state management
- **Services**: Business logic and API communication
- **Interceptors**: HTTP request/response handling
- **Local Storage**: Persistent authentication state

#### UI/UX Features
- **Drag & Drop**: Angular CDK integration
- **Form Validation**: Reactive forms with validation
- **Toast Notifications**: User feedback system
- **Loading States**: Visual feedback for async operations

## Getting Started

1. **Start the application**
   
   Open two separate terminal windows and run:
   
   **Terminal 1 - Backend:**
   ```bash
   npm run dev:api
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   npm run dev:dashboard
   ```
   
   **Note:** It's recommended to use separate terminal windows instead of `npm run dev:all` for better reliability.

2. **Access the application**
   - Frontend: http://localhost:4200
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

3. **Login with demo credentials**
   - Email: `admin@example.com`
   - Password: `password123`

4. **Explore features**
   - Create and manage tasks
   - Switch between table and Kanban views
   - View audit logs (Admin/Owner only)
   - Test role-based permissions

## Troubleshooting

### Common Issues

#### Database Connection
The application automatically falls back to SQLite if PostgreSQL isn't running, so no database setup is required. However, if you want to use PostgreSQL:

```bash
# Check if PostgreSQL is running
pg_ctl status

# Verify connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/taskdb
```

**Note**: If PostgreSQL is unavailable, the application will automatically create and use an SQLite database file (`database.sqlite` in the project root). Migrations and seed data run automatically on startup.

#### Port Conflicts
```bash
# Kill processes on ports 3000 or 4200
lsof -ti:3000 | xargs kill -9
lsof -ti:4200 | xargs kill -9
```

#### Build Issues
```bash
# Clean and rebuild
npm run clean
npm install
npm run build:libs
```

### Development Tips

- **Hot Reload**: Both frontend and backend support hot reloading
- **Type Safety**: Shared types ensure consistency between frontend and backend
- **Error Handling**: Comprehensive error messages and toast notifications
- **Testing**: Run tests frequently during development

## Environment Variables

### Required Variables
```bash
# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h

# Database (optional - if not set or PostgreSQL unavailable, SQLite will be used)
DATABASE_URL=postgresql://user:password@localhost:5432/taskdb

# Optional
NODE_ENV=development
PORT=3000
```

### Development vs Production
- **Development**: Automatically uses SQLite if PostgreSQL isn't running, detailed logging
- **Production**: Recommended to use PostgreSQL for better performance and scalability
- **Automatic Fallback**: If PostgreSQL connection fails during startup, the application automatically switches to SQLite
- **Migrations & Seeding**: Both databases automatically run migrations and seed data on startup
- **Environment Files**: Separate `.env` files for different environments