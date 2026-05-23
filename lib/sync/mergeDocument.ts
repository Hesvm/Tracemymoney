import type { UserDocument } from "@/lib/document";

export function mergeDocuments(local: UserDocument, cloud: UserDocument): UserDocument {
  const cloudHasData = cloud.nodes.length > 0 || cloud.items.length > 0;
  const localHasData = local.nodes.length > 0 || local.items.length > 0;

  // Never let an empty cloud document overwrite real local data
  if (!cloudHasData && localHasData) return local;

  const localTime = new Date(local.metadata.updatedAt).getTime();
  const cloudTime = new Date(cloud.metadata.updatedAt).getTime();
  return cloudTime > localTime ? cloud : local;
}
