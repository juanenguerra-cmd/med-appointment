# Priority Review and Implementation — med-appointment

## Purpose

This roadmap is specific to the HealthSync Medical Appointment Tracker / med-appointment repository. The focus is appointment utilization review, specialty trends, provider/location utilization, transport utilization, and appointment-entry data quality.

This roadmap does not include infection-control, outbreak, symptom tracking, antibiotic stewardship, or QAPI-specific infection prevention workflows unless specifically requested for this repository later.

---

## Priority Implementation Line-Up

### 1. Integrate SpecialtyTrendsPanel into the Trends tab

**Purpose:** Make the Specialty Trends page show high-utilization specialties directly in the app UI.

**Implementation notes:**
- Import `SpecialtyTrendsPanel` into `src/App.tsx`.
- Replace or enhance the existing `activeTab === "trends"` section.
- Feed the component the current `appointments` array.
- Use existing status/date filters where available.

**Acceptance criteria:**
- Trends tab displays total reviewed appointments.
- Trends tab displays highest-utilization specialty.
- Specialty ranking shows count and percentage.
- High-use specialties are visually flagged.
- Missing specialty/date counts are visible.

---

### 2. Add date/month/status filters for utilization review

**Purpose:** Allow leadership or scheduler review by selected date range, month, and appointment status.

**Implementation notes:**
- Reuse existing `appointmentsFilter` state when possible.
- Add support for custom date range if needed.
- Filters should affect specialty trends, provider/location review, and transport utilization consistently.

**Acceptance criteria:**
- User can filter trends by upcoming range, month, or custom date range.
- User can filter by status: All, Scheduled, Completed, Cancelled, Pending, Hospitalized.
- Filtered totals update immediately.
- Filter state does not break Appointments tab behavior.

---

### 3. Add Specialty Trends PDF export

**Purpose:** Allow export of specialty utilization review for leadership review, facility operations, and appointment-planning meetings.

**Implementation notes:**
- Add export function to `src/services/pdfService.ts` or a dedicated report service.
- Use the normalized Specialty Trends engine, not raw appointment counting.
- Include report date, facility name, date range/status filter, top specialties, utilization ranking, and data-quality warnings.

**Acceptance criteria:**
- PDF includes facility name and generated date.
- PDF includes filter summary.
- PDF includes top specialty and total reviewed.
- PDF includes specialty ranking with count and percentage.
- PDF includes missing date/specialty warning count.

---

### 4. Add provider/location utilization review

**Purpose:** Identify providers or locations with high appointment volume.

**Implementation notes:**
- Build provider/location aggregation from appointment fields:
  - `providerName`
  - `location`
  - `contactNumber`
  - `type`
- Normalize blank provider/location values as `Unspecified` for audit visibility.
- Allow review by selected filter range/status.

**Acceptance criteria:**
- Display top providers by appointment volume.
- Display top outside locations by appointment volume.
- Show related specialty/service type when available.
- Flag missing provider/location data.

---

### 5. Add transport utilization review

**Purpose:** Identify transport demand patterns and high-use transport types or vendors.

**Implementation notes:**
- Aggregate by:
  - `transportType`
  - `transportCompany`
  - `payerForRide`
  - `roundTrip`
  - `escort`
  - mobility flags when available: wheelchair, stretcher/lift/recliner/bariatric/oxygen.
- Keep the view operational and scheduler-friendly.

**Acceptance criteria:**
- Display transport type distribution.
- Display top transport companies/vendors.
- Display payer distribution.
- Display escort/oxygen/mobility-related needs when documented.
- Flag missing transport company/type/payer information.

---

### 6. Add missing-data audit for appointment entries

**Purpose:** Identify incomplete appointment records that affect scheduling, transport coordination, and utilization analytics.

**Implementation notes:**
- Audit required/important fields:
  - residentName
  - date
  - time
  - type/specialty
  - providerName
  - location
  - contactNumber
  - transportType
  - transportCompany
  - payerForRide
  - escort
  - notes/description when needed
- Group missing-data issues by field and appointment.
- Link each issue back to the appointment entry when possible.

**Acceptance criteria:**
- Missing-data audit card appears in Reports or Trends/Utilization area.
- Shows count of incomplete appointment entries.
- Lists most commonly missing fields.
- Allows staff to identify which records need correction.
- Missing-data audit does not block saving; it guides correction.

---

## Recommended Implementation Order

1. Wire `SpecialtyTrendsPanel` into the Trends tab.
2. Add filters to Trends tab.
3. Add Specialty Trends PDF export.
4. Add provider/location utilization review.
5. Add transport utilization review.
6. Add missing-data audit.

---

## Version History Entry To Add After Implementation

### v0.5.x — Appointment Utilization Review Enhancements

Plain-language workflow changes:
- Added specialty trends review to identify high appointment utilization by specialty.
- Added utilization filters for appointment status and date/month review.
- Added export-ready structure for specialty utilization review.
- Added planned provider/location and transport utilization review.
- Added planned missing-data audit to help staff correct incomplete appointment entries.

