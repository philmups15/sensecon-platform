# Administration redesign — implementation brief

A reference prototype for the new Administration section lives at
`docs/admin-redesign-prototype.html` (open it directly in a browser). It's a
static mock with sample data — use it to match interaction patterns (modals,
kebab menus, pagination, tab switching), then wire the real thing up against
this codebase's actual architecture, described below.

## Current state (read this before changing anything)

- No router. `App.jsx` keeps a `SCREENS` dict keyed by string
  (`src/App.jsx:20`) and a `screen` state value; `Sidebar` calls
  `onNavigate(key)` to switch. Nav items come from `navGroups` in
  `src/lib/mockData.js:1`.
- `src/screens/Admin.jsx` currently renders four cards on one page: Tenants
  (mock data), Users & roles (real, backend-driven), Templates (mock data),
  Integrations (mock data), Audit log (real, backend-driven).
- `src/lib/api.js` already has: `getUsers`, `getCurrentUser`, `updateUserRole`,
  `adminCreateUser` (reuses the `/api/auth/register` endpoint), `getAuditLog`.
  There is **no** disable/enable-user, admin-set-password, or
  send-password-reset-email endpoint yet — those need backend work.
- Roles are a **fixed backend enum**, not a dynamic table: `ALL_ROLES` and
  `USER_ROLE_META` (`src/lib/api.js:436-445`) list exactly five roles (Admin,
  User, Sales, ProjectManager, DesignEngineer). Per-role page/module access is
  a hardcoded `MODULE_ACCESS` matrix (`src/lib/api.js:450-464`) that mirrors
  `Sencecon.API/Authorization/Roles.cs` in the backend repo. There is no
  "create a new role" concept anywhere in the stack.
- Tenants, Templates, and Integrations are pure mock arrays in
  `src/lib/mockData.js` — there is no backend support for them at all yet.
- No pagination anywhere (lists are just `.map()`'d in full). No xlsx/PDF
  export library installed (`package.json` has no `xlsx`/`jspdf`).
- Chip tones (`src/components/Chip.jsx`): `blue`, `green`, `amber`, `red`,
  `violet`, `slate`. Reuse these tone names, don't invent new colors.
- Style convention: inline `style={{ ... }}` objects, no CSS framework, see
  the `selectStyle` / `inputStyle` / `primaryBtnStyle` / `linkBtnStyle`
  constants at the top of `Admin.jsx` — follow that pattern for new controls.

## Recommended shape for the new Administration area

Keep a single `admin` entry in `navGroups`/`Sidebar` (don't fragment
Administration across the main sidebar). Inside `Admin.jsx`, replace the
current single-page layout with an internal tab strip — Overview / Users /
Roles & Permissions / Audit Log / Integrations — mirroring the prototype's top
tabs, and split each tab's content into its own component file:

```
src/screens/admin/
  AdminOverview.jsx      (the current 4-card summary, trimmed)
  AdminUsers.jsx
  AdminRoles.jsx
  AdminAuditLog.jsx
  AdminIntegrations.jsx
```

`Admin.jsx` becomes a thin shell that renders the tab strip and the active
sub-component. This gives you genuinely separate pages/components (easy to
route later if a router gets introduced) without having to touch
`App.jsx`/`Sidebar.jsx`/`navGroups`.

## Phase 1 — frontend-only, buildable in this repo right now

1. **Users page** (`AdminUsers.jsx`)
   - Table with search (name/email) + role/status filter dropdowns, using
     `getUsers()` / `toUserView` as today.
   - Client-side pagination (page size selector, prev/next, numbered pages) —
     no backend change needed, `getUsers()` already returns the full list.
   - Per-row kebab menu: View details (modal — profile, role, last login),
     Change password, Reset password, Disable/Enable user. Wire Change
     password and Disable/Enable to new endpoints (Phase 2) — build the UI
     now with the mutation calls stubbed/`TODO`'d against `src/lib/api.js`.
   - "Create user" keeps the existing `adminCreateUser` + `updateUserRole`
     flow already in `Admin.jsx` (lines 101-124) — just move it into this
     component.
   - Export button: add `xlsx` and `jspdf` + `jspdf-autotable` to
     `package.json`, export the currently-filtered rows.
2. **Audit Log page** (`AdminAuditLog.jsx`)
   - Move the audit log off the dashboard card onto its own tab, backed by
     the existing `getAuditLog()`/`toAuditLogView`.
   - Add search + action-type filter + date range, client-side pagination,
     and a "View" button per row opening a detail modal (whatever fields
     `getAuditLog()` returns — check the DTO; add IP/user-agent columns only
     if the backend actually captures them, otherwise omit rather than
     fabricate data).
   - Export to Excel/PDF for the filtered rows.
3. **Roles & Permissions page** (`AdminRoles.jsx`) — see the important caveat
   below before building this one.

## Phase 2 — needs backend changes (separate repo: Sencecon.API)

These can't be finished from this repo alone. Scope them with whoever owns
the API:

- `PUT/POST /api/users/{id}/disable` and `/enable` (or a single `status`
  field on the existing user update).
- An admin "set password directly" endpoint, distinct from the existing
  self-service `changePassword` (`src/lib/api.js:183`) which requires the
  *current* password and only works for your own account.
- A "send password reset link" endpoint + email flow.
- Integrations: real settings storage per tenant (SMS gateway, WhatsApp,
  weather feed, ZESCO tariff credentials) — currently 100% mock data in
  `mockData.js`. Needs a settings table/endpoint before `AdminIntegrations.jsx`
  can do anything beyond decorate the mock array.
- Tenants and Templates: same story — decide whether these get real backing
  now or stay mock for longer.

## Important caveat: "Roles & Permissions" as requested vs. what exists

The prototype's Roles & Permissions page assumes roles are dynamic (create a
role, tick arbitrary page/task checkboxes per role). This codebase's roles
are a **fixed 5-value enum enforced by the backend** (`Roles.cs` +
`MODULE_ACCESS`), not a dynamic RBAC table. Two honest paths forward — pick
one explicitly rather than half-building both:

- **Option A (small, ships in this phase):** `AdminRoles.jsx` is a read-only
  viewer over the existing `MODULE_ACCESS`/`USER_ROLE_META` data — every user
  can see which of the 5 fixed roles can access which module, matching "users
  should be able to see the roles." No "create role" button, no editable
  checkboxes, since there's nowhere to persist them yet.
- **Option B (real RBAC, a separate project):** replace the fixed enum with
  DB-backed `Roles` and `RolePermissions` tables, new CRUD endpoints, and
  update every `[Authorize]`/`canAccess` check in both repos to read from the
  new table instead of the hardcoded switch. This is the only way to support
  "create a new role" and per-role checkbox editing for real. Don't fake this
  with local-only state — it'll look done and silently do nothing.

Recommend starting with Option A now and filing Option B as its own ticket.

## Acceptance checklist

- [ ] Admin.jsx split into overview/users/roles/audit/integrations tabs,
      no change to `App.jsx` or `navGroups` required.
- [ ] Users: search, filter, pagination, view/change-password/reset-password/
      disable-enable actions, create-user with role assignment, Excel/PDF
      export — all functional against real data (mutations may be stubbed
      until Phase 2 endpoints exist, but should be wired to real API calls
      the moment they land).
- [ ] Audit log: own tab, filters, pagination, view-detail action, export.
- [ ] Roles & Permissions: Option A read-only viewer shipped; Option B scoped
      as a separate backend ticket, not silently skipped.
- [ ] Integrations: tabbed UI in place; each tab clearly marked "not yet
      persisted" until its backend settings endpoint exists, so it doesn't
      look like a working save that quietly does nothing.
- [ ] `xlsx`/`jspdf`/`jspdf-autotable` added to `package.json`.
