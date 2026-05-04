import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import orchestratorRoutes from './routes/orchestrator';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orchestrator', orchestratorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Agentic Command Center Backend' });
});

app.listen(port, () => {
  console.log(`Backend engine running on http://localhost:${port}`);
});
