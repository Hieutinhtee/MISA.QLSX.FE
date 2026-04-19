# Copilot Instructions for MISA.QLSX.FE

## Big picture
- This FE is a Vue 3 + Vite app with feature pages under `src/views/*`.
- Shared UI lives in `src/components/*`; shared list/paging behavior lives in `src/composables/usePagingTable.js`.
- API calls go through `src/apis/base/BaseAPI.js` and `src/apis/config/APIConfig.js`.
- Routes are centralized in `src/router/index.js` and map directly to `/shifts`, `/employees`, `/contract-templates`, and `/contracts`.

## FE architecture patterns
- Use `usePagingTable(apiInstance)` for list screens instead of duplicating paging/search/reload state.
- Use `MsTable.vue` as the canonical grid: it already handles paging, sorting, filtering, row selection, pinned columns, and column customization.
- Use custom controls from `src/components/*` first (`MsInput`, `MsSelect`, `MsButton`, `MsTable`); use Ant Design Vue only when a custom control is missing or not worth adding.
- Keep component data and API payloads in camelCase end-to-end.
- Feature pages should be driven by a `columns` config array like `src/views/shift/Index.vue`.

## API / data flow
- Concrete API classes only set `this.controller` and inherit `getAll`, `getById`, `paging`, `create`, `update`, and `delete` from `BaseAPI`.
- `APIConfig.js` already sets the Axios base URL and global error interceptor; reuse its alert behavior instead of adding per-page error handling.
- Backend responses typically expose `data`, `meta.total`, and error payloads from middleware; keep FE parsing aligned with that shape.
- `usePagingTable()` currently debounces search and calls paging after a 300ms delay; keep that contract stable when extending list pages.

## UI conventions
- `MsTable.vue` persists column settings via `storageKey`/localStorage; keep props and emitted events backward compatible.
- `MsTable.vue` row actions and the column-customization drawer are shared across pages, so avoid breaking layout or event names.
- When adding UI, prefer small, targeted layout edits over broad reformatting.
- Add comments only where the UI or logic is non-obvious, especially around drawer state, drag/drop, filters, and custom form flow.

## Integration points
- `main.js` mounts Vue Router and Vue Toastification globally; do not duplicate toast setup inside pages.
- `src/utils/alertService.js` and `src/utils/toastService.js` are the shared UI feedback mechanisms.
- `src/common/model/shiftModel.js` contains reusable filter/sort helpers used by the table flow.
- `src/assets/css/main.css` is the global style entry; keep component styles scoped unless they are truly shared.

## Database access (optional)

If you need direct database access for schema inspection, data verification, or migrations:
- Start the **MCP MySQL server**: `cd docs/mcp && npm install && npm start`
- This exposes tools: `query`, `execute`, `getSchema`, `listTables`, `getConnectionInfo`
- Connection: `localhost:3306/misa_qlsx` (root:abc123@) — read from `docs/mcp/.env` or `MISA.QLSX.Api/appsettings.json`
- Use case: Agent can automatically inspect DB schema, generate migrations, or verify test data

## Workflows
- FE install: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- MCP server: `cd docs/mcp && npm install && npm start`

## Guidance for AI agents
- Read the feature page, its API class, and the shared table/composable before changing behavior.
- Preserve existing naming, event contracts, and persisted column settings.
- Prefer the smallest fix that matches the current architecture.
- Validate UI layout and comment clarity in the same pass after modifying a component.
- For database queries or schema inspection, use the MCP MySQL server tools instead of direct API calls.
