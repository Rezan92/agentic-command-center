import { searchNotionSchema, readNotionPageSchema, createNotionPageSchema } from './notion-schema';
import { createCalendarEventSchema, findCalendarEventSchema, deleteCalendarEventSchema } from './calendar-schema';

/**
 * Centralized tool registry for the Orchestrator.
 * This maps tool names to their respective Zod schemas and descriptions.
 */
export const toolRegistry = {
  // Notion Tools
  search_notion: {
    description: 'Search for pages or database entries in Notion.',
    parameters: searchNotionSchema,
  },
  read_notion_page: {
    description: 'Read the content of a specific Notion page.',
    parameters: readNotionPageSchema,
  },
  create_notion_page: {
    description: 'Create a new page or database item in Notion.',
    parameters: createNotionPageSchema,
  },

  // Calendar Tools
  create_calendar_event: {
    description: 'Create a new event in the Google Calendar.',
    parameters: createCalendarEventSchema,
  },
  find_calendar_event: {
    description: 'Search for existing events in the Google Calendar.',
    parameters: findCalendarEventSchema,
  },
  delete_calendar_event: {
    description: 'Delete an event from the Google Calendar using its ID.',
    parameters: deleteCalendarEventSchema,
  },
};

export type ToolName = keyof typeof toolRegistry;
