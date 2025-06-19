import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password, salt) => {
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createJWT = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not defined');
  }

  const options = {
    expiresIn,
  };

  return jwt.sign(payload, secret, options);
};

export const verifyJWT = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not defined');
  }

  return jwt.verify(token, secret);
};
