import { Router } from 'express';
import { normalizeLang } from '../data';
import {
  listAttractions,
  getAttraction,
  getTracks,
  getTips,
} from '../services/attraction.service';

export const attractionsRouter = Router();

// GET /api/attractions?lang=zh-CN
attractionsRouter.get('/', (req, res) => {
  const lang = normalizeLang(req.query.lang);
  res.json(listAttractions(lang));
});

// GET /api/attractions/:slug?lang=
attractionsRouter.get('/:slug', (req, res) => {
  const lang = normalizeLang(req.query.lang);
  const a = getAttraction(req.params.slug, lang);
  if (!a) return res.status(404).json({ error: 'Attraction not found' });
  res.json(a);
});

// GET /api/attractions/:slug/tracks?lang=
attractionsRouter.get('/:slug/tracks', (req, res) => {
  const lang = normalizeLang(req.query.lang);
  const tracks = getTracks(req.params.slug, lang);
  if (!tracks) return res.status(404).json({ error: 'Attraction not found' });
  res.json(tracks);
});

// GET /api/attractions/:slug/tips?lang=
attractionsRouter.get('/:slug/tips', (req, res) => {
  const lang = normalizeLang(req.query.lang);
  const tips = getTips(req.params.slug, lang);
  if (!tips) return res.status(404).json({ error: 'Attraction not found' });
  res.json(tips);
});
