import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client?: S3Client;
  private bucketName!: string;
  private isFallbackMode = false;
  private localUploadDir = './uploads/attachments';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME', 'crm-erp-attachments');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log('✅ AWS S3 client initialized successfully.');
    } else {
      this.isFallbackMode = true;
      console.warn('⚠️ AWS S3 credentials not provided. Falling back to local disk storage uploads.');
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number; contentType: string; storageLocation: string; localPath: string | null; uploadFailed: boolean }> {
    const fileExt = path.extname(file.originalname);
    const uniqueFileName = `${entityType.toLowerCase()}/${entityId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

    if (!this.isFallbackMode && this.s3Client) {
      try {
        // Upload to AWS S3
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueFileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );

        // Generate a signed URL for retrieval (expires in 24 hours)
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueFileName,
        });
        const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 86400 });

        return {
          fileUrl: signedUrl,
          fileName: file.originalname,
          fileSize: file.size,
          contentType: file.mimetype,
          storageLocation: 'S3',
          localPath: null,
          uploadFailed: false,
        };
      } catch (err) {
        console.warn('⚠️ AWS S3 upload failed at runtime. Saving file locally as a fallback.', err);
        // Fallback to local storage on runtime S3 error
        const destinationPath = path.join(this.localUploadDir, path.basename(uniqueFileName));
        const parentDir = path.dirname(destinationPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.writeFileSync(destinationPath, file.buffer);
        const hostUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
        const fileUrl = `${hostUrl}/uploads/attachments/${path.basename(uniqueFileName)}`;

        return {
          fileUrl,
          fileName: file.originalname,
          fileSize: file.size,
          contentType: file.mimetype,
          storageLocation: 'LOCAL',
          localPath: destinationPath,
          uploadFailed: true,
        };
      }
    } else {
      // Local fallback storage
      const destinationPath = path.join(this.localUploadDir, path.basename(uniqueFileName));
      const parentDir = path.dirname(destinationPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(destinationPath, file.buffer);
      const hostUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
      const fileUrl = `${hostUrl}/uploads/attachments/${path.basename(uniqueFileName)}`;

      return {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        contentType: file.mimetype,
        storageLocation: 'LOCAL',
        localPath: destinationPath,
        uploadFailed: false,
      };
    }
  }
}
