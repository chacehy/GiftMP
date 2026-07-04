import "server-only";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

// When real Supabase credentials are configured, storage goes to Supabase
// Storage. Otherwise (e.g. local development without a Supabase project
// set up yet) files are written to public/uploads and served as static
// assets, so uploads work out of the box with zero external setup.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseServiceKey && !supabaseUrl.includes("placeholder"));

const supabase = useSupabase ? createClient(supabaseUrl!, supabaseServiceKey!) : null;

const LOCAL_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

async function toBuffer(file: Buffer | Blob | File): Promise<Buffer> {
  if (Buffer.isBuffer(file)) return file;
  const arrayBuffer = await (file as Blob).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Uploads a file to a specified bucket
 * @param bucket The name of the storage bucket (e.g., 'product-images', 'shop-assets')
 * @param path The path within the bucket (e.g., 'shop-id/filename.jpg')
 * @param file The file buffer or Blob
 * @param contentType The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Buffer | Blob | File,
  contentType?: string
): Promise<string> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  const buffer = await toBuffer(file);
  const destDir = path.join(LOCAL_UPLOADS_ROOT, bucket, path.dirname(filePath));
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOADS_ROOT, bucket, filePath), buffer);

  return `/uploads/${bucket}/${filePath}`;
}

/**
 * Deletes a file from a specified bucket
 * @param bucket The name of the storage bucket
 * @param path The path to the file within the bucket
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  if (useSupabase && supabase) {
    // If we are passed a full URL, extract the path
    let key = filePath;
    if (filePath.startsWith("http")) {
      const parts = filePath.split(`/${bucket}/`);
      if (parts.length === 2) key = parts[1];
    }

    const { error } = await supabase.storage.from(bucket).remove([key]);
    if (error) {
      console.error("Storage delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    return;
  }

  let key = filePath;
  const marker = `/uploads/${bucket}/`;
  if (filePath.includes(marker)) {
    key = filePath.slice(filePath.indexOf(marker) + marker.length);
  }

  await unlink(path.join(LOCAL_UPLOADS_ROOT, bucket, key)).catch(() => {});
}
