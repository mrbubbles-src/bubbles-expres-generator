import express from 'express';
import { createUser, verifyUser } from '../controllers/user.js';
import { verifyUserToken } from '../middleware/verify-user-token.js';
import { userValidationRules } from '../lib/auth-rules.js';
import { validateInputs } from '../middleware/input-validation.js';

export const router = express.Router();

router
  .route('/register')
  .post(validateInputs(userValidationRules.register), createUser);
router
  .route('/login')
  .post(verifyUserToken, validateInputs(userValidationRules.login), verifyUser);
