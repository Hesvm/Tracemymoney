import type { UserDocument } from "@/lib/document";

export function mergeDocuments(local: UserDocument, cloud: UserDocument): UserDocument {
  const localTime = new Date(local.metadata.updatedAt).getTime();
  const cloudTime = new Date(cloud.metadata.updatedAt).getTime();
  return cloudTime > localTime ? cloud : local;
}
