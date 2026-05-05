import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client specifically for storage
// Note: We use the service role key so this should ONLY be called from the server
// Never expose this client to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  path: string,
  file: Buffer | Blob | File,
  contentType?: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Deletes a file from a specified bucket
 * @param bucket The name of the storage bucket
 * @param path The path to the file within the bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  // If we are passed a full URL, extract the path
  let filePath = path;
  if (path.startsWith("http")) {
    const parts = path.split(`/${bucket}/`);
    if (parts.length === 2) {
      filePath = parts[1];
    }
  }

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error("Storage delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
