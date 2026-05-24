import Dexie, { type Table } from "dexie";
import type { UserDocument } from "@/lib/document";

interface LocalRecord {
  id: string;
  data: UserDocument;
  updatedAt: string;
}

export interface CachedExchangeRate {
  date: string;        // YYYY-MM-DD — primary key
  usdToToman: number;
  source: "navasan" | "manual";
  createdAt: string;
}

class MoneyMapDB extends Dexie {
  documents!: Table<LocalRecord, string>;
  exchangeRates!: Table<CachedExchangeRate, string>;

  constructor() {
    super("money-map-db");
    this.version(1).stores({
      documents: "id",
    });
    this.version(2).stores({
      documents: "id",
      exchangeRates: "date",
    });
  }
}

export const db = new MoneyMapDB();

export async function loadLocalDocument(id = "local"): Promise<UserDocument | null> {
  const record = await db.documents.get(id);
  return record?.data ?? null;
}

export async function saveLocalDocument(doc: UserDocument, id = "local"): Promise<void> {
  await db.documents.put({ id, data: doc, updatedAt: new Date().toISOString() });
}
