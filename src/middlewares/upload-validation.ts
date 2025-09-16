/**
 * Middleware de Validação de Upload para Strapi
 *
 * Valida tipos de arquivo, tamanho e conteúdo
 */

interface UploadValidationConfig {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  maxFiles: number;
}

export default (config: any, { strapi }: any) => {
  const uploadConfig: UploadValidationConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    maxFiles: 10,
    ...config,
  };

  return async (ctx: any, next: any) => {
    // Verificar se é uma requisição de upload
    if (!ctx.request.files || ctx.request.files.length === 0) {
      await next();
      return;
    }

    const files = Array.isArray(ctx.request.files)
      ? ctx.request.files
      : [ctx.request.files];

    // Validar número de arquivos
    if (files.length > uploadConfig.maxFiles) {
      strapi.log.warn(
        `🚨 Too many files uploaded: ${files.length} from IP: ${ctx.ip}`
      );

      ctx.status = 400;
      ctx.body = {
        error: `Máximo de ${uploadConfig.maxFiles} arquivos permitidos`,
        code: "TOO_MANY_FILES",
      };
      return;
    }

    // Validar cada arquivo
    for (const file of files) {
      const validation = await validateFile(file, uploadConfig, strapi);

      if (!validation.valid) {
        strapi.log.warn(
          `🚨 Invalid file upload: ${validation.error} from IP: ${ctx.ip}`
        );

        ctx.status = 400;
        ctx.body = {
          error: validation.error,
          code: validation.code,
          filename: file.name,
        };
        return;
      }
    }

    await next();
  };
};

async function validateFile(
  file: any,
  config: UploadValidationConfig,
  strapi: any
) {
  // Validar tamanho do arquivo
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${formatBytes(
        config.maxFileSize
      )}`,
      code: "FILE_TOO_LARGE",
    };
  }

  // Validar tipo MIME
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${file.type}`,
      code: "INVALID_FILE_TYPE",
    };
  }

  // Validar extensão
  const extension = getFileExtension(file.name);
  if (!config.allowedExtensions.includes(extension.toLowerCase())) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida: ${extension}`,
      code: "INVALID_FILE_EXTENSION",
    };
  }

  // Validar assinatura do arquivo (magic numbers)
  const isValidSignature = await validateFileSignature(file, config);
  if (!isValidSignature) {
    return {
      valid: false,
      error: "Assinatura do arquivo não corresponde ao tipo declarado",
      code: "INVALID_FILE_SIGNATURE",
    };
  }

  // Validar conteúdo do arquivo (verificar se é realmente uma imagem)
  const isValidContent = await validateImageContent(file);
  if (!isValidContent) {
    return {
      valid: false,
      error: "Arquivo não é uma imagem válida",
      code: "INVALID_IMAGE_CONTENT",
    };
  }

  return { valid: true };
}

function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf("."));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function validateFileSignature(
  file: any,
  config: UploadValidationConfig
): Promise<boolean> {
  try {
    const fs = require("fs");
    const path = require("path");

    // Ler primeiros bytes do arquivo
    const buffer = fs.readFileSync(file.path, { start: 0, end: 10 });

    // Verificar magic numbers
    const magicNumbers = {
      "image/jpeg": [0xff, 0xd8, 0xff],
      "image/png": [0x89, 0x50, 0x4e, 0x47],
      "image/gif": [0x47, 0x49, 0x46, 0x38],
      "image/webp": [0x52, 0x49, 0x46, 0x46],
      "image/svg+xml": [0x3c, 0x3f, 0x78, 0x6d, 0x6c], // <?xml
    };

    const expectedMagic = magicNumbers[file.type as keyof typeof magicNumbers];
    if (!expectedMagic) return true; // Tipo não tem magic number conhecido

    return expectedMagic.every((byte, index) => buffer[index] === byte);
  } catch (error) {
    strapi.log.error("Erro ao validar assinatura do arquivo:", error);
    return false;
  }
}

async function validateImageContent(file: any): Promise<boolean> {
  try {
    // Para imagens, verificar se o arquivo pode ser processado
    if (file.type.startsWith("image/")) {
      const sharp = require("sharp");

      try {
        await sharp(file.path).metadata();
        return true;
      } catch (error) {
        return false;
      }
    }

    return true; // Para outros tipos, assumir válido
  } catch (error) {
    strapi.log.error("Erro ao validar conteúdo da imagem:", error);
    return false;
  }
}
