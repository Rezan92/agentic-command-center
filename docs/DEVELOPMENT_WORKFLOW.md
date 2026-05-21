# Development Workflow: Adding New Tools

This document outlines the standard process for adding a new tool (e.g., Slack, Jira) to the Agentic Command Center.

## **Overview**
We follow a "Contract-First" approach using the **MCP (Model Context Protocol)** philosophy.

---

## **Step 1: Define the Contract (Zod Schemas)**
1.  Create a new schema file in `backend/src/orchestrator/schemas/your-tool-schema.ts`.
2.  Define Zod objects for each action (e.g., `sendMessageSchema`).
3.  Register the tool in `backend/src/orchestrator/schemas/index.ts`.

## **Step 2: Implement OAuth (If required)**
1.  Add the new provider to the `Provider` enum in `backend/prisma/schema.prisma`.
2.  Run `npx prisma generate`.
3.  Add the OAuth routes in `backend/src/routes/auth.routes.ts`.
4.  Update the `SettingsDialog.tsx` in the frontend to show the new connection card.

## **Step 3: Create the Worker Agent**
1.  Create a new folder in `backend/src/agents/your-tool/`.
2.  Implement the logic that hits the actual API using the stored `accessToken`.
3.  Ensure it returns a standardized JSON response.

## **Step 4: Update the Dispatcher**
1.  Open `backend/src/orchestrator/dispatcher.ts`.
2.  Add a new case for your tool name.
3.  Route the call to your new Worker Agent.

## **Step 5: Verification**
1.  Test with a natural language prompt.
2.  Verify the "Action Badge" appears in the UI.
3.  Check the database to ensure the message and result are persisted.
