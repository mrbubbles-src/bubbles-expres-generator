import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { errorHandler } from './middleware/error-handler.js';
import { router as userRouter } from '@/routes/user.js';

const app = express();

app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/users', userRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🫡 Server is running at: http://localhost:${PORT}`);
});
