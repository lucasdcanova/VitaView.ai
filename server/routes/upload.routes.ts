import { Router } from "express";
import { Request, Response } from "express";
import { uploadSensitive, processS3Upload, uploadLocal } from "../middleware/upload.middleware";
import { S3Service } from "../services/s3.service";
import logger from "../logger";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Rota para upload de arquivos sensíveis (S3)
router.post(
  "/upload/sensitive",
  authMiddleware,
  uploadSensitive.single("file"),
  processS3Upload,
  async (req: Request, res: Response) => {
    try {
      const { s3Key, s3Url, fileType } = req.body;
      
      // Aqui você pode salvar a referência do arquivo no banco de dados
      // Por exemplo: salvar s3Key, userId, fileType, timestamp, etc.
      
      res.json({
        success: true,
        message: "Arquivo enviado com segurança",
        data: {
          key: s3Key,
          url: s3Url,
          fileType: fileType,
        }
      });
    } catch (error) {
      logger.error("Erro na rota de upload:", error);
      res.status(500).json({ error: "Erro ao processar upload" });
    }
  }
);

// Rota para obter URL assinada de um arquivo
router.get(
  "/files/sensitive/:key",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const expiresIn = parseInt(req.query.expires as string) || 3600;
      
      // Verificar se o usuário tem permissão para acessar o arquivo
      // Você deve implementar esta verificação baseada no seu modelo de dados
      
      const url = await S3Service.getSignedUrl(key, expiresIn);
      
      res.json({
        success: true,
        url: url,
        expiresIn: expiresIn,
      });
    } catch (error) {
      logger.error("Erro ao gerar URL assinada:", error);
      res.status(500).json({ error: "Erro ao acessar arquivo" });
    }
  }
);

// Rota para deletar arquivo sensível
router.delete(
  "/files/sensitive/:key",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      
      // Verificar se o usuário tem permissão para deletar o arquivo
      // Você deve implementar esta verificação baseada no seu modelo de dados
      
      await S3Service.deleteFile(key);
      
      res.json({
        success: true,
        message: "Arquivo deletado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao deletar arquivo:", error);
      res.status(500).json({ error: "Erro ao deletar arquivo" });
    }
  }
);

// Rota para upload de arquivos não sensíveis (local)
router.post(
  "/upload/general",
  authMiddleware,
  uploadLocal.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      res.json({
        success: true,
        message: "Arquivo enviado",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          path: req.file.path,
        }
      });
    } catch (error) {
      logger.error("Erro no upload local:", error);
      res.status(500).json({ error: "Erro ao processar upload" });
    }
  }
);

export default router;