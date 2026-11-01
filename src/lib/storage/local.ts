import { StorageProvider } from "./provider";
import fs from "fs/promises";
import path from "path";

export class LocalStorageProvider implements StorageProvider {
  private uploadDir = path.join(process.cwd(), "public", "uploads");

  async upload(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    
    // Sanitize to prevent path traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(this.uploadDir, safeName);
    
    await fs.writeFile(filePath, buffer);
    return `/uploads/${safeName}`;
  }

  async delete(fileUrl: string): Promise<boolean> {
    const safeName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, safeName);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
