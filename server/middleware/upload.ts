import multer from 'multer';
import path from 'path';

// Configuração do multer para usar armazenamento em memória
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens e vídeos
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Apenas JPG, PNG e MP4 são aceitos.'));
  }
};

// Configuração do upload
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB
  }
});
