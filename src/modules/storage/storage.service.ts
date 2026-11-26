import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private ready = false;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'shop';
    this.client = new Minio.Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: Number(this.config.get<string>('MINIO_PORT') ?? 9000),
      useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? 'minioadmin',
      secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? 'minioadmin',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`MinIO bucket "${this.bucket}" created`);
      }
      this.ready = true;
    } catch (error) {
      this.logger.error(
        `Failed to initialize MinIO: ${(error as Error).message}`,
      );
    }
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new ServiceUnavailableException('سرویس ذخیره‌سازی در دسترس نیست');
    }
  }

  async upload(
    key: string,
    body: Buffer,
    contentType = 'application/octet-stream',
  ): Promise<void> {
    this.ensureReady();
    await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
  }

  async get(key: string): Promise<Buffer> {
    this.ensureReady();
    try {
      const stream = await this.client.getObject(this.bucket, key);
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });
      return Buffer.concat(chunks);
    } catch (error) {
      throw new ServiceUnavailableException(
        `فایل یافت نشد: ${(error as Error).message}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    this.ensureReady();
    await this.client.removeObject(this.bucket, key);
  }

  async stat(
    key: string,
  ): Promise<{ size: number; contentType: string } | null> {
    this.ensureReady();
    try {
      const meta = await this.client.statObject(this.bucket, key);
      return {
        size: meta.size,
        contentType: meta.metaData?.['content-type'] ?? 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
}