import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresIn: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('role', response.role);
        this.loadStoredUser();
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token');
    return token !== null && token.length > 0;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentRole(): string | null {
    return localStorage.getItem('role');
  }

  isAdmin(): boolean {
    return this.getCurrentRole() === 'admin';
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  private loadStoredUser(): void {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    if (username && role) {
      this.currentUserSubject.next({
        id: 0,
        username: username,
        email: '',
        fullName: '',
        role: role
      });
    }
  }
}
