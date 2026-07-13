import rateLimit from 'express-rate-limit';

export const formSubmitLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many requests — please try again later.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many login attempts — please try again later.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
