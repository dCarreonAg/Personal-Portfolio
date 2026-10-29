/* Project images in the public "project-images" bucket. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from 'astro:env/client';
import type { Database } from '../database.types';

const BUCKET = 'project-images';
const PUBLIC_PREFIX = `${PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`;

/** Vercel functions accept request bodies up to 4.5 MB, so stay under that. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const ACCEPT = Object.keys(EXTENSIONS).join(',');

/** A file the user picked, or null when the input was left empty. */
export function pickedFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export function checkImage(file: File): string | null {
  if (!EXTENSIONS[file.type]) return 'Usa una imagen PNG, JPEG, WebP o AVIF.';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen pesa más de 4 MB. Expórtala como WebP o JPEG.';
  return null;
}

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  projectId: string,
  file: File,
): Promise<string> {
  const path = `${projectId}/${Date.now()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Deletes the stored file behind a public URL; ignores URLs from elsewhere. */
export async function removeImage(supabase: SupabaseClient<Database>, url: string | null): Promise<void> {
  if (!url?.startsWith(PUBLIC_PREFIX)) return;
  const { error } = await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(PUBLIC_PREFIX.length))]);
  if (error) console.error('Could not delete image:', error.message);
}
