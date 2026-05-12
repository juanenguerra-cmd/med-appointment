# User Management Admin Console

Release target: v3.1.22

## Purpose

Adds a Med-Appointment user management admin console based on the Navigator Forms user-management pattern. The console is designed for multi-facility healthcare access control, staff-user linking, protected role assignment, and appointment workflow permissions.

## Route

Preferred route:

```txt
/user-management
```

This route must be visible only to admin roles:

```txt
role-super-admin
role-org-admin
role-facility-admin
```

## Added File

```txt
src/pages/UserManagementPage.tsx
```

## Console Layout

The page provides a two-column admin console layout.

### Left Sidebar

- Management Console
  - Users List
  - Access Matrix
  - Role Templates
  - Audit Logs
- Scope & Session card
  - Current user
  - Manage scope
  - Facility count

### Main Area

#### Users List

Includes:

- Search bar
- Refresh button
- Create User button
- Table columns:
  - Staff/User
  - Facilities
  - Staff Link
  - Email / Title
  - Role
  - Status
  - Actions

Actions:

- Manage Access Matrix
- Edit User
- Reset Password
- Deactivate User

#### Access Matrix

Includes:

- User selector
- Selected user summary card
- Permission matrix columns:
  - view
  - create
  - edit
  - print
  - export
  - delete
  - admin

Matrix groups:

- Modules
- Departments
- Appointment Workflows

Appointment workflow rows:

- Appointment Requests
- Scheduled Appointments
- Completed Appointments
- Cancelled Appointments
- Missed Appointments
- Transport Setup
- Provider Communication
- Family Notification
- Appointment Documents

#### Role Templates

Placeholder card for next release.

#### Audit Logs

Placeholder card for next release.

## User Schema

```ts
{
  id,
  staffId,
  username,
  fullName,
  email,
  title,
  department,
  payrollNo,
  status,
  defaultFacilityId,
  assignedFacilityIds,
  roleIds,
  customPermissions,
  forcePasswordReset,
  createdAt,
  updatedAt
}
```

## Backend Endpoints

The UI is prepared for these endpoints:

```txt
GET /api/users
POST /api/users
POST /api/users/update
POST /api/users/deactivate
POST /api/auth/reset-password
GET /api/staff?facilityId=<facilityId>
```

## Validation Rules

- Username required
- Username lowercase letters, numbers, dots, underscores, and dashes only
- Full name required
- At least one facility required
- Default facility required
- Default facility must be included in assigned facilities
- At least one role required
- Temporary password required for new users
- Temporary password minimum 8 characters
- Password and confirm password must match
- Duplicate username blocked
- Duplicate email blocked
- Only one active user can be linked to one staff record
- Facility admin can only assign users to their assigned facilities
- Only super admin or org admin can assign protected roles

## Protected Roles

```txt
role-super-admin
role-org-admin
```

## Built-In Roles

```txt
role-super-admin
role-facility-admin
role-org-admin
role-don-adon
role-nursing-user
role-infection-preventionist
role-rehab-user
role-mds-user
role-social-work
role-dietary
role-maintenance
role-read-only
```

## Safety Requirements

### Deactivation

Deactivation must not delete the user. It should set:

```ts
status: "inactive"
```

The confirmation dialog must require typing:

```txt
DEACTIVATE
```

### Password Reset

Password reset must not expose password hashes and must not store passwords in localStorage. Temporary passwords must be sent only to the backend endpoint and hashed server-side.

## Wiring Notes

To wire into the current tab shell, add a new tab key such as:

```ts
| "userManagement"
```

Then add a `TAB_META.userManagement` entry and render:

```tsx
<UserManagementPage
  currentUser={currentUser}
  facilityCount={facilities.length}
  users={users as any}
  onRefresh={() => {}}
  onCreateUser={() => setIsUserModalOpen(true)}
  onEditUser={(user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  }}
/>
```

The app currently exposes `users`, `currentUser`, `facilities`, `addUser`, `updateUser`, `updateUserPermissions`, and `fetchUserPermissions` through `useHealthData`, so the new page is designed to connect to the existing health-data layer.

## Process Flow Added

1. Admin opens User Management.
2. System confirms role is Super Admin, Org Admin, or Facility Admin.
3. Admin reviews users and facility assignments.
4. Admin creates or edits users using the approved schema.
5. Admin manages appointment workflow access through matrix overrides.
6. Reset Defaults clears `customPermissions`.
7. Apply Overrides saves `customPermissions`.
8. Deactivation sets user status to inactive after typing `DEACTIVATE`.
9. Password resets are sent to the backend only and never stored in localStorage.

## User Guide Update

Administrators should use this page to control who can access Med-Appointment features by facility, role, department, and appointment workflow area. For safety, user accounts are deactivated instead of deleted so access history remains reviewable.
