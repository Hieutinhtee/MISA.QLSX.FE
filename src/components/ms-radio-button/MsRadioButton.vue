<template>
  <label class="ms-radio mr-4">
    <input
      type="radio"
      :value="value"
      :checked="modelValue === value"
      @change="$emit('update:modelValue', value)"
      tabindex="0"
    />
    <span class="checkmark"></span>
    <div class="flex-column ms-radio-content">
      <span class="ms-radio--text">
        <slot></slot>
      </span>
    </div>
  </label>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [Boolean, String, Number], default: null },
  value: { type: [Boolean, String, Number], required: true },
  name: { type: String, default: 'radio-group' },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.ms-radio {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.mr-4 {
  margin-right: 1rem;
}
.ms-radio input {
  position: absolute;
  cursor: pointer;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  margin: 0;
  padding: 0;
  opacity: 0;
}
input:checked ~ .checkmark:before {
  content: '';
  display: inline-block;
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: #009b71;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
input:checked ~ .checkmark {
  border-color: #009b71;
}
.checkmark {
  display: inline-block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  color: #fff;
  text-align: center;
  border-radius: 50%;
  position: relative;
  border: 1px solid #7b7b7b;
  background-color: #fff;
  cursor: pointer;
}
.ms-radio-content {
  justify-content: center;
  align-items: flex-start;
  gap: 4px;
  padding-left: 8px;
}
.ms-radio-content .ms-radio--text {
  display: inline-block;
  font-weight: 500;
}
</style>
