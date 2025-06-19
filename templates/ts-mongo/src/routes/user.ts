import express from 'express';
import { createUser, verifyUser } from '@/controllers/user.ts';
import { verifyUserToken } from '@/middleware/verify-user-token.ts';
import { validateInputs } from '@/middleware/input-validation.ts';
import { userValidationRules } from '@/lib/auth-rules.ts';

export const router = express.Router();

router
	.route('/register')
	.post(validateInputs(userValidationRules.register), createUser);
router
	.route('/login')
	.post(verifyUserToken, validateInputs(userValidationRules.login), verifyUser);
