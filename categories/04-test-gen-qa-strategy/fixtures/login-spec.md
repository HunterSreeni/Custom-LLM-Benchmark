# Feature Specification - User Login

## Overview
The login page allows registered users to authenticate using email and password credentials.

## UI Elements
- Email input field (text, required)
- Password input field (masked, required)
- "Remember Me" checkbox (unchecked by default)
- "Sign In" button (primary action)
- "Forgot Password?" link (navigates to password reset flow)
- Error message banner (hidden by default)

## Functional Requirements

### FR-1: Email Validation
- Email field must accept a valid email format (user@domain.tld).
- Leading and trailing whitespace is trimmed before validation.
- Maximum length: 254 characters.

### FR-2: Password Field
- Minimum length: 8 characters.
- Maximum length: 128 characters.
- A toggle icon allows the user to show/hide the password.

### FR-3: Authentication
- On clicking "Sign In", the system sends a POST to `/api/auth/login` with `{ email, password, rememberMe }`.
- On success (200), the server returns a JWT access token and a refresh token.
- The access token is stored in memory; the refresh token is stored in an HttpOnly cookie.
- If "Remember Me" is checked, the refresh token cookie has a 30-day expiry; otherwise 24 hours.

### FR-4: Rate Limiting
- After 5 consecutive failed login attempts for the same email, the account is temporarily locked for 15 minutes.
- A locked-account message is displayed: "Too many failed attempts. Please try again in 15 minutes."
- The lock counter resets on successful login.

### FR-5: Forgot Password
- Clicking "Forgot Password?" navigates to `/forgot-password`.
- The link is always visible regardless of login state.

### FR-6: Error Messages
- Invalid credentials: "Incorrect email or password."
- Locked account: "Too many failed attempts. Please try again in 15 minutes."
- Server error (5xx): "Something went wrong. Please try again later."
- Network error: "Unable to connect. Check your internet connection."

## Non-Functional Requirements
- Login API response time must be under 500ms (p95).
- The page must be fully accessible (WCAG 2.1 AA).
- All form fields must have associated labels for screen readers.
