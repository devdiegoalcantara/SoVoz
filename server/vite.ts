import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer } from "vite";
import { type Server } from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createServer({
    server: { 
      middlewareMode: true,
      hmr: false
    },
    appType: "custom",
    root: path.resolve(__dirname, "../client"),
    configFile: path.resolve(__dirname, "../client/vite.config.ts"),
    logLevel: 'silent', // Silenciando todos os logs do Vite
    clearScreen: false,
    optimizeDeps: {
      disabled: true // Desabilitando otimização de dependências em desenvolvimento
    }
  });

  // Servir arquivos estáticos primeiro
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.use(vite.middlewares);
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../client/dist/index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  return vite;
}

export function serveStatic(app: Express) {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}
