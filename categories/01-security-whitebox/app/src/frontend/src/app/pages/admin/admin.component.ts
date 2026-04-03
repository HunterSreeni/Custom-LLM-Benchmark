import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
}

interface AppSettings {
  maxUsersPerPage: number;
  enableRegistration: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-dashboard" *ngIf="isAdmin">
      <h1>Admin Dashboard</h1>

      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <span class="stat-value">{{ stats?.totalUsers }}</span>
        </div>
        <div class="stat-card">
          <h3>Active Users</h3>
          <span class="stat-value">{{ stats?.activeUsers }}</span>
        </div>
        <div class="stat-card">
          <h3>Administrators</h3>
          <span class="stat-value">{{ stats?.adminCount }}</span>
        </div>
      </div>

      <div class="settings-section">
        <h2>Application Settings</h2>
        <div class="settings-form" *ngIf="settings">
          <label>
            <input type="checkbox" [(ngModel)]="settings.enableRegistration" />
            Enable User Registration
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="settings.maintenanceMode" />
            Maintenance Mode
          </label>
          <label>
            Session Timeout (minutes):
            <input type="number" [(ngModel)]="settings.sessionTimeoutMinutes" />
          </label>
          <button (click)="saveSettings()">Save Settings</button>
        </div>
      </div>

      <div class="users-section">
        <h2>User Management</h2>
        <table class="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.active ? 'Active' : 'Inactive' }}</td>
              <td>
                <button (click)="changeRole(user.id, 'ADMIN')">Make Admin</button>
                <button (click)="deactivateUser(user.id)">Deactivate</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #dee2e6;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #495057;
    }
    .settings-form label {
      display: block;
      margin-bottom: 12px;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th,
    .users-table td {
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      text-align: left;
    }
    .users-table th {
      background: #e9ecef;
    }
  `]
})
export class AdminComponent implements OnInit {
  stats: DashboardStats | null = null;
  settings: AppSettings | null = null;
  users: any[] = [];
  isAdmin = false;

  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const role = localStorage.getItem('role');
    this.isAdmin = role === 'admin';

    if (this.isAdmin) {
      this.loadDashboard();
    }
  }

  loadDashboard(): void {
    this.http.get<DashboardStats>(`${this.apiUrl}/stats`).subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Failed to load stats', err)
    });

    this.http.get<AppSettings>(`${this.apiUrl}/settings`).subscribe({
      next: (data) => this.settings = data,
      error: (err) => console.error('Failed to load settings', err)
    });

    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error('Failed to load users', err)
    });
  }

  saveSettings(): void {
    this.http.put(`${this.apiUrl}/settings`, this.settings).subscribe({
      next: () => alert('Settings saved successfully'),
      error: (err) => console.error('Failed to save settings', err)
    });
  }

  changeRole(userId: number, role: string): void {
    this.http.put(`${this.apiUrl}/users/${userId}/role`, { role }).subscribe({
      next: () => this.loadDashboard(),
      error: (err) => console.error('Failed to update role', err)
    });
  }

  deactivateUser(userId: number): void {
    this.http.delete(`${this.apiUrl}/users/${userId}`).subscribe({
      next: () => this.loadDashboard(),
      error: (err) => console.error('Failed to deactivate user', err)
    });
  }
}
