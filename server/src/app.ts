import express, { Express } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { attractionsRouter } from './routes/attractions';
import { feedbackRouter } from './routes/feedback';
import { ttsRouter } from './routes/tts';
import { config } from './config';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // 业务路由
  app.use('/api/attractions', attractionsRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/tts', ttsRouter);

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'silk-road-voice', time: Date.now() });
  });

  // 静态资源：音频 + 反馈图片
  app.use('/audio', express.static(path.join(config.publicDir, 'audio')));
  app.use('/uploads', express.static(config.uploadDir));

  // 生产模式：托管前端构建产物（若已构建），实现单端口前后端一体部署
  const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
  const hasClientDist = fs.existsSync(path.join(clientDist, 'index.html'));
  if (hasClientDist) {
    app.use(express.static(clientDist));
    // SPA 路由回退：非 API 的 GET 请求返回 index.html
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/audio') ||
        req.path.startsWith('/uploads')
      ) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // 统一错误处理
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[error]', err);
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return app;
}
