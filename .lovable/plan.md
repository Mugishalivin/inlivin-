# Remove Dashboard page and trim Analytics

## 1. Remove the Dashboard page
- Delete the Dashboard page and its "Dashboard" link in the sidebar.
- Anyone who opens the old dashboard address (after sign-in, Google sign-in, password reset, old links) is sent straight to the **Feed** instead, so nothing breaks.
- Admins in "user view" also land on the Feed.

## 2. Clean up the Analytics page header
Remove completely:
- "Live insight engine" label
- "Analytics command center" title
- "Visualize your growth..." sentence
- The three tags: "Moving visual elements", "Problem detection", "Action ideas"

## 3. Remove two Analytics tabs
- Remove the **Problems** and **Actions** tabs and their content. Only **Overview** and **Charts** remain.

## Technical details
- `App.tsx`: drop `DashboardPage` import, make `/dashboard` a `<Navigate to="/feed" replace />`; replace other `/dashboard` targets (Login, Register, ContinueAs, ResetPassword, Index, Navbar, AdminShell, AdminUsers, Impersonation, AdminCommandCenter, Notifications) with `/feed`.
- Delete `src/pages/DashboardPage.tsx`; remove sidebar item and point sidebar logo to `/feed`.
- `AnalyticsPage.tsx`: delete header block (lines ~370–389), the `problems`/`actions` TabsTriggers and TabsContents, and now-unused imports/derived data.
