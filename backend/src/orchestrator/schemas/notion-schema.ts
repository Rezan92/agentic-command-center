import { z } from 'zod';

/**
 * Notion: Search for pages or database entries
 */
export const searchNotionSchema = z.object({
  query: z.string().describe('The search term to look for in Notion pages or titles.'),
});

/**
 * Notion: Read a specific page content
 */
export const readNotionPageSchema = z.object({
  pageId: z.string().describe('The unique ID of the Notion page to read.'),
});

/**
 * Notion: Create a new database item or page
 */
export const createNotionPageSchema = z.object({
  parentDatabaseId: z.string().describe('The ID of the database where the page should be created.'),
  properties: z.record(z.any()).describe('The properties of the page (e.g., Name, Date, Status).'),
  content: z.string().optional().describe('Optional markdown content for the page body.'),
});
