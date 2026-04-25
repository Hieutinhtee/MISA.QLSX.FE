# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint with auto-fix and caching
- `npm run format` - Format code with Prettier

## Project Architecture

This is a Vue 3 shift management system (QLSX - Quản Lý Sản Xuất) built with:
- **Vue 3** with Composition API and `<script setup>` syntax
- **Vite** for build tooling and dev server
- **Ant Design Vue** for UI components
- **Vue Router** for navigation
- **Axios** for API communication
- **Pinia** for state management (installed but not extensively used)

### Key Architectural Patterns

**API Layer Pattern:**
- All API classes extend `BaseAPI` which provides CRUD methods (`getAll`, `getById`, `paging`, `create`, `update`, `delete`)
- API classes are singletons exported as `new ClassName()`
- Centralized error handling via axios interceptors in `APIConfig.js`
- Base URL: `https://localhost:7124/api/v1`

**Component Architecture:**
- Custom `Ms*` components wrap Ant Design Vue components with consistent styling
- `MsTable` is a complex data grid component with pagination, filtering, sorting, column customization, and row actions
- Components use Vue 3 Composition API with `<script setup>` syntax
- Props and emits are explicitly defined with TypeScript-like patterns

**State Management:**
- `usePagingTable` composable for table pagination and data loading
- Local component state using `ref` and `reactive`
- No centralized store for most features - components manage their own state

**Routing Structure:**
- Main views: `/shifts`, `/employees`, `/contract-templates`, `/contracts`, `/payrolls`
- Sidebar navigation maps menu items to routes
- Active menu highlighting based on current route

### Project Structure

```
src/
├── apis/              # API layer
│   ├── config/        # API configuration and interceptors
│   ├── base/          # BaseAPI class with CRUD methods
│   └── components/    # Feature-specific API classes
├── assets/            # Static assets (images, icons, CSS)
├── common/            # Shared models and mock data
│   ├── model/         # Data models and factory functions
│   └── datas/         # Mock data for development
├── components/        # Reusable components
│   └── ms-*/          # Custom Ms* components
├── composables/       # Vue composables
├── layout/            # Layout components (Navbar, Sidebar)
├── router/            # Vue Router configuration
├── utils/             # Utility functions
├── views/             # Page components
└── main.js            # Application entry point
```

### Important Conventions

**API Usage:**
- Always extend `BaseAPI` for new API classes
- Use the singleton pattern: `export default new ClassName()`
- Handle errors via the centralized interceptor - no need for try/catch in most cases

**Component Development:**
- Use `<script setup>` syntax
- Define props with explicit types and validators
- Use computed properties for derived state
- Emit events with clear naming conventions

**Table Components:**
- Use `usePagingTable` composable for paginated tables
- Pass `columns`, `rows`, `paginationData`, and `loading` to `MsTable`
- Handle row actions via emits (`editRow`, `deleteRow`, `duplicate`, etc.)

**Styling:**
- Custom CSS in component `<style scoped>` blocks
- Ant Design Vue theme customization in `vite.config.js`
- Primary color: `#009b71` (green)
- Border radius: 4px

**Data Models:**
- Factory functions in `common/model/` for creating new instances
- Filter and sort creators: `createFilter()`, `createSort()`
- Mock data in `common/datas/` for development

### Development Notes

- The project uses Vietnamese language in UI and comments
- API interceptors handle common error scenarios (400 validation, 404, 5xx)
- Local storage is used for sidebar state and table column preferences
- Day.js is configured for Vietnamese locale
- Toast notifications use vue-toastification library
- Custom alert service for user notifications