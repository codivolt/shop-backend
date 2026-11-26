import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import sharp from 'sharp';
import type { StorageService } from '../../modules/storage/storage.service';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46]), Buffer.from([0x57, 0x45, 0x42, 0x50])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
};

export function validateImageFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('فایل تصویر را انتخاب کنید');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('حجم فایل نباید بیشتر از 5 مگابایت باشد');
  }

  const extension = extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as any)) {
    throw new BadRequestException('پسوند فایل مجاز نیست. تنها jpg, jpeg, png, webp, gif مجاز هستند');
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as any)) {
    throw new BadRequestException('نوع فایل مجاز نیست');
  }

  const magicMatch = MAGIC_BYTES[file.mimetype]?.some((sig) =>
    file.buffer.subarray(0, sig.length).equals(sig),
  );
  if (!magicMatch) {
    throw new BadRequestException('محتوای فایل با نوع اعلام شده مطابقت ندارد');
  }
}

export async function processAndSaveImage(
  file: Express.Multer.File,
  prefix: string,
  storage: StorageService,
  options: { width?: number; height?: number; quality?: number } = {},
): Promise<string> {
  validateImageFile(file);

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;

  const buffer = await sharp(file.buffer)
    .rotate()
    .resize(options.width, options.height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: options.quality ?? 85 })
    .toBuffer();

  await storage.upload(`${prefix}/${filename}`, buffer, 'image/webp');

  return filename;
}

export async function deleteFile(
  prefix: string,
  filename: string,
  storage: StorageService,
): Promise<void> {
  try {
    await storage.delete(`${prefix}/${filename}`);
  } catch {
    // ignore deletion errors
  }
}