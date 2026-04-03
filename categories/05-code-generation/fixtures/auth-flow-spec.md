# JWT Authentication Flow Specification

## Overview
Build a complete JWT authentication system for a Vue 3 SPA using Pinia for state management and Vue Router for route protection. The system must handle access tokens, refresh tokens, and automatic token renewal.

## Requirements

### Pinia Auth Store (`useAuthStore`)
- State: `user` (nullable User object), `accessToken` (string), `refreshToken` (string), `isAuthenticated` (computed boolean).
- Actions: `login(email, password)`, `logout()`, `refreshAccessToken()`, `fetchUser()`.
- On login success, store both tokens. Access token expires in 15 minutes, refresh token in 7 days.
- On logout, clear all tokens and user data, then redirect to `/login`.

### Token Storage
- Store the access token in memory only (Pinia state) - not localStorage.
- Store the refresh token in an httpOnly cookie (set by the server) or as a fallback in a secure cookie via the API response.
- On page reload, attempt to refresh the access token using the refresh cookie before showing the login page.

### Axios Interceptor
- Attach the access token as `Authorization: Bearer <token>` on every API request.
- On 401 response, attempt to refresh the token automatically.
- If refresh succeeds, retry the original failed request with the new token.
- If refresh fails (refresh token expired), log out the user.
- Queue concurrent requests during token refresh - do not fire multiple refresh calls simultaneously.

### Vue Router Guards
- Define route meta: `requiresAuth: true` on protected routes, `guestOnly: true` on login/register.
- `beforeEach` guard checks `isAuthenticated`. If not authenticated and route requires auth, redirect to `/login` with `redirect` query param.
- After successful login, redirect to the original requested route (from query param) or `/dashboard`.
- If authenticated and visiting `guestOnly` route, redirect to `/dashboard`.

### Error Handling
- Show user-friendly error messages for invalid credentials, network errors, and expired sessions.
- On session expiry, show a toast notification before redirecting to login.

## Deliverables
- `stores/auth.ts` - Pinia auth store
- `plugins/axios.ts` - Axios instance with interceptors
- `router/index.ts` - Router with guards
- `composables/useAuth.ts` - convenience composable wrapping the store
- `types/auth.ts` - TypeScript interfaces
