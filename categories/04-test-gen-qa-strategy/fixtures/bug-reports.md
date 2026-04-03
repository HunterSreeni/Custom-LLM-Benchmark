# Bug Reports

---

## BUG-101: Dashboard charts not loading on Firefox 115

**Reporter:** QA-Anna | **Date:** 2026-03-28 | **Component:** Dashboard
**Environment:** Firefox 115.0, macOS 14.3, Production

**Steps to Reproduce:**
1. Log in to the dashboard with valid credentials.
2. Navigate to Analytics > Overview.
3. Wait for charts to render.

**Expected:** All 4 charts (line, bar, pie, area) render within 3 seconds.
**Actual:** Charts show a spinner indefinitely. Console error: `TypeError: ResizeObserver is not a constructor`.

**Frequency:** 100% reproducible on Firefox 115. Works fine on Chrome 122 and Safari 17.

---

## BUG-102: Export CSV button does nothing when filters are empty

**Reporter:** QA-Ben | **Date:** 2026-03-29 | **Component:** Export
**Environment:** Chrome 122, Windows 11, Staging

**Steps to Reproduce:**
1. Navigate to Analytics > Export.
2. Clear all filter fields (date range, segment, metrics).
3. Click "Export CSV".

**Expected:** Validation error displayed: "Please select at least one metric."
**Actual:** Button click has no visible effect. No error, no network request. Console shows `Uncaught TypeError: Cannot read properties of undefined (reading 'length')`.

**Frequency:** 100% reproducible.

---

## BUG-103: Add dark mode support to the settings page

**Reporter:** User-Carol | **Date:** 2026-03-29 | **Component:** Settings
**Environment:** N/A

**Steps to Reproduce:**
N/A - this is a new feature request.

**Expected:** A toggle in Settings > Appearance to switch between light and dark themes.
**Actual:** Only light mode is available.

**Notes:** Multiple users have requested this in the feedback survey.

---

## BUG-104: Login page shows "undefined" after session timeout

**Reporter:** QA-Dave | **Date:** 2026-03-30 | **Component:** Auth
**Environment:** Chrome 122, Ubuntu 22.04, Production

**Steps to Reproduce:**
1. Log in and leave the session idle for 30+ minutes.
2. Attempt any action (e.g., click a nav link).
3. Observe the redirect to the login page.

**Expected:** Login page shows the standard login form, optionally with "Your session has expired" message.
**Actual:** The email field is pre-filled with the text "undefined" and an error banner reads "undefined".

**Frequency:** Intermittent - approximately 70% of the time after session timeout.

---

## BUG-105: Cannot upload profile picture larger than 2 MB

**Reporter:** User-Eve | **Date:** 2026-03-30 | **Component:** Profile
**Environment:** Safari 17, iOS 17.3

**Steps to Reproduce:**
1. Go to Profile > Edit.
2. Tap "Change Photo".
3. Select a JPEG image (3.2 MB, 4032x3024).
4. Tap "Upload".

**Expected:** Image is resized and uploaded successfully.
**Actual:** Error: "File too large. Maximum size is 2 MB."

**Notes:** The help docs say the limit is 5 MB. Either the docs or the code is wrong.

---

## BUG-106: Dashboard charts not rendering in Firefox

**Reporter:** QA-Frank | **Date:** 2026-03-31 | **Component:** Dashboard
**Environment:** Firefox 115.2, Windows 11, Production

**Steps to Reproduce:**
1. Open the dashboard in Firefox 115.
2. Go to Analytics > Overview.
3. Charts display infinite loading spinner.

**Expected:** Charts render normally.
**Actual:** Spinner never stops. Console shows `ResizeObserver` error.

**Frequency:** Always on Firefox 115.x.

**Notes:** Same issue as what Anna reported last week - might be a duplicate.

---

## BUG-107: Allow users to reorder dashboard widgets via drag-and-drop

**Reporter:** PM-Grace | **Date:** 2026-03-31 | **Component:** Dashboard
**Environment:** N/A

**Description:** Users should be able to customize their dashboard layout by dragging widgets to rearrange them. The layout should persist across sessions.

**Acceptance Criteria:**
- Drag handle visible on hover for each widget.
- Layout saved to user preferences API.
- Reset to default option available.

---

## BUG-108: Notification emails sent with wrong timezone

**Reporter:** QA-Hank | **Date:** 2026-04-01 | **Component:** Notifications
**Environment:** Production

**Steps to Reproduce:**
1. Set user timezone to "Asia/Tokyo" (UTC+9) in profile settings.
2. Trigger a scheduled export for "Daily at 09:00".
3. Check the notification email received.

**Expected:** Email says "Your export for April 1, 2026 09:00 JST is ready."
**Actual:** Email says "Your export for April 1, 2026 00:00 UTC is ready."

**Frequency:** 100% - all notification emails show UTC regardless of user timezone preference.

---

## BUG-109: Pressing Enter in search field submits the page instead of searching

**Reporter:** QA-Irene | **Date:** 2026-04-01 | **Component:** Search
**Environment:** Chrome 122, macOS 14.3, Staging

**Steps to Reproduce:**
1. Click the global search bar in the top navigation.
2. Type "revenue".
3. Press Enter.

**Expected:** Search results are displayed below the search bar.
**Actual:** The entire page form submits (full page reload), and the user lands on a blank page.

**Frequency:** 100% reproducible. The search input is inside a `<form>` tag that lacks `e.preventDefault()` on submit.

---

## BUG-110: Slow page load on the Users list when there are 10,000+ users

**Reporter:** QA-Jake | **Date:** 2026-04-02 | **Component:** Admin
**Environment:** Chrome 122, Windows 11, Staging

**Steps to Reproduce:**
1. Seed the staging database with 15,000 user records.
2. Navigate to Admin > Users.
3. Measure page load time.

**Expected:** Page loads within 2 seconds with paginated results (50 per page).
**Actual:** Page takes 12-15 seconds to load. Network tab shows the API returns all 15,000 records in a single response (no pagination).

**Frequency:** 100% on datasets > 5,000 records.
