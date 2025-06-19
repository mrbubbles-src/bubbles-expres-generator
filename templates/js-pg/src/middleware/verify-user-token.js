import { verifyJWT } from '@/lib/auth.js';

export const verifyUserToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }
  try {
    const payload = verifyJWT(token);

    if (payload.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }

    return res.redirect('/');
  } catch {
    const error = new Error('Ungültiger Token');
    error.statusCode = 401;
    return next(error);
  }
};
