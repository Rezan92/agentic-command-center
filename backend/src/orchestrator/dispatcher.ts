import { toolRegistry } from './schemas';

/**
 * The Dispatcher is responsible for taking a tool call from the Orchestrator
 * and routing it to the correct Worker Agent.
 * 
 * For now, this implementation uses Mock responses (Story 3.3).
 */
export async function dispatchToolCall(toolName: string, parameters: any) {
  // Detailed Console Logging for Observability
  console.log('\n--- [TOOL DISPATCH] ---');
  console.log(`Target Tool: ${toolName}`);
  console.log('Parameters (JSON):', JSON.stringify(parameters, null, 2));
  console.log('-----------------------\n');

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  switch (toolName) {
    // Notion Mocks
    case 'search_notion':
      return {
        status: 'success',
        results: [
          { id: 'page_1', title: 'Project Roadmap', type: 'page' },
          { id: 'page_2', title: 'Weekly Meeting Notes', type: 'page' },
        ],
        message: `MOCK: Found 2 pages for query "${parameters.query}"`,
      };

    case 'read_notion_page':
      return {
        status: 'success',
        content: `MOCK: This is the content of Notion page ${parameters.pageId}. It contains notes about our agentic architecture.`,
      };

    case 'create_notion_page':
      return {
        status: 'success',
        pageId: 'new_page_999',
        message: 'MOCK: Successfully created Notion page.',
      };

    // Calendar Mocks
    case 'create_calendar_event':
      return {
        status: 'success',
        eventId: 'event_777',
        htmlLink: 'https://calendar.google.com/mock-event',
        message: `MOCK: Event "${parameters.title}" scheduled for ${parameters.start}.`,
      };

    case 'find_calendar_event':
      return {
        status: 'success',
        events: [
          { id: 'e1', summary: 'Standup Meeting', start: '2024-05-20T09:00:00Z' },
          { id: 'e2', summary: 'Architecture Review', start: '2024-05-20T14:00:00Z' },
        ],
        message: 'MOCK: Found 2 events matching your search.',
      };

    case 'find_calendar_events': // Support plural naming if AI drifts
    case 'list_calendar_events':
      return {
        status: 'success',
        events: [
          { id: 'e1', summary: 'Standup Meeting', start: '2024-05-20T09:00:00Z' },
          { id: 'e2', summary: 'Architecture Review', start: '2024-05-20T14:00:00Z' },
        ],
        message: 'MOCK: Found 2 events matching your search.',
      };

    case 'delete_calendar_event':
      return {
        status: 'success',
        message: `MOCK: Successfully deleted calendar event ${parameters.eventId}.`,
      };

    default:
      console.warn(`[Dispatcher] Unknown tool called: ${toolName}`);
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
