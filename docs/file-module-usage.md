# File Module — FE Usage Guide

This document explains how to use the backend `Files` API from the front-end (upload, list, download, delete), with minimal examples (Axios) and a Vue 3 sample component.

## Endpoints

- Upload (POST multipart/form-data)
  - URL: `POST /api/v1/Files/upload`
  - Form fields:
    - `file`: file payload (IFormFile)
    - `moduleName`: string (e.g. "Payroll")
    - `entityName`: string (e.g. "Employee")
    - `entityId`: string/number
    - `purpose`: optional string (e.g. "contract")
  - Response: `FileUploadResponse` JSON with metadata (fileId, originalName, storedName, relativePath, mimeType, sizeBytes, ...)

- List by entity
  - URL: `GET /api/v1/Files/by-entity?moduleName=...&entityName=...&entityId=...`
  - Returns: array of `FileItemResponse` (metadata + fileId)

- Download
  - URL: `GET /api/v1/Files/download/{fileId}`
  - Returns: file bytes (use `responseType: 'blob'` on FE)

- Delete
  - URL: `DELETE /api/v1/Files/{fileId}`
  - Returns: success status (200/204)

## Axios Examples

### Upload (multipart)

```javascript
import axios from 'axios';

export async function uploadFile(file, meta, token) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('moduleName', meta.moduleName);
  fd.append('entityName', meta.entityName);
  fd.append('entityId', String(meta.entityId));
  if (meta.purpose) fd.append('purpose', meta.purpose);

  const resp = await axios.post('/api/v1/Files/upload', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onUploadProgress: (progressEvent) => {
      // progressEvent.loaded / progressEvent.total
    },
  });
  return resp.data;
}
```

### List

```javascript
export async function listFiles(meta, token) {
  const resp = await axios.get('/api/v1/Files/by-entity', {
    params: {
      moduleName: meta.moduleName,
      entityName: meta.entityName,
      entityId: meta.entityId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return resp.data;
}
```

### Download (browser save)

```javascript
export async function downloadFile(fileId, token, suggestedName) {
  const resp = await axios.get(`/api/v1/Files/download/${fileId}`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const url = window.URL.createObjectURL(new Blob([resp.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName || 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
```

### Delete

```javascript
export async function deleteFile(fileId, token) {
  await axios.delete(`/api/v1/Files/${fileId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
```

## Quick Vue 3 Example (Composition API)

Save as a quick test component or adapt into your app. This is minimal and intended for local dev testing.

```vue
<template>
  <div>
    <input type="file" @change="onFileChange" />
    <button @click="doUpload" :disabled="!selected">Upload</button>

    <ul>
      <li v-for="f in files" :key="f.fileId">
        {{ f.originalName }} ({{ f.sizeBytes }} bytes)
        <button @click="download(f.fileId, f.originalName)">Download</button>
        <button @click="remove(f.fileId)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const selected = ref(null);
const files = ref([]);
const meta = { moduleName: 'Payroll', entityName: 'Employee', entityId: '123' };
const token = null; // set if auth required

function onFileChange(e) { selected.value = e.target.files[0]; }

async function doUpload() {
  if (!selected.value) return;
  const fd = new FormData();
  fd.append('file', selected.value);
  fd.append('moduleName', meta.moduleName);
  fd.append('entityName', meta.entityName);
  fd.append('entityId', meta.entityId);
  await axios.post('/api/v1/Files/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    onUploadProgress: (ev) => {
      // optional: show progress
    }
  });
  await load();
}

async function load() {
  const resp = await axios.get('/api/v1/Files/by-entity', { params: meta, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  files.value = resp.data;
}

async function download(fileId, name) {
  const resp = await axios.get(`/api/v1/Files/download/${fileId}`, { responseType: 'blob', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const url = URL.createObjectURL(resp.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function remove(fileId) {
  await axios.delete(`/api/v1/Files/${fileId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  await load();
}

onMounted(load);
</script>
```

## Notes & Recommendations

- Mirror backend validation on FE: allowed extensions and max size (see backend `appsettings.json` `FileStorage` section) to improve UX.
- If your app uses auth, include `Authorization` header; backend may attribute `CreatedBy` from session/token.
- For large files, use `onUploadProgress` to show progress and consider chunking if necessary.
- Ensure `axios.baseURL` or proxy is configured so `/api/v1/...` targets the API server.

---

File created for quick integration testing and developer reference in FE.
