import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { Request, Response } from 'express';
import { errorHandler } from './middleware/error-handler.ts';
import { router as userRouter } from '@/routes/user.ts';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: '',
    credentials: true,
  }),
);

app.use(cookieParser());

const PORT = process.env.PORT || 3001;

app.get('/', (_: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use('/users', userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🫡 Server is running at: http://localhost:${PORT}`);
});
