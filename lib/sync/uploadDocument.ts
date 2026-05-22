import { supabase } from "@/lib/supabaseClient";
import type { UserDocument } from "@/lib/document";

export async function uploadDocument(userId: string, doc: UserDocument): Promise<void> {
  const { error } = await supabase
    .from("user_documents")
    .upsert(
      {
        user_id: userId,
        data_json: doc,
        version: doc.metadata.version,
        updated_at: doc.metadata.updatedAt,
      },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(`Upload failed: ${error.message}`);
}
