import { Router } from 'express';
import prisma from '../database/client';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const router = Router();

// Google OAuth Configuration
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/api/auth/google/callback'
);

// 1. GET /api/auth/status - Get connection status for the current user
router.get('/status', async (req, res, next) => {
  try {
    const userId = res.locals.userId;
    const connections = await prisma.oauthConnection.findMany({
      where: { userId },
      select: { provider: true }
    });

    const providers = ['GOOGLE', 'NOTION'];
    const status = providers.map(p => ({
      provider: p,
      isConnected: connections.some(c => c.provider === p)
    }));

    res.json(status);
  } catch (error) {
    next(error);
  }
});

// 2. NOTION OAUTH
router.get('/notion', (req, res) => {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = encodeURIComponent('http://localhost:3001/api/auth/notion/callback');
  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;
  
  res.redirect(notionAuthUrl);
});

router.get('/notion/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const userId = res.locals.userId;

    if (!code) return res.status(400).json({ error: 'No code provided' });

    // Exchange code for token
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post('https://api.notion.com/v1/oauth/token', 
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'http://localhost:3001/api/auth/notion/callback',
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const { access_token } = response.data;

    // Save to DB
    await prisma.oauthConnection.upsert({
      where: { userId_provider: { userId, provider: 'NOTION' } },
      update: { accessToken: access_token },
      create: {
        userId,
        provider: 'NOTION',
        accessToken: access_token,
      }
    });

    // Redirect back to frontend
    res.redirect('http://localhost:3000?auth=success');
  } catch (error) {
    console.error('Notion Auth Error:', error);
    res.redirect('http://localhost:3000?auth=error');
  }
});

// 3. GOOGLE OAUTH
router.get('/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent'
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const userId = res.locals.userId;

    if (!code) return res.status(400).json({ error: 'No code provided' });

    const { tokens } = await googleClient.getToken(code as string);
    
    if (!tokens.access_token) throw new Error('Failed to get access token');

    // Save to DB
    await prisma.oauthConnection.upsert({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      create: {
        userId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      }
    });

    res.redirect('http://localhost:3000?auth=success');
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.redirect('http://localhost:3000?auth=error');
  }
});

export default router;
