// src/config/files.config.ts
export type StorageMode = 'local' | 's3';

export interface LocalStorageConfig {
  uploadDir: string;
  publicBase: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface FileConfig {
  storage: StorageMode;
  local: LocalStorageConfig;
  // s3?: { bucket: string; baseUrl: string; maxFileSize?: number } // add later if needed
}

export const fileConfig: FileConfig = {
  storage: 'local',
  local: {
    uploadDir: './uploads/profile_pics',
    publicBase: '/uploads/profile_pics',
    maxFileSize: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif',
    ],
  },
};
