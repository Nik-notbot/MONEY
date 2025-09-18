import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(router);

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', service: 'heymoney' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`heymoney server listening on port ${PORT}`);
});

export default app;

