export const geminiTools = [
  {
    name: 'generate_requirements',
    description: 'Generate a detailed set of functional and non-functional requirements.',
    inputSchema: {
      type: 'object',
      properties: { brief: { type: 'string' } },
      required: ['brief']
    },
    handler: async ({ brief }: { brief: string }) => {
      // Placeholder; integrate Google Gemini later
      return `Requirements generated for: ${brief}`;
    }
  }
];
