import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import orchestratorRoutes from './routes/orchestrator';
import chatRoutes from './routes/chat.routes';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { mvpAuth } from './middleware/mvpAuth';
import logger from './middleware/logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(mvpAuth); // Mock Auth for all routes in MVP

// Routes
app.use('/api/orchestrator', orchestratorRoutes);
app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Agentic Command Center Backend',
    user: req.user // Verify mock auth works
  });
});

// Error Handling (Must be after routes)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Backend engine running on http://localhost:${port}`);
});
