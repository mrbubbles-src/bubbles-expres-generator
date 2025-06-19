import { JWTPayload } from '@/types/types.ts';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const hashPassword = async (
	password: string,
	salt: number,
): Promise<string> => {
	return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};

export const createJWT = (
	payload: JWTPayload,
	expiresIn: SignOptions['expiresIn'] = '7d',
): string => {
	const secret: Secret = process.env.JWT_SECRET!;

	if (!secret) {
		throw new Error('JWT secret is not defined');
	}

	const options: SignOptions = {
		expiresIn: expiresIn as SignOptions['expiresIn'],
	};

	return jwt.sign(payload, secret, options);
};

export const verifyJWT = (token: string): JWTPayload => {
	const secret: Secret = process.env.JWT_SECRET!;

	if (!secret) {
		throw new Error('JWT secret is not defined');
	}

	return jwt.verify(token, secret) as JWTPayload;
};
