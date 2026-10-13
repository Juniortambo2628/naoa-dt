# Feature Implementation Plan

**Date:** September 12, 2026  
**Project:** NAOA-DT Wedding Website  
**Requested By:** KT (Client)

---

## Executive Summary

This document outlines the implementation plan for three feature categories requested by the client:
1. **Polaroid System Fixes** - Fix existing test functionality and add photo upload/camera features
2. **Seating Chart Enhancements** - Visual improvements, expandable dialog, and live tracker with name badges
3. **Guest Travel Features** - Accommodation details, flight information, and digital ticket storage

---

## 1. Polaroid System Fixes

### 1.1 Current Issues Identified

| Issue | Location | Description |
|-------|----------|-------------|
| Placeholder image path | `TestController.php:123` | Creates path `/uploads/polaroids/placeholder-{timestamp}.jpg` that doesn't exist |
| Upload button hidden | `Gallery.jsx:219-245` | Upload and slideshow buttons are commented out |
| No camera capture | `Gallery.jsx` | Only file selection via `<input type="file">` |

### 1.2 Proposed Fixes

#### A. Fix Polaroid Simulation
- Use a real placeholder image or generate a simple test image
- Alternative: Use a data URL for a small placeholder image

**Files to modify:**
- `backend/app/Http/Controllers/Api/TestController.php`
- `backend/storage/app/public/` (add placeholder image)

#### B. Enable Gallery Upload
- Uncomment the upload button in `Gallery.jsx`
- Add camera capture option alongside file selection

**Files to modify:**
- `frontend/src/pages/Gallery.jsx`

#### C. Add Camera Capture Feature
- Add `<video>` element for camera preview
- Use `navigator.mediaDevices.getUserMedia()` API
- Capture frame to canvas, convert to blob, then upload

**New component:** `frontend/src/components/CameraCapture.jsx`

### 1.3 Database Changes
None required - existing schema supports all operations.

---

## 2. Seating Chart Enhancements

### 2.1 Current Implementation Analysis

**Existing files:**
- `frontend/src/components/PublicSeatingChart.jsx` (169 lines)
- `frontend/src/pages/admin/SeatingChart.jsx` (admin version)
- `backend/app/Models/Table.php`
- `backend/app/Http/Controllers/Api/TableController.php`

**Current features:**
- Basic round/rectangular table shapes
- Seat dots showing occupancy
- "Your Table" highlight for authenticated guests
- Guest avatar previews (first letter only)

### 2.2 Proposed Enhancements

#### A. Visual Improvements
1. **Interactive floor plan** with zoom/pan capabilities
2. **Table legends** showing table names and capacities
3. **Color coding** for different guest groups (family, friends, VIP)
4. **Animated transitions** when hovering/clicking tables
5. **Responsive layout** that adapts to screen size

**Technical approach:**
- Use CSS transforms for zoom/pan
- Add SVG-based table shapes for better scaling
- Implement color scheme based on guest `group` field

#### B. Expandable Dialog (Full-Screen View)
1. **Modal overlay** with full-screen seating chart
2. **Pinch-to-zoom** on mobile devices
3. **Table detail panel** showing all guests at selected table
4. **Search functionality** to find specific guests

**New component:** `frontend/src/components/SeatingChartDialog.jsx`

**API changes:**
- `GET /api/tables/public` already returns guest names - no changes needed

#### C. Live Tracker with Name Badges
**Concept:** A real-time display showing which guests have checked in, with name badges showing only first names for privacy.

**Feasibility assessment:** ✅ **HIGHLY VIABLE**

**Existing infrastructure:**
- Check-in system already exists (`CheckInController.php`)
- `guests.checked_in_at` field tracks check-in time
- Real-time broadcasting via Laravel Reverb already configured

**New features needed:**

1. **Guest Tracker Component**
   - Shows checked-in guests in real-time
   - Displays first name only (privacy compliant)
   - Group by table or alphabetical

2. **Name Badge Display**
   - Large, readable first names
   - Table number indicator
   - Optional: Color-coded by group

3. **Real-time updates**
   - Use existing `LiveUpdate` broadcasting channel
   - New event: `GuestCheckedIn` (broadcast on check-in)

**Database changes:**
- None required - `guests` table has all needed fields

**New files:**
- `frontend/src/components/GuestTracker.jsx`
- `frontend/src/components/NameBadge.jsx`
- `backend/app/Events/GuestCheckedIn.php`

**API changes:**
- `GET /api/guests/checked-in` (new endpoint for live tracker)
- Modify `CheckInController@scan` to broadcast event

---

## 3. Guest Travel Features

### 3.1 Requirements Analysis

**Client request:**
> "I intend to add simple features for travelling guests to save their accommodation details, save their flight details (and digital tickets too) - Just for reference so they are self reliant on getting around"

**Interpretation:** This is a **personal reference tool** for guests, not a booking system. Guests store their own travel info for easy access during the trip.

### 3.2 Proposed Implementation

#### A. Database Schema Changes

**New table: `guest_travel_details`**
```sql
CREATE TABLE guest_travel_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    guest_id BIGINT UNSIGNED NOT NULL,
    
    -- Accommodation fields
    hotel_name VARCHAR(255) NULL,
    hotel_address TEXT NULL,
    hotel_check_in DATE NULL,
    hotel_check_out DATE NULL,
    hotel_confirmation VARCHAR(255) NULL,
    hotel_notes TEXT NULL,
    
    -- Flight fields
    airline VARCHAR(255) NULL,
    flight_number VARCHAR(50) NULL,
    flight_departure DATETIME NULL,
    flight_arrival DATETIME NULL,
    flight_departure_airport VARCHAR(10) NULL,
    flight_arrival_airport VARCHAR(10) NULL,
    flight_confirmation VARCHAR(255) NULL,
    
    -- Digital ticket storage
    ticket_file_path VARCHAR(500) NULL,
    ticket_file_type VARCHAR(50) NULL, -- 'pdf', 'image', 'boarding-pass'
    
    -- Transport to venue
    transport_method VARCHAR(100) NULL, -- 'rental-car', 'taxi', 'rideshare', 'public'
    transport_notes TEXT NULL,
    
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);
```

**Migration file:** `backend/database/migrations/2026_09_12_000000_create_guest_travel_details_table.php`

#### B. Backend Implementation

**New Model:** `backend/app/Models/GuestTravelDetail.php`
- Relationship: `belongsTo(Guest::class)`
- Fillable fields as per schema

**New Controller:** `backend/app/Http/Controllers/Api/GuestTravelController.php`
- `GET /api/guests/{code}/travel` - Get travel details for guest
- `POST /api/guests/{code}/travel` - Create/update travel details
- `POST /api/guests/{code}/travel/ticket` - Upload ticket file
- `DELETE /api/guests/{code}/travel/ticket` - Remove ticket file

**File storage:**
- Store tickets in `storage/app/public/travel-tickets/{guest_id}/`
- Use Laravel's `Storage` facade with public disk

#### C. Frontend Implementation

**New page:** `frontend/src/pages/GuestTravel.jsx`

**Sections:**
1. **Accommodation Form**
   - Hotel name, address (with optional map link)
   - Check-in/check-out dates with date pickers
   - Confirmation number
   - Notes field

2. **Flight Information Form**
   - Airline dropdown (common airlines)
   - Flight number input
   - Departure/arrival datetime pickers
   - Airport codes (IATA format)
   - Confirmation number

3. **Digital Ticket Upload**
   - File upload (PDF, images, boarding passes)
   - Preview capability
   - Download button

4. **Transport Notes**
   - Method selector (rental car, taxi, rideshare, public)
   - Additional notes

**UI/UX considerations:**
- Collapsible sections for each category
- Save automatically or explicit save button
- Visual indicators for completeness
- Optional: Integration with Maps component for hotel→venue directions

**Navigation:**
- Add to Digital Invitation page (alongside seating chart)
- Or create standalone `/travel` page accessible via guest code

---

## 4. Implementation Priority & Timeline

### Phase 1: Quick Wins (1-2 days)
| Task | Complexity | Impact |
|------|------------|--------|
| Fix polaroid simulation placeholder | Low | Medium |
| Uncomment gallery upload button | Low | High |
| Add camera capture to gallery | Medium | High |

### Phase 2: Seating Chart (3-4 days)
| Task | Complexity | Impact |
|------|------------|--------|
| Visual improvements (colors, animations) | Medium | High |
| Expandable dialog component | Medium | High |
| Guest tracker with name badges | Medium | Very High |

### Phase 3: Travel Features (4-5 days)
| Task | Complexity | Impact |
|------|------------|--------|
| Database migration | Low | High |
| Backend API endpoints | Medium | High |
| Frontend travel form | Medium | High |
| Ticket upload/storage | Medium | Medium |

**Total estimated time:** 8-11 days

---

## 5. Technical Considerations

### 5.1 Privacy & Security
- **Name badges:** Show first name only (already in plan)
- **Travel details:** Guest can only access their own data via unique code
- **File uploads:** Validate file types, scan for malware, limit file size (10MB recommended)
- **Data encryption:** Consider encrypting sensitive fields (confirmation numbers)

### 5.2 Mobile Responsiveness
- All new components must be mobile-first
- Seating chart dialog needs touch gestures (pinch-to-zoom)
- Travel forms should use native date inputs on mobile

### 5.3 Real-time Features
- Guest tracker uses existing Laravel Reverb infrastructure
- Consider polling interval (5-10 seconds) vs WebSocket for checked-in updates
- Optimize database queries for real-time updates

### 5.4 Localization
- Add translation keys for all new UI text
- Support all 4 existing languages (en, zh, ms, luo)
- Date/time formatting should respect locale

---

## 6. API Endpoints Summary

### New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guests/checked-in` | Get all checked-in guests (for tracker) |
| GET | `/api/guests/{code}/travel` | Get guest travel details |
| POST | `/api/guests/{code}/travel` | Create/update travel details |
| POST | `/api/guests/{code}/travel/ticket` | Upload ticket file |
| DELETE | `/api/guests/{code}/travel/ticket/{id}` | Delete ticket file |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/checkin/scan` | Add broadcasting of `GuestCheckedIn` event |

---

## 7. Database Migrations

### Migration 1: Guest Travel Details
```php
// 2026_09_12_000000_create_guest_travel_details_table.php
Schema::create('guest_travel_details', function (Blueprint $table) {
    $table->id();
    $table->foreignId('guest_id')->constrained()->onDelete('cascade');
    $table->string('hotel_name')->nullable();
    $table->text('hotel_address')->nullable();
    $table->date('hotel_check_in')->nullable();
    $table->date('hotel_check_out')->nullable();
    $table->string('hotel_confirmation')->nullable();
    $table->text('hotel_notes')->nullable();
    $table->string('airline')->nullable();
    $table->string('flight_number', 50)->nullable();
    $table->dateTime('flight_departure')->nullable();
    $table->dateTime('flight_arrival')->nullable();
    $table->string('flight_departure_airport', 10)->nullable();
    $table->string('flight_arrival_airport', 10)->nullable();
    $table->string('flight_confirmation')->nullable();
    $table->string('ticket_file_path', 500)->nullable();
    $table->string('ticket_file_type', 50)->nullable();
    $table->string('transport_method')->nullable();
    $table->text('transport_notes')->nullable();
    $table->timestamps();
    
    $table->index('guest_id');
});
```

---

## 8. New Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CameraCapture.jsx` | `src/components/` | Camera capture for polaroid/gallery |
| `SeatingChartDialog.jsx` | `src/components/` | Full-screen seating chart modal |
| `GuestTracker.jsx` | `src/components/` | Real-time checked-in guest display |
| `NameBadge.jsx` | `src/components/` | Individual name badge display |
| `GuestTravel.jsx` | `src/pages/` | Travel details form page |
| `AccommodationForm.jsx` | `src/components/` | Hotel/accommodation form section |
| `FlightForm.jsx` | `src/components/` | Flight information form section |
| `TicketUpload.jsx` | `src/components/` | Digital ticket upload component |

---

## 9. Backend New Files

| File | Location | Purpose |
|------|----------|---------|
| `GuestTravelDetail.php` | `app/Models/` | Eloquent model |
| `GuestTravelController.php` | `app/Http/Controllers/Api/` | CRUD API |
| `GuestCheckedIn.php` | `app/Events/` | Broadcasting event |
| `2026_09_12_000000_create_guest_travel_details_table.php` | `database/migrations/` | Schema |

---

## 10. Testing Strategy

### Unit Tests
- `GuestTravelDetail` model relationships
- `GuestTravelController` CRUD operations
- File upload validation

### Feature Tests
- Guest can save and retrieve travel details
- Ticket upload stores file correctly
- Checked-in guests broadcast correctly

### E2E Tests (Playwright)
- Camera capture flow
- Seating chart dialog interaction
- Travel form submission

---

## 11. Rollback Plan

If any feature causes issues:
1. **Travel features:** Disable route in `App.jsx`, hide menu item
2. **Camera capture:** Fall back to file-only upload
3. **Guest tracker:** Remove real-time updates, use manual refresh

---

## 12. Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Photo upload | Upload success rate | >95% |
| Seating chart | User engagement time | >30 seconds |
| Guest tracker | Real-time update latency | <5 seconds |
| Travel features | Guest adoption rate | >40% of traveling guests |

---

## 13. Admin UX, Data Safety & Backups (October 2026)

Follow-up to the admin redesign (shared toolbar, viewport-fit listings, header
navigation). Every item below is implemented; shared building blocks are listed
so new pages reuse them rather than re-implementing.

### 13.1 Status

| # | Area | Change | Status |
|---|------|--------|--------|
| 1 | Data accuracy | Dashboard never shows placeholder numbers; failed loads show `QueryError` with Retry (Dashboard, Analytics) | ✅ |
| 1 | Data accuracy | Guest groups stored in one spelling (`Guest::normalizeGroup`: "family"/" FAMILY " → "Family", acronyms like VIP kept); migration `2026_10_13_000001_normalize_guest_groups` cleans existing rows; bulk update, filters and exports normalise too | ✅ |
| 1 | Data accuracy | Analytics "Guest Groups" is a stacked bar per group (confirmed / pending / declined); clicking a group opens the filtered guest list | ✅ |
| 2 | Safer actions | Styled confirm dialog (`confirmAction`) replaces every `window.confirm`/`alert` in the admin; text prompt (`promptAction`); typed confirmation for restores | ✅ |
| 2 | Safer actions | Undo toast (`notifyUndo`) after guest deletes (soft delete + `POST /api/guests/restore`) and after RSVP/status edits | ✅ |
| 2 | Safer actions | Unsaved-changes guard (reload/close + in-app links) and header "Unsaved changes" chip on Settings and Email Templates | ✅ |
| 3 | Navigation | Sidebar grouped into Guests / Website / Engagement with distinct icons; `aria-current` on the active page | ✅ |
| 3 | Navigation | Notifications carry a `link` (resolved in `NotificationResource`) and open the related page, e.g. an RSVP opens that guest | ✅ |
| 4 | Dashboard | Countdown, RSVP progress bar, actionable to-dos (invites not sent, duplicates, no reply 14+ days, missing contact, confirmed without table) linking to filtered lists, recent RSVPs | ✅ |
| 5 | Guest list | Filters (status, invitation, group, needs-attention) synced to the URL; sortable columns; saved views (per browser); bulk "Set group" and "Invite via"; per-cell saving/saved/error markers in the spreadsheet; card layout on phones; spreadsheet columns realigned | ✅ |
| 6 | Designer | Arrow-key nudge (Shift = 10px); reliable smart guides (other elements + page centre/edges); zoom (Fit, 50–200%, Ctrl +/−/0); Shift-click multi-select with group drag, align, distribute, opacity, lock and delete; Layers panel drag-to-restack with lock toggles; lock/unlock; copy/paste style; Ctrl+A | ✅ |
| 7 | Consistency | Skeleton loading everywhere (`EmptyState loading`); empty states offer the next step (`EmptyState action`); gallery upload panel opens on demand, for an empty gallery, or when files are dragged onto the page | ✅ |
| 8 | Accessibility | Admin-scoped contrast fix for light grey text, visible keyboard focus rings, reduced-motion support (`.admin-theme` + `MotionConfig`); accessible names for icon-only buttons; table headers with `aria-sort` | ✅ |
| 9 | Upkeep | Playwright page list fixed (several paths pointed at routes that don't exist) and screenshot baselines regenerated for the new layout | ✅ |
| 10 | Backups | See 13.2 | ✅ |

### 13.2 Backups

**Why app-level backups:** production runs on shared cPanel hosting (MySQL) while
development and CI use SQLite, and `mysqldump` is not guaranteed to be available.
`App\Services\BackupService` dumps every data table to JSON inside a zip, so the
same code works on any driver.

| Item | Detail |
|------|--------|
| Storage | `backend/storage/app/backups/backup-YYYYMMDD-HHMMSS-<label>.zip` (`manifest.json` + `database.json`, optional `uploads/`) |
| Skipped tables | migrations, tokens, sessions, cache, jobs (runtime state, not wedding data) |
| Manual | Admin → account menu → **Backups**: back up now (optionally with photos), download, restore, delete |
| Nightly | `backups:create --label=scheduled --keep=14` at 02:15 via the Laravel scheduler |
| Automatic safety copies | Before every restore (`pre-restore`), guest merge (`pre-merge`) and import (`pre-import`); last 10 of each kept. Toggle with `AUTO_BACKUPS` (off in tests) |
| Restore | Requires typing RESTORE; takes a safety backup first, replaces table contents in one transaction, ignores columns the current schema no longer has |
| API | `GET/POST /api/backups`, `GET /api/backups/{name}/download`, `POST /api/backups/{name}/restore`, `DELETE /api/backups/{name}` (admin only; names validated against the backup pattern) |

### 13.3 Deployment steps

1. Migrations run automatically in the "Deploy Backend" workflow; `2026_10_13_000001_normalize_guest_groups` merges spelling variants of guest groups.
2. Ensure the cPanel cron runs the scheduler every minute, otherwise nightly backups never run:
   `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`
3. The PHP `zip` extension must be enabled (standard on cPanel).
4. Download a backup from the Backups page now and then and keep it off the server — backups on the same host do not protect against losing the host.

### 13.4 Shared building blocks (reuse these)

| Need | Use |
|------|-----|
| Confirm / prompt / toasts / undo | `utils/feedback.jsx` (`confirmAction`, `promptAction`, `notifyError`, `notifySuccess`, `notifyUndo`) |
| Guest filters, stats, to-dos, sorting | `utils/guests.js`; RSVP colours/labels and links in `utils/rsvp.js` |
| Canvas element maths (align, distribute, nudge, layers, styles) | `utils/invitationItems.js` |
| Page search / filters / saved views | `AdminPageLayout` props `search`, `filters` (incl. `views`), hook `useSavedViews` |
| Loading / empty / error states | `EmptyState` (`loading`, `action`), `QueryError` |
| Unsaved edits | `useUnsavedChanges(value)` + `UnsavedChangesStatus` |
| Header status or compact title | `AdminHeaderStatus` (portal), automatic via `AdminPageHero` |

---

## Appendix A: Existing Code References

- Polaroid model: `backend/app/Models/PolaroidImage.php`
- Check-in controller: `backend/app/Http/Controllers/Api/CheckInController.php`
- Gallery controller: `backend/app/Http/Controllers/Api/GalleryController.php`
- Table model: `backend/app/Models/Table.php`
- Guest model: `backend/app/Models/Guest.php`
- API services: `frontend/src/services/api.js`
- i18n translations: `frontend/src/locales/en/translation.json`

---

**Document prepared by:** opencode  
**Status:** Ready for review  
**Next steps:** Client approval → Phase 1 implementation
