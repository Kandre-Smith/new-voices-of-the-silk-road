import { Router } from 'express';
import { addFeedback, listFeedback } from '../repositories/feedback.repo';
import { config } from '../config';

export const feedbackRouter = Router();

// POST /api/feedback  body: { text, images?: [dataURL], lang? }
feedbackRouter.post('/', (req, res) => {
  try {
    const entry = addFeedback(req.body || {});
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/feedback （后台查看，需密码：header `x-admin-password` 或 query `pw`）
feedbackRouter.get('/', (req, res) => {
  const pw = req.header('x-admin-password') || (typeof req.query.pw === 'string' ? req.query.pw : '');
  if (pw !== config.adminPassword) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.json(listFeedback());
});
