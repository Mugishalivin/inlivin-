# Console Error Fixes - Tracking

## Issues Found & Fixes

### 1. Dialog Accessibility Warnings (Radix UI)
- [x] `AppLayout.tsx` — Add `<SheetTitle>` and `<SheetDescription>` to mobile SheetContent
- [x] `MessagesPage.tsx` — Add `<DialogTitle>` + `<DialogDescription sr-only>` to all dialogs missing them:
  - pinnedOpen Dialog
  - forwardMsg Dialog
  - msgInfoId Dialog
  - previewAttachment Dialog
  - deleteTarget Dialog
  - incomingPendingCall Dialog
  - callRoomOpen Dialog
  - showCallSheet Dialog

### 2. Maximum Update Depth Exceeded
- [x] `MessagesPage.tsx` — Guard `chatWithUserId` effect with `useRef` to prevent infinite loop

### 3. Supabase 404/400 Errors
- [x] `MessagesPage.tsx` — Wrap `user_blocks` query in try/catch with `throwOnError: false`
- [x] `ExplorePage.tsx` — Add defensive error handling for `bookmarks` and `profiles` queries
- [x] `FeedPage.tsx` — Add defensive error handling for `bookmarks` query

### 4. Missing Autocomplete Attributes
- [x] `LoginPage.tsx` — Add `autoComplete="current-password"` to password input
- [x] `ResetPasswordPage.tsx` — Add `autoComplete="new-password"` to password inputs

### 5. Storage Bucket Warning
- [x] `storage-init.ts` — Quieten missing bucket log from `warn` to `info`

### 6. React Router Future Flag (Non-breaking)
- [x] Already set in `App.tsx` — informational only

### 7. Browser Extension Errors
- [x] "Cannot find menu item with id save-page/translate-page" — Not app code, ignore

