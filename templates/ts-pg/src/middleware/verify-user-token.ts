import { verifyJWT } from '@/lib/auth.ts';
import { GlobalError, JWTPayload } from '@/types/types.ts';
import { Request, Response, NextFunction } from 'express';

export const verifyUserToken = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const token = req.cookies?.token;
	if (!token) {
		return next();
	}
	try {
		const payload = verifyJWT(token) as JWTPayload;

		if (payload.role === 'admin') {
			return res.redirect('/admin/dashboard');
		}

		return res.redirect('/');
	} catch {
		const error: GlobalError = new Error('Ungültiger Token');
		error.statusCode = 401;
		return next(error);
	}
};
