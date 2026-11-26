const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

export function getAuthToken() {
  return localStorage.getItem('campusvault_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('campusvault_token', token);
  } else {
    localStorage.removeItem('campusvault_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if body is FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkErr) {
    // If request failed (e.g. Render server cold start or temporary DNS glitched), retry after brief delay
    try {
      await new Promise(r => setTimeout(r, 1000));
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
    } catch (retryErr) {
      throw new Error('Connection delayed. Please tap again to retry.');
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch (e) {
      errorMsg = response.statusText || errorMsg;
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}

/**
 * Downloads a file from the server with proper filename
 */
export async function downloadFile(resourceId, fallbackName = 'downloaded-file') {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/resources/${resourceId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    let errorMsg = 'Failed to download file';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  // Extract filename from Content-Disposition header if available
  let filename = fallbackName;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Fetch raw file blob securely for in-app reader modal
 */
export async function fetchResourceBlob(resourceId) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/resources/${resourceId}/download?mode=preview`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    let errorMsg = 'Failed to load document';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const mimeType = response.headers.get('Content-Type') || '';
  const blob = await response.blob();
  return { blob, mimeType };
}

/**
 * Opens a file in a new browser tab for inline reading/preview
 */
export async function previewFile(resourceId) {
  const { blob } = await fetchResourceBlob(resourceId);
  const previewUrl = window.URL.createObjectURL(blob);
  window.open(previewUrl, '_blank');
}

/**
 * Toggle lock/unlock status of a resource (Admin)
 */
export async function toggleResourceLock(id) {
  return await apiRequest(`/admin/resources/${id}/toggle-lock`, {
    method: 'PATCH'
  });
}
