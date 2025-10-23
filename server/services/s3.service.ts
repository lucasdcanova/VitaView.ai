import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import logger from "../logger";

// Configuração do S3 Client
const resolveBucketName = () =>
  process.env.AWS_S3_BUCKET ||
  process.env.AWS_S3_BUCKET_NAME ||
  "vitaview-sensitive-data";

const ensureAwsConfig = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Credenciais AWS não configuradas. Defina AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.");
  }

  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

const s3Client = ensureAwsConfig();
const BUCKET_NAME = resolveBucketName();
const EXAM_FILE_PREFIX = "exam-documents";

// Tipos de arquivos sensíveis que devem ser armazenados no S3
const SENSITIVE_FILE_TYPES = [
  "medical-records",
  "prescriptions",
  "lab-results",
  "patient-photos",
  "insurance-documents",
  "personal-documents"
];

export class S3Service {
  /**
   * Gera uma chave única para o arquivo no S3
   */
  private static generateS3Key(
    userId: number,
    fileCategory: string,
    originalName: string
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    return `${fileCategory}/${userId}/${timestamp}-${randomString}-${sanitizedName}`;
  }

  /**
   * Faz upload de um arquivo sensível para o S3
   */
  static async uploadSensitiveFile(
    userId: number,
    fileType: string,
    file: Express.Multer.File
  ): Promise<{ key: string; url: string }> {
    try {
      if (!SENSITIVE_FILE_TYPES.includes(fileType)) {
        throw new Error(`Tipo de arquivo não permitido: ${fileType}`);
      }

      const key = this.generateS3Key(userId, fileType, file.originalname);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: "AES256", // Criptografia no servidor
        Metadata: {
          userId: userId.toString(),
          uploadDate: new Date().toISOString(),
          originalName: file.originalname,
          fileType: fileType,
        },
      });

      await s3Client.send(command);

      // Gerar URL assinada para acesso temporário (1 hora)
      const url = await this.getSignedUrl(key, 3600);

      logger.info(`Arquivo sensível enviado para S3: ${key}`);

      return { key, url };
    } catch (error) {
      logger.error("Erro ao fazer upload para S3:", error);
      throw new Error("Falha ao armazenar arquivo seguro");
    }
  }

  static async uploadExamDocument(options: {
    userId: number;
    profileId: number | null;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size?: number;
    metadata?: Record<string, string>;
  }): Promise<{ key: string; bucket: string; url: string; size: number; mimeType: string; originalName: string }> {
    const { userId, profileId, buffer, originalName, mimeType, size, metadata } = options;
    try {
      const key = this.generateS3Key(userId, EXAM_FILE_PREFIX, originalName);

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: "AES256",
        Metadata: {
          userId: userId.toString(),
          profileId: profileId?.toString() ?? "unknown",
          uploadDate: new Date().toISOString(),
          originalName,
          ...(metadata ?? {}),
        },
      });

      await s3Client.send(command);

      const url = await this.getSignedUrl(key, 3600);
      logger.info("[S3] Documento de exame armazenado", { key, bucket: BUCKET_NAME, userId, profileId });

      return {
        key,
        bucket: BUCKET_NAME,
        url,
        size: size ?? buffer.length,
        mimeType,
        originalName,
      };
    } catch (error) {
      logger.error("[S3] Erro ao enviar documento de exame", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        profileId,
      });
      throw new Error("Falha ao armazenar documento do exame");
    }
  }

  /**
   * Gera uma URL assinada para acesso temporário ao arquivo
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Busca um arquivo do S3
   */
  static async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const stream = response.Body as any;
      
      // Converter stream para Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error("Erro ao buscar arquivo do S3:", error);
      throw new Error("Arquivo não encontrado");
    }
  }

  /**
   * Deleta um arquivo do S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`Arquivo deletado do S3: ${key}`);
    } catch (error) {
      logger.error("Erro ao deletar arquivo do S3:", error);
      throw new Error("Falha ao deletar arquivo");
    }
  }

  /**
   * Verifica se um arquivo deve ser armazenado no S3
   */
  static isSensitiveFile(fileType: string): boolean {
    return SENSITIVE_FILE_TYPES.includes(fileType);
  }
}
