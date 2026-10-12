import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RESOURCE_CONFIG, AdminResourceConfig } from '../resource/admin-resource.config';
import { AdminResourceBase } from '../resource/admin-resource.base';
import { API_ROUTES } from '../../../core/constants/api-routes';

type UserRow = Record<string, any>;
type UserFilter = 'all' | 'active' | 'inactive' | 'admin' | 'editor' | 'communication';

const config: AdminResourceConfig = {
  title: 'Utilisateurs',
  icon: 'bi-people-fill',
  endpoint: API_ROUTES.admin.users,
  shape: 'items',
  searchable: true,
  statusParam: 'status',
  statusField: 'status',
  statusOptions: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  creatable: true,
  editable: true,
  deletable: true,
  columns: [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Rôle' },
    { key: 'status', label: 'Statut', type: 'status' },
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ],
  fields: [
    { key: 'firstName', label: 'Prénom', type: 'text', required: true },
    { key: 'lastName', label: 'Nom', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'password', label: 'Mot de passe', type: 'text', required: true, createOnly: true, placeholder: 'Minimum 8 caractères' },
    { key: 'role', label: 'Rôle', type: 'select', options: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COMMUNICATION'] },
    { key: 'status', label: 'Statut', type: 'select', options: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
  ]
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  providers: [{ provide: RESOURCE_CONFIG, useValue: config }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent extends AdminResourceBase {
  private readonly usersRouter = inject(Router);
  readonly userFilter = signal<UserFilter>('all');
  readonly visibleUsers = computed(() => this.rows().filter((row) => {
    const filter = this.userFilter();
    if (filter === 'all') {
      return true;
    }
    if (filter === 'active') {
      return this.userIsActive(row);
    }
    if (filter === 'inactive') {
      return !this.userIsActive(row);
    }
    return this.userRoleGroup(row) === filter;
  }));
  readonly userStats = computed(() => {
    const users = this.rows();
    return {
      total: this.total(),
      active: users.filter((row) => this.userIsActive(row)).length,
      inactive: users.filter((row) => !this.userIsActive(row)).length,
      admin: users.filter((row) => this.userRoleGroup(row) === 'admin').length,
      editor: users.filter((row) => this.userRoleGroup(row) === 'editor').length,
      communication: users.filter((row) => this.userRoleGroup(row) === 'communication').length
    };
  });

  setUserFilter(filter: UserFilter): void {
    this.userFilter.set(filter);
  }

  override openCreate(): void {
    void this.usersRouter.navigate(['/dashboard/users/new']);
  }

  override openEdit(row: UserRow): void {
    const id = this.rowId(row);
    if (id) {
      void this.usersRouter.navigate(['/dashboard/users', id, 'edit']);
    }
  }

  userName(row: UserRow): string {
    const name = row?.['name'] ?? [row?.['firstName'], row?.['lastName']].filter(Boolean).join(' ');
    return String(name || row?.['email'] || 'Compte');
  }

  userInitials(row: UserRow): string {
    const words = this.userName(row).trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || '?';
  }

  userAvatar(row: UserRow): string {
    return String(row?.['avatarUrl'] ?? row?.['avatar'] ?? row?.['profileImage'] ?? '');
  }

  userRole(row: UserRow): string {
    const role = String(row?.['role'] ?? '').toUpperCase().replace(/[-\s]/g, '_');
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super-admin',
      ADMIN: 'Administrateur',
      EDITOR: 'Éditeur',
      COMMUNICATION: 'Communication',
      CONSULTANT: 'Consultant',
      USER: 'Utilisateur'
    };
    return labels[role] ?? String(row?.['role'] ?? '—');
  }

  userRoleGroup(row: UserRow): 'admin' | 'editor' | 'communication' | 'other' {
    const role = String(row?.['role'] ?? '').toUpperCase().replace(/[-\s]/g, '_');
    if (role.includes('EDITOR')) {
      return 'editor';
    }
    if (role.includes('COMMUNICATION')) {
      return 'communication';
    }
    return ['ADMIN', 'SUPER_ADMIN'].includes(role) ? 'admin' : 'other';
  }

  userIsActive(row: UserRow): boolean {
    return ['ACTIVE', 'ACTIF', 'TRUE'].includes(String(row?.['status'] ?? '').toUpperCase());
  }

  userNotifications(row: UserRow): boolean | null {
    const value = row?.['notificationContact'] ?? row?.['notifyContact'] ?? row?.['contactNotifications'];
    return typeof value === 'boolean' ? value : null;
  }

  userLastLogin(row: UserRow): string {
    const value = row?.['lastLoginAt'] ?? row?.['lastLogin'] ?? row?.['lastSeenAt'];
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR');
  }

  toggleUserStatus(row: UserRow): void {
    this.changeStatus(row, this.userIsActive(row) ? 'INACTIVE' : 'ACTIVE');
  }
}
