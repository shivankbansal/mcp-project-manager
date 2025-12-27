export const chatgptTools = [
  {
    name: 'generate_code',
    description: 'Generate starter code for a described feature or module.',
    inputSchema: {
      type: 'object',
      properties: { spec: { type: 'string' } },
      required: ['spec']
    },
    handler: async ({ spec }: { spec: string }) => {
      // Placeholder; integrate OpenAI later
      return `Code scaffold generated for: ${spec}`;
    }
  }
];
