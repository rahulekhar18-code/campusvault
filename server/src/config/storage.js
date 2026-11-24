import dotenv from 'dotenv';
import { createClient } from '@insforge/sdk';

dotenv.config();

const insforge = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_API_KEY
});

export const BUCKET_NAME = process.env.STORAGE_BUCKET || 'campusvault-files';

/**
 * Uploads a file buffer to private Supabase/InsForge storage
 */
export async function uploadPrivateFile(buffer, storageKey, mimeType, originalName) {
  const file = new File([buffer], originalName || 'file', { type: mimeType });
  const { data, error } = await insforge.storage
    .from(BUCKET_NAME)
    .upload(storageKey, file);

  if (error) {
    throw new Error(`Storage upload failed: ${error.message || JSON.stringify(error)}`);
  }
  return data;
}

/**
 * Downloads a private file stream/buffer from Supabase/InsForge storage
 */
export async function downloadPrivateFile(storageKey) {
  const { data, error } = await insforge.storage
    .from(BUCKET_NAME)
    .download(storageKey);

  if (error) {
    throw new Error(`Storage download failed: ${error.message || JSON.stringify(error)}`);
  }

  // Convert Blob to ArrayBuffer then Buffer for Express streaming
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Deletes a file from Supabase/InsForge storage
 */
export async function deletePrivateFile(storageKey) {
  const { data, error } = await insforge.storage
    .from(BUCKET_NAME)
    .remove([storageKey]);

  if (error) {
    console.error(`Storage delete error for key ${storageKey}:`, error);
  }
  return data;
}

/**
 * Moves a private file from old storage key to new storage key
 */
export async function movePrivateFile(oldKey, newKey, mimeType, originalName) {
  if (!oldKey || !newKey || oldKey === newKey) return;
  try {
    const buffer = await downloadPrivateFile(oldKey);
    await uploadPrivateFile(buffer, newKey, mimeType, originalName);
    await deletePrivateFile(oldKey);
    console.log(`✓ Moved file from ${oldKey} to ${newKey}`);
  } catch (err) {
    console.error(`Failed to move file from ${oldKey} to ${newKey}:`, err);
    throw err;
  }
}
