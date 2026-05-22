import { supabase } from "@/lib/supabaseClient";
import type { UserDocument } from "@/lib/document";

export async function downloadDocument(userId: string): Promise<UserDocument | null> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("data_json")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows — first login
    throw new Error(`Download failed: ${error.message}`);
  }

  return data.data_json as UserDocument;
}
