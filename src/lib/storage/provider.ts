export interface StorageProvider {
  /**
   * Saves a file and returns the public URL or relative path.
   */
  upload(fileName: string, buffer: Buffer, mimeType: string): Promise<string>;
  
  /**
   * Deletes a file.
   */
  delete(fileUrl: string): Promise<boolean>;
}
