# Product Requirements Document - Export to CSV

## 1. Overview
Users of the analytics dashboard need to export filtered data as CSV files for offline analysis and reporting. This feature supports both on-demand and scheduled exports.

## 2. User Stories
- US-1: As an analyst, I want to export the current view as a CSV so I can share data with stakeholders who do not have dashboard access.
- US-2: As a manager, I want to schedule a weekly CSV export so I receive fresh data every Monday by email.
- US-3: As an admin, I want to limit export size to prevent server overload.

## 3. Filters
The export respects the following dashboard filters:
- **Date range**: Start date and end date (inclusive). Maximum span: 1 year.
- **User segment**: One of "All Users", "Free", "Pro", "Enterprise".
- **Metrics**: Multi-select from: page_views, unique_visitors, sessions, bounce_rate, avg_session_duration, conversions.

## 4. Export Behavior

### 4.1 On-Demand Export
- User clicks "Export CSV" button.
- System validates filters (date range not empty, at least one metric selected).
- If row count exceeds 100,000: display confirmation dialog - "This export contains over 100k rows and may take a few minutes. Continue?"
- Export runs asynchronously. A progress indicator shows estimated completion.
- On completion, the browser downloads the file. Filename format: `export_{segment}_{start}_{end}.csv`.
- CSV uses UTF-8 with BOM, comma delimiter, double-quote escaping.

### 4.2 Scheduled Export
- User configures schedule: daily, weekly (pick day), or monthly (pick date).
- User provides one or more email addresses for delivery (max 5).
- Scheduled exports run at 06:00 UTC on the configured day.
- The email contains a download link (valid for 7 days) and a summary row count.
- If a scheduled export fails, retry up to 3 times with 10-minute intervals. On final failure, send an error notification email.

## 5. Constraints
- Maximum 100,000 rows per export.
- Maximum file size: 50 MB.
- Concurrent exports per user: 1 (queued if another is in progress).
- Scheduled exports per user: max 5 active schedules.
- Email addresses must be verified before they can receive exports.

## 6. Security
- Export data respects role-based access control. A "Free" user cannot export "Enterprise" segment data.
- Download links are signed and expire after 7 days.
- Audit log entry created for every export (who, when, filters, row count).

## 7. Edge Cases
- If no data matches the filters, export a CSV with headers only and display a "No data found" message.
- If the user's session expires during an async export, the export still completes and the download link is emailed.
- Date range with start > end: show validation error.
- Selecting zero metrics: show validation error "Select at least one metric".
