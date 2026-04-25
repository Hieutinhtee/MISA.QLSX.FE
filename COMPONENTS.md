# Component Development Guide

## Overview

This guide covers the patterns and conventions for developing components in the MISA.QLSX.FE project. Components follow Vue 3 Composition API patterns with custom `Ms*` naming convention.

## Component Architecture

### Component Types

**1. Page Components** (`src/views/`)
- Full-page features (e.g., `shift/Index.vue`)
- Use `usePagingTable` for data tables
- Handle routing and navigation

**2. Layout Components** (`src/layout/`)
- Application structure (e.g., `TheNavbar.vue`, `TheSidebar.vue`)
- Persistent across routes
- Handle global UI state

**3. Reusable Components** (`src/components/ms-*/`)
- Custom UI components (e.g., `MsButton.vue`, `MsTable.vue`)
- Wrap Ant Design Vue components
- Highly reusable and configurable

## Component Development Patterns

### Basic Component Structure

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'focus']);

// State
const internalValue = ref(props.modelValue);

// Computed
const isValid = computed(() => internalValue.value.length > 0);

// Methods
const handleChange = (value) => {
  internalValue.value = value;
  emit('update:modelValue', value);
  emit('change', value);
};

// Lifecycle
onMounted(() => {
  // Initialization logic
});
</script>

<template>
  <div class="ms-component">
    <!-- Component template -->
  </div>
</template>

<style scoped>
.ms-component {
  /* Component styles */
}
</style>
```

### Props Definition

Always define props with explicit types and validation:

```javascript
const props = defineProps({
  // Required prop
  requiredProp: {
    type: String,
    required: true
  },

  // Optional prop with default
  optionalProp: {
    type: Number,
    default: 0
  },

  // Complex prop with validator
  complexProp: {
    type: Array,
    default: () => [],
    validator: (value) => Array.isArray(value)
  },

  // Enum-like prop
  status: {
    type: String,
    default: 'active',
    validator: (value) => ['active', 'inactive', 'pending'].includes(value)
  }
});
```

### Emits Definition

Define all emitted events explicitly:

```javascript
const emit = defineEmits([
  'update:modelValue',  // v-model support
  'change',             // Value changed
  'focus',              // Focus event
  'blur',               // Blur event
  'submit'              // Form submission
]);
```

### Composable Usage

Use composables for reusable logic:

```javascript
import { usePagingTable } from '@/composables/usePagingTable';

const {
  loading,
  rows,
  payload,
  loadDataForAPI,
  reloadData,
  onPaginationUpdate,
  onSearchChange
} = usePagingTable(shiftsAPI);
```

## Custom Component Guidelines

### MsButton Component

Custom button component with consistent styling:

```vue
<ms-button
  type="primary"
  icon-left="icon-class"
  @click="handleClick"
>
  Button Text
</ms-button>
```

**Types**: `primary`, `secondary`, `danger`, `outline`, `ghost`, `text`

### MsInput Component

Custom input component with validation support:

```vue
<ms-input
  v-model="formData.name"
  label="Full Name"
  placeholder="Enter name"
  :required="true"
  :width="300"
/>
```

### MsSelect Component

Custom select component for dropdowns:

```vue
<ms-select
  v-model="selectedValue"
  :options="options"
  placeholder="Select option"
  :disabled="false"
/>
```

### MsTable Component

Complex data table with pagination, filtering, and sorting:

```vue
<ms-table
  :columns="columns"
  :rows="rows"
  :pagination-data="paginationData"
  :loading="loading"
  storage-key="shifts-table"
  @update:pagination="handlePagination"
  @edit-row="handleEdit"
  @delete-row="handleDelete"
/>
```

**Key Features**:
- Pagination with configurable page sizes
- Column filtering and sorting
- Column customization (show/hide, resize, pin)
- Row selection and batch operations
- Persistent column settings

## Component Best Practices

### 1. Naming Conventions

- **Components**: PascalCase with `Ms` prefix (`MsButton.vue`)
- **Props**: camelCase (`modelValue`, `isLoading`)
- **Events**: kebab-case (`@update:modelValue`, `@row-click`)
- **CSS Classes**: kebab-case with component prefix (`ms-button__primary`)

### 2. State Management

- Use `ref` for primitive values
- Use `reactive` for objects
- Use `computed` for derived state
- Keep state as local as possible

### 3. Performance

- Use `v-if` for conditional rendering (expensive components)
- Use `v-show` for frequent toggling (cheap components)
- Use `computed` properties for expensive calculations
- Avoid unnecessary re-renders with proper key usage

### 4. Accessibility

- Use semantic HTML elements
- Provide proper ARIA labels
- Support keyboard navigation
- Ensure sufficient color contrast

### 5. Styling

- Use scoped styles to prevent conflicts
- Follow CSS naming conventions (BEM-ish)
- Use CSS variables for theming
- Maintain consistent spacing and sizing

## Component Testing

### Manual Testing Checklist

- [ ] Component renders correctly
- [ ] Props work as expected
- [ ] Events fire correctly
- [ ] State updates properly
- [ ] Responsive design works
- [ ] Accessibility features work
- [ ] Error states display correctly

### Integration Testing

- Test component integration with parent components
- Verify data flow between components
- Test event handling and propagation
- Check component lifecycle behavior

## Common Patterns

### Form Components

```vue
<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: String,
  required: Boolean
});

const emit = defineEmits(['update:modelValue']);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>
```

### List Components

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([]);
const selectedItems = ref([]);

const isSelected = (item) => {
  return selectedItems.value.includes(item.id);
};

const toggleSelection = (item) => {
  const index = selectedItems.value.indexOf(item.id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(item.id);
  }
};
</script>
```

### Modal Components

```vue
<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: String
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script>
```

## Troubleshooting

### Common Issues

**Component Not Rendering**
- Check component import and registration
- Verify prop types and values
- Check for console errors

**Props Not Updating**
- Ensure proper v-model usage
- Check emit event names
- Verify parent component state

**Styles Not Applying**
- Check style scoping
- Verify CSS specificity
- Check for style conflicts

**Events Not Firing**
- Verify event listener attachment
- Check emit syntax
- Ensure proper event naming

## Resources

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 3 Script Setup](https://vuejs.org/api/sfc-script-setup.html)
- [Ant Design Vue Components](https://antdv.com/components/overview)
- [Vue Style Guide](https://vuejs.org/style-guide/)