# Changelog

All notable changes to the **Erix React SDK** will be documented in this file.

## [1.2.0] - 2026-04-06

### Added
- **Real-time Pipeline Tracking**: Integrated Socket.IO for live CRM stage updates and lead status synchronization.
- **Optimistic CRM Actions**: Support for `crm.leads.create` and `crm.leads.edit` with zero-latency state updates.
- **ErixDashboard Components**: Full-experience modules for CRM, WhatsApp, and Marketing under a single unified dashboard component.
- **ErixCommandPalette (⌘K)**: Global search and quick-action menu for rapid navigation and lead lookup.
- **Enhanced Documentation**: Modular `docs/` suite covering Getting Started, Hooks, Components, Theming, and RBAC.

### Changed
- **Unified Provider**: `ErixProvider` now auto-composes `ErixPermissionsProvider` and `ErixI18nProvider`.
- **Alignments**: Resource paths updated to match `ECOD/backend` (e.g. `/api/crm/leads` instead of `/api/saas/crm/leads`).
- **Permissions**: Switched to strict string literals for `ErixPermission` to improve type safety.

### Fixed
- **Memory Leaks**: `AbortController` added to all hooks to prevent state updates on unmounted components.
- **Typing errors**: Fixed linting issues in `ErixProvider` related to permission props.

### Removed
- **ROADMAP.md**: Deprecated in favor of this structured changelog.

---

[1.1.x] and below are preserved in git history.
