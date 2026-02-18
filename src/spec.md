# Specification

## Summary
**Goal:** Ensure Event Details always shows the latest saved event data, hide location on the details view, and expand events to support multiple sports and a From–To date range.

**Planned changes:**
- Fix Event Details data refresh so newly created/edited events (including via Voice Input) immediately display the just-saved values without manual refresh.
- Remove/hide the Location section from the Event Details page UI while keeping location data intact elsewhere.
- Update Add/Edit Event forms to allow selecting multiple sports, and update Event Details to display all selected sports.
- Change event date input in Add/Edit from a single date to a From–To date range (English labels), and display the range in Event Details while keeping existing calendar sorting/filtering working (using the range start date as the primary date).

**User-visible outcome:** After saving an event (including using Voice Input), Event Details instantly reflects the newest values; location is no longer shown on the details page; users can pick multiple sports per event; and events use a clear From–To date range across Add/Edit and Details.
