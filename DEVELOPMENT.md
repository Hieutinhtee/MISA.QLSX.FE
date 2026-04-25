# Development Guide

## Project Overview

This is a Vue 3 shift management system (QLSX - Quản Lý Sản Xuất) for managing work shifts, employees, contracts, and payroll. The application uses a modern frontend stack with custom components built on top of Ant Design Vue.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## Core Architecture

### Technology Stack
- **Frontend Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **UI Library**: Ant Design Vue 4.x
- **State Management**: Pinia (installed, minimal usage)
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Styling**: Custom CSS with Ant Design theme customization

### Key Patterns

**1. API Layer**
- All APIs extend `BaseAPI` class
- Single instance pattern: `export default new ClassName()`
- Centralized error handling via axios interceptors
- Base URL: `https://localhost:7124/api/v1`

**2. Component Architecture**
- Custom `Ms*` components wrap Ant Design Vue
- Composition API with `<script setup>` syntax
- Explicit prop definitions and type validation
- Clear emit event naming

**3. Data Management**
- `usePagingTable` composable for paginated lists
- Local component state with `ref` and `reactive`
- Factory functions for data models
- Mock data for development

## File Structure

```
src/
├── apis/              # API layer
│   ├── config/APIConfig.js      # Axios configuration
│   ├── base/BaseAPI.js           # Base API class
│   └── components/               # Feature-specific APIs
├── assets/            # Static assets
├── common/            # Shared models and data
│   ├── model/         # Data models
│   └── datas/         # Mock data
├── components/        # Reusable components
│   └── ms-*/          # Custom components
├── composables/       # Vue composables
├── layout/            # Layout components
├── router/            # Route configuration
├── utils/             # Utility functions
├── views/             # Page components
└── main.js            # Entry point
```

## Development Guidelines

### Creating New Features

1. **API Layer**: Create new API class extending `BaseAPI`
2. **Data Models**: Define factory functions in `common/model/`
3. **Views**: Create view component in `src/views/`
4. **Routing**: Add route in `src/router/index.js`
5. **Navigation**: Update sidebar menu in `src/layout/TheSidebar.vue`

### Component Development

- Use `<script setup>` syntax
- Define props with explicit types
- Use computed properties for derived state
- Keep components focused and reusable
- Follow existing naming conventions (`Ms*` prefix)

### API Integration

- Extend `BaseAPI` for new endpoints
- Use singleton pattern for API classes
- Leverage centralized error handling
- Keep response parsing consistent

### Styling

- Use scoped styles in components
- Follow Ant Design theme conventions
- Maintain consistent spacing and colors
- Primary color: `#009b71`

## Common Tasks

### Adding a New List Page

1. Create API class extending `BaseAPI`
2. Create view component with `usePagingTable`
3. Define columns configuration
4. Add route to router
5. Update sidebar navigation

### Creating Custom Components

1. Create component in `src/components/ms-*/`
2. Use `<script setup>` syntax
3. Define props and emits explicitly
4. Add scoped styles
5. Export and import where needed

### API Error Handling

- Errors are handled centrally in `APIConfig.js`
- Validation errors (400) display field-specific messages
- Custom errors use `{ error: { userMsg, devMsg, traceId } }` format
- No need for try/catch in most API calls

## Testing

Currently no test command is configured. Manual testing is performed via:
- Development server (`npm run dev`)
- Browser testing
- API integration testing

## Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build output is in the `dist/` directory.

## Troubleshooting

### Common Issues

**API Connection Errors**
- Check backend is running on `https://localhost:7124`
- Verify API endpoint configuration
- Check browser console for detailed error messages

**Component Rendering Issues**
- Ensure all props are properly defined
- Check for missing imports
- Verify component registration

**Styling Problems**
- Check Ant Design theme configuration
- Verify CSS scoping
- Check for style conflicts

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Ant Design Vue](https://antdv.com/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)