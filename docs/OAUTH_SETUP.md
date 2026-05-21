# OAuth 2.0 Setup Guide

This document explains how to configure and add new tool integrations to the Agentic Command Center.

## **1. Notion Integration**
To enable Notion capabilities, you must create an integration in the Notion Developer Portal.

### **Configuration Steps:**
1.  Go to [Notion My Integrations](https://www.notion.so/my-integrations).
2.  Click **"New integration"**.
3.  Type: **Public** (required for OAuth).
4.  Redirect URIs: `http://localhost:3001/api/auth/notion/callback` (for local development).
5.  Copy the **Client ID** and **Client Secret**.
6.  Add them to your `backend/.env` file:
    ```env
    NOTION_CLIENT_ID=your_id
    NOTION_CLIENT_SECRET=your_secret
    ```

---

## **2. Google Integration**
To enable Google Calendar capabilities, you must create a project in the Google Cloud Console.

### **Configuration Steps:**
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable the **Google Calendar API**.
4.  Configure the **OAuth Consent Screen** (Internal/External).
5.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
6.  Application type: **Web application**.
7.  Authorized redirect URIs: `http://localhost:3001/api/auth/google/callback`.
8.  Copy the **Client ID** and **Client Secret**.
9.  Add them to your `backend/.env` file:
    ```env
    GOOGLE_CLIENT_ID=your_id
    GOOGLE_CLIENT_SECRET=your_secret
    ```

---

## **3. Backend Architecture**
The OAuth flow is handled by `backend/src/routes/auth.routes.ts`:
- `/api/auth/:provider`: Redirects the user to the provider's login page.
- `/api/auth/:provider/callback`: Receives the authorization code, exchanges it for a token, and saves it to the `OAuthConnection` table.

## **4. Adding a New Provider**
1.  Update the `Provider` enum in `prisma/schema.prisma`.
2.  Add the Zod schema for the new provider's tools in `src/orchestrator/schemas`.
3.  Implement the OAuth flow in `src/routes/auth.routes.ts`.
4.  Add a new case to the `dispatchToolCall` in `src/orchestrator/dispatcher.ts`.
