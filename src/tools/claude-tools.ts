export const claudeTools = [
  {
    name: 'analyze_user_story',
    description: 'Analyze a user story and propose acceptance criteria.',
    inputSchema: {
      type: 'object',
      properties: { story: { type: 'string' } },
      required: ['story']
    },
    handler: async ({ story }: { story: string }) => {
      // Placeholder; integrate Anthropic Claude later
      return `Analysis completed for story: ${story}`;
    }
  }
];
