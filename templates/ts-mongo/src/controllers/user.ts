import { NextFunction, Request, Response } from 'express';
import { comparePassword, createJWT, hashPassword } from '@/lib/auth.ts';
import { GlobalError, JWTPayload } from '@/types/types.ts';
import User from '@/models/user.ts';
import db from '@/db/db.ts';

export const createUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	await db.connect();
	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({
			$or: [{ username }, { email }],
		});

		if (existingUser) {
			const error: GlobalError = new Error('Username or email already exists');
			error.statusCode = 400;
			return next(error);
		}

		const hashedPassword = await hashPassword(password, 16);

		const newUser = new User({
			username,
			email,
			password: hashedPassword,
		});

		await newUser.save();

		const token = createJWT(
			{
				_id: newUser._id,
				username: newUser.username,
				role: newUser.role,
				verified: newUser.verified,
			} as JWTPayload,
			'30d',
		);

		res.cookie('token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		res.status(201).json({ message: 'User created successfully' });
		await db.close();
	} catch (error) {
		return next(error);
	}
};

export const verifyUser = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	await db.connect();
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });

		if (!user) {
			const error: GlobalError = new Error('Invalid email or password');
			error.statusCode = 401;
			return next(error);
		}

		const isPasswordValid = await comparePassword(password, user.password);

		if (!isPasswordValid) {
			const error: GlobalError = new Error('Invalid email or password');
			error.statusCode = 401;
			return next(error);
		}

		const { _id, username, role, verified } = user;

		const token = createJWT(
			{ _id: _id, username, role, verified } as JWTPayload,
			'30d',
		);

		res.cookie('token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		res.status(200).json({ message: 'Login successful' });
		await db.close();
	} catch (error) {
		return next(error);
	}
};
