// schema.prisma

generator client {  
  provider        \= "prisma-client-js"  
  previewFeatures \= \["postgresqlExtensions"\] // Required for pgvector  
}

datasource db {  
  provider   \= "postgresql"  
  url        \= env("DATABASE\_URL")  
  extensions \= \[vector\] // Enables pgvector extension  
}

// \-----------------------------------------------------------------------------  
// 1\. Core User & Multi-tenancy  
// \-----------------------------------------------------------------------------  
model User {  
  id        String   @id @default(dbgenerated("gen\_random\_uuid()")) @db.Uuid  
  email     String   @unique  
  name      String?  
  createdAt DateTime @default(now())  
  updatedAt DateTime @updatedAt

  // Relations  
  oauthConnections OAuthConnection\[\]  
  conversations    Conversation\[\]  
  memories         MemoryEmbedding\[\]  
}

// \-----------------------------------------------------------------------------  
// 2\. OAuth & Tool Integrations  
// \-----------------------------------------------------------------------------  
// Handles tokens for Google Calendar, Notion, etc.  
// IMPORTANT: access\_token and refresh\_token should ideally be encrypted at rest.  
model OAuthConnection {  
  id           String   @id @default(dbgenerated("gen\_random\_uuid()")) @db.Uuid  
  userId       String   @db.Uuid  
  provider     Provider // e.g., GOOGLE, NOTION  
    
  // Token Data  
  accessToken  String  
  refreshToken String?  // Some providers issue long-lived access tokens without refresh tokens  
  expiresAt    DateTime? // Nullable because some tokens (like Notion) don't expire  
    
  createdAt    DateTime @default(now())  
  updatedAt    DateTime @updatedAt

  // Relations  
  user         User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

  @@unique(\[userId, provider\]) // A user can only have one connection per provider  
}

enum Provider {  
  GOOGLE  
  NOTION  
}

// \-----------------------------------------------------------------------------  
// 3\. Chat History & Conversation State  
// \-----------------------------------------------------------------------------  
// Stores what the user actually sees in the UI  
model Conversation {  
  id        String   @id @default(dbgenerated("gen\_random\_uuid()")) @db.Uuid  
  userId    String   @db.Uuid  
  title     String?  // AI can auto-generate this based on context  
  createdAt DateTime @default(now())  
  updatedAt DateTime @updatedAt

  // Relations  
  user      User      @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
  messages  Message\[\]  
}

model Message {  
  id             String   @id @default(dbgenerated("gen\_random\_uuid()")) @db.Uuid  
  conversationId String   @db.Uuid  
  role           Role     // USER, ASSISTANT, or SYSTEM  
  content        String   @db.Text  
    
  // Optional: Store the UI State/Breadcrumbs for historical rendering  
  // e.g., storing the "Agentic Breadcrumbs" (Notion searched, Calendar updated)  
  uiState        Json?      
    
  createdAt      DateTime @default(now())

  // Relations  
  conversation   Conversation @relation(fields: \[conversationId\], references: \[id\], onDelete: Cascade)  
}

enum Role {  
  USER  
  ASSISTANT  
  SYSTEM  
}

// \-----------------------------------------------------------------------------  
// 4\. Vector Memory (pgvector)  
// \-----------------------------------------------------------------------------  
// As conversational turns slide out of the prompt window (10+ turns),   
// they are summarized and embedded here for semantic search.  
model MemoryEmbedding {  
  id        String   @id @default(dbgenerated("gen\_random\_uuid()")) @db.Uuid  
  userId    String   @db.Uuid  
    
  summary   String   @db.Text // The compacted summary of the task/conversation  
    
  // Vector column for pgvector. Using an unsupported type for Prisma integration.  
  // 768 is a standard dimension size for many embedding models, adjust to your Gemini embedding output.  
  embedding Unsupported("vector(768)")   
    
  createdAt DateTime @default(now())

  // Relations  
  user      User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
}  
