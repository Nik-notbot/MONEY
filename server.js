import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import router from './routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Debug: log the public directory path
const publicPath = path.join(process.cwd(), 'public');
console.log('Public directory path:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(router);
app.use(express.static(publicPath));

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', service: 'heymoney' });
});

// Explicit favicon route
app.get('/favicon.svg', (_req, res) => {
	res.sendFile(path.join(publicPath, 'favicon.svg'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`heymoney server listening on port ${PORT}`);
});

export default app;

