import multer from "multer";
import { Request } from "express";
import { S3Service } from "../services/s3.service";
import logger from "../logger";

// Configuração de limites de upload
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Tipos de arquivo permitidos por categoria
const ALLOWED_MIME_TYPES = {
  "medical-records": ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  "prescriptions": ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  "lab-results": ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  "patient-photos": ["image/jpeg", "image/png", "image/jpg"],
  "insurance-documents": ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  "personal-documents": ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
};

const EXTENSION_MIME_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpeg: ["image/jpeg", "image/jpg"],
  jpg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
};

const DEFAULT_ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

// Armazenamento em memória para arquivos sensíveis (serão enviados ao S3)
const memoryStorage = multer.memoryStorage();

export function getAllowedMimeTypes(requestedType: string): string[] {
  const normalized = (requestedType || "medical-records").toLowerCase();
  return (
    ALLOWED_MIME_TYPES[normalized as keyof typeof ALLOWED_MIME_TYPES] ||
    EXTENSION_MIME_TYPES[normalized] ||
    DEFAULT_ALLOWED_TYPES
  );
}

// Filtro de arquivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const requestedType = (req.body.fileType || "medical-records").toLowerCase();
  const allowedTypes = getAllowedMimeTypes(requestedType);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn("[Upload] Tipo de arquivo bloqueado", {
      requestedType,
      mimetype: file.mimetype,
      originalName: file.originalname,
      allowedTypes,
      size: file.size
    });
    cb(new Error(`Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(", ")}`));
  }
};

// Middleware para uploads sensíveis (S3)
export const uploadSensitive = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

// Middleware específico para rotas de análise (mantém arquivo em memória)
export const uploadAnalysis = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

// Middleware para processar e enviar arquivo ao S3
export const processS3Upload = async (req: Request, res: any, next: any) => {
  try {
    if (!req.file) {
      logger.warn("[Upload] Upload sensível sem arquivo", {
        userId: req.user?.id,
        fileType: req.body?.fileType
      });
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    if (!req.user?.id) {
      logger.warn("[Upload] Upload sensível sem usuário autenticado", {
        hasFile: Boolean(req.file),
        fileType: req.body?.fileType
      });
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const fileType = req.body.fileType || "medical-records";
    
    // Verificar se é um arquivo sensível
    if (!S3Service.isSensitiveFile(fileType)) {
      logger.warn("[Upload] Upload marcado como sensível para tipo inválido", {
        userId: req.user?.id,
        fileType
      });
      return res.status(400).json({ error: "Este tipo de arquivo não requer armazenamento seguro" });
    }

    // Upload para S3
    const result = await S3Service.uploadSensitiveFile(
      req.user.id,
      fileType,
      req.file
    );

    // Adicionar informações do S3 ao request para uso posterior
    req.body.s3Key = result.key;
    req.body.s3Url = result.url;

    next();
  } catch (error) {
    logger.error("[Upload] Erro ao processar upload", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      fileType: req.body?.fileType,
      hasFile: Boolean(req.file)
    });
    res.status(500).json({ 
      error: "Erro ao processar upload",
      message: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
};

// Armazenamento local para arquivos não sensíveis
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Middleware para uploads não sensíveis (local)
export const uploadLocal = multer({
  storage: diskStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
