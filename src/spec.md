# Specification

## Summary
**Goal:** Build a mobile-first, single-user sports event manager to track events, payments, reminders, and enable voice-assisted event entry, with offline access and Motoko-backed persistence.

**Planned changes:**
- Implement Motoko backend event persistence with CRUD, computed `pendingAmount`, and upgrade-safe stable storage; scope all data to a single user/owner access model (optionally via Internet Identity).
- Create a mobile-first dark sports-themed UI with persistent bottom navigation (Home, Calendar, Add Event, Payments).
- Build Home dashboard showing monthly metrics (events, revenue, pending), upcoming events (next 7 days), and quick links to Add Event and Calendar.
- Implement Add/Edit Event form with all specified fields, validation, read-only auto-calculated pending amount, and local draft autosave with discard option.
- Add Event Details screen showing full info, payment summary, requirements checklist, and actions (Edit, Delete with confirmation, Mark as Completed).
- Implement Monthly Calendar view with date selection, daily event list, event navigation, and highlighting (today blue, upcoming green, overdue payments red indicator).
- Implement Payments screen listing events with `pendingAmount > 0`, total pending amount, and month filtering; link items to Event Details.
- Add offline-capable local caching + queued mutations with sync when online, including UI indicators for offline/pending sync.
- Add in-browser reminder system using notifications where supported (1 day before, morning-of, payment reminders) with permission flow and in-app fallback when notifications aren’t available.
- Add voice input on Add Event using browser speech-to-text to capture a booking sentence, show recognized text, and parse/populate key fields (sport/event type, date, times, organizer, advance paid, requirements, location when stated).
- Add and use basic static visual assets (app icon, subtle background/texture, and an empty-state illustration) served from frontend static assets.

**User-visible outcome:** Users can create, view, edit, and manage personal sports events from a mobile-first app, see calendar and payment status at a glance, work offline with later sync, get local reminders (or in-app alerts), and quickly fill event details using voice input.
