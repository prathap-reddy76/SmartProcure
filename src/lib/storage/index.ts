import { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./object-storage";

export function getStorageProvider(): StorageProvider {
  if (process.env.NODE_ENV === "production" && process.env.STORAGE_PROVIDER === "s3") {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storage = getStorageProvider();
