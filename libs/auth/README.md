# Auth Library - RBAC System

This library provides a comprehensive Role-Based Access Control (RBAC) system with organization scoping and 2-level hierarchy support.

## Features

- **Role Hierarchy**: Owner > Admin > Viewer
- **Organization Scoping**: 2-level hierarchy (parent -> child)
- **Permission Helpers**: Task-specific permission checks
- **Decorators**: Easy-to-use decorators for controllers
- **Guards & Interceptors**: Automatic role and org filtering

## Roles

### Owner (Level 3)
- Full access in own org + direct children
- Can manage users and organization settings
- Can perform all CRUD operations

### Admin (Level 2)
- Read/write access in own org + direct children
- Can manage users but not organization settings
- Cannot delete tasks outside their scope

### Viewer (Level 1)
- Read-only access in own org + direct children
- Cannot perform write operations

## Usage

### Basic Controller Setup

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { Roles, OrgScoped, JwtUser, OrgScope } from 'auth';
import { Role } from 'data';
import { User } from '../entities/user.entity';

@Controller('tasks')
export class TasksController {
  
  @Get()
  @Roles(Role.Viewer, Role.Admin, Role.Owner)
  @OrgScoped()
  async findTasks(@OrgScope() orgScope: any) {
    // orgScope contains:
    // - userOrgId: string
    // - accessibleOrgIds: string[]
    // - user: User
    // Use accessibleOrgIds to filter tasks
  }

  @Post()
  @Roles(Role.Admin, Role.Owner)
  @OrgScoped()
  async createTask(@JwtUser() user: User, @Body() createTaskDto: CreateTaskDto) {
    // Only Admins and Owners can create tasks
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Owner)
  async updateTask(@JwtUser() user: User, @Param('id') id: string) {
    // Check permissions using utility functions
  }
}
```

### Permission Checking in Services

```typescript
import { Injectable } from '@nestjs/common';
import { 
  canReadTask, 
  canCreateTask, 
  canUpdateTask, 
  canDeleteTask,
  TaskPermissionContext 
} from 'auth';

@Injectable()
export class TasksService {
  async findAll(user: User, orgTree: Organization[]) {
    const context: TaskPermissionContext = {
      user,
      orgTree,
    };
    
    const accessibleOrgIds = getAccessibleOrgIdsForAction(user, 'read', orgTree);
    return this.taskRepository.find({
      where: { orgId: In(accessibleOrgIds) }
    });
  }

  async create(user: User, createTaskDto: CreateTaskDto, orgTree: Organization[]) {
    const context: TaskPermissionContext = {
      user,
      targetOrgId: createTaskDto.orgId,
      orgTree,
    };

    if (!canCreateTask(context)) {
      throw new ForbiddenException('Cannot create task in this organization');
    }

    // Create task...
  }
}
```

### Organization Hierarchy

```typescript
import { orgContains, getUserAccessibleOrgIds } from 'auth';

// Check if user can access an organization
const canAccess = orgContains(user.orgId, targetOrgId, orgTree);

// Get all organizations user can access
const accessibleOrgIds = getUserAccessibleOrgIds(user.orgId, orgTree);
```

## Decorators

### @Roles(...roles)
Specifies which roles can access the endpoint.

```typescript
@Roles(Role.Admin, Role.Owner)
@Get('admin-only')
```

### @OrgScoped()
Marks endpoint for organization scoping. Adds `orgScope` to request.

```typescript
@OrgScoped()
@Get('tasks')
```

### @JwtUser()
Injects the authenticated user from JWT token.

```typescript
@Get('profile')
async getProfile(@JwtUser() user: User) {
  return user;
}
```

### @OrgScope()
Injects organization scope information (requires @OrgScoped()).

```typescript
@OrgScoped()
@Get('tasks')
async findTasks(@OrgScope() orgScope: any) {
  // orgScope.accessibleOrgIds contains filtered org IDs
}
```

## Permission Helpers

### Task Permissions
- `canReadTask(context)` - Check read permission
- `canCreateTask(context)` - Check create permission  
- `canUpdateTask(context)` - Check update permission
- `canDeleteTask(context)` - Check delete permission

### Organization Permissions
- `canManageUsers(context)` - Check user management
- `canManageOrg(context)` - Check org management

### Utility Functions
- `roleRank(role)` - Get role hierarchy level
- `isAtLeast(userRole, requiredRole)` - Compare roles
- `hasRole(userRole, allowedRoles)` - Check role membership

## Module Integration

The `RbacModule` automatically registers:
- Global `RolesGuard` for role checking
- Global `OrgScopeInterceptor` for org filtering

```typescript
// In app.module.ts
import { RbacModule } from 'auth';

@Module({
  imports: [
    // ... other modules
    RbacModule,
  ],
})
export class AppModule {}
```

## Testing

Run the test suite:

```bash
npm test libs/auth
```

Tests cover:
- Role hierarchy and permissions
- Organization scoping
- Task permission helpers
- Edge cases and security scenarios