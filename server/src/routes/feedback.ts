import { Router } from 'express';
import { addFeedback, listFeedback } from '../repositories/feedback.repo';

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

// GET /api/feedback （后台查看用，演示保留）
feedbackRouter.get('/', (_req, res) => {
  res.json(listFeedback());
});
