# Copilot Instructions for MISA.QLSX.FE

## Read first

- Project overview and prompt patterns: [docs/copilot/README.md](../docs/copilot/README.md)
- Reusable prompt skeletons: [docs/copilot/skill-template.md](../docs/copilot/skill-template.md), [docs/copilot/agent-template.md](../docs/copilot/agent-template.md), [docs/copilot/subagent-template.md](../docs/copilot/subagent-template.md)

## Big picture

- FE stack: Vue 3 + Vite.
- Feature pages: `src/views/*`.
- Shared UI: `src/components/*`.
- Shared list flow: `src/composables/usePagingTable.js`.
- API clients: `src/apis/base/BaseAPI.js` and `src/apis/config/APIConfig.js`.
- Main routes: `/shifts`, `/employees`, `/contract-templates`, `/contracts` in `src/router/index.js`.

## Architecture rules

- Use `usePagingTable(apiInstance)` for list pages. Do not duplicate paging/search/reload state.
- Treat `src/components/ms-table/MsTable.vue` as the canonical table.
- Prefer custom controls (`MsInput`, `MsSelect`, `MsButton`, `MsTable`) before Ant Design Vue components.
- Keep FE state and API payloads camelCase end-to-end.
- Keep list pages driven by a `columns` config array (canonical example: `src/views/shift/Index.vue`).

## API and behavior contracts

- Concrete API classes should only set `this.controller` and inherit base CRUD from `BaseAPI`.
- Keep `APIConfig.js` as the single place for global API error handling. Avoid page-level interceptor duplication.
- Keep response parsing aligned with `data` + `meta.total`.
- Keep `usePagingTable()` search debounce behavior stable (300ms).

## Shared UI compatibility

- `MsTable.vue` persists column settings via `storageKey` + localStorage. Keep props/events backward compatible.
- Avoid breaking row-action events and column-customization drawer behavior.
- Prefer focused edits over broad reformatting.
- Add comments only for non-obvious logic.

## Dev workflow

- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Node version: `^20.19.0 || >=22.12.0`
- Note: no FE test command is currently configured.

## Optional DB/MCP workflow

- Use MCP for schema checks, data verification, and migrations.
- From FE root, start MCP server with: `cd ../docs/mcp && npm install && npm start`
- Connection details are read from `../docs/mcp/.env` or `../MISA.QLSX.BE/MISA.QLSX.Api/appsettings.json`.

## Agent checklist before edits

- Read the feature page, its API class, and `usePagingTable` usage first.
- Preserve naming/event contracts and table persistence behavior.
- Make the smallest change that fits current architecture.
- Validate layout and comment clarity in the same pass.
