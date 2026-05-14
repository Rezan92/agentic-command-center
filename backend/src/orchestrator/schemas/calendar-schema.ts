import { z } from 'zod';

/**
 * Calendar: Create a new event
 */
export const createCalendarEventSchema = z.object({
  title: z.string().describe('The title of the meeting or event.'),
  start: z.string().describe('The ISO 8601 start time (e.g., 2024-05-20T15:00:00Z).'),
  end: z.string().describe('The ISO 8601 end time.'),
  description: z.string().optional().describe('A brief description of the event.'),
  location: z.string().optional().describe('Optional location for the meeting.'),
});

/**
 * Calendar: Find existing events
 */
export const findCalendarEventSchema = z.object({
  timeMin: z.string().optional().describe('The earliest time to look for events.'),
  timeMax: z.string().optional().describe('The latest time to look for events.'),
  query: z.string().optional().describe('Text search for event titles.'),
});

/**
 * Calendar: Delete an event
 */
export const deleteCalendarEventSchema = z.object({
  eventId: z.string().describe('The unique ID of the event to delete.'),
});
