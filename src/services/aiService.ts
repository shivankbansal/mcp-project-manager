import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients (lazy - only when keys are available)
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function getGemini(): GoogleGenerativeAI | null {
  if (!process.env.GOOGLE_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return geminiClient;
}

export type AIProvider = 'openai' | 'gemini' | 'auto';

const PHASE_PROMPTS: Record<string, (projectDescription: string, context?: string) => string> = {
  brd: (desc, ctx) => `You are a senior business analyst creating a comprehensive Business Requirements Document (BRD).

Project Description: ${desc}
${ctx ? `Additional Context: ${ctx}` : ''}

Generate a detailed, professional BRD that includes:

1. **Executive Summary** - Brief overview of the project and its business value
2. **Business Objectives** - Clear, measurable goals (use SMART criteria)
3. **Scope**
   - In-Scope items
   - Out-of-Scope items
   - Assumptions and constraints
4. **Stakeholders** - Key roles and their responsibilities
5. **Functional Requirements** - Detailed feature requirements with acceptance criteria
6. **Non-Functional Requirements**
   - Performance (response times, throughput)
   - Scalability
   - Security
   - Availability/Reliability
   - Compliance requirements
7. **User Stories** - At least 5 key user stories in format: "As a [user], I want [feature] so that [benefit]"
8. **Success Metrics** - KPIs to measure project success
9. **Risks & Mitigations** - Potential risks and mitigation strategies
10. **Timeline & Milestones** - High-level project phases

Format the output in clean Markdown with proper headers, bullet points, and tables where appropriate.`,

  design: (desc, ctx) => `You are a senior UI/UX designer creating a comprehensive Design Specification document.

Project Description: ${desc}
${ctx ? `Additional Context: ${ctx}` : ''}

Generate a detailed design specification that includes:

1. **Design Philosophy** - Overall approach and principles
2. **Design System**
   - Color palette (primary, secondary, accent, semantic colors with hex codes)
   - Typography scale (font families, sizes, weights, line heights)
   - Spacing system (8px grid or similar)
   - Border radius, shadows, elevation
3. **Component Library**
   - Buttons (variants, states, sizes)
   - Form elements (inputs, selects, checkboxes, radios)
   - Cards and containers
   - Navigation components
   - Feedback components (alerts, toasts, modals)
4. **Layout System**
   - Grid system
   - Responsive breakpoints
   - Container widths
5. **Key Screens/Pages** - Describe at least 5 main screens with:
   - Purpose
   - Key components
   - User interactions
   - Responsive considerations
6. **Wireframe Descriptions** - Text-based wireframe descriptions for main screens
7. **Interaction Patterns**
   - Hover states
   - Loading states
   - Error states
   - Animations/transitions
8. **Accessibility Requirements**
   - WCAG compliance level
   - Keyboard navigation
   - Screen reader support
   - Color contrast requirements
9. **Design Tokens** - List key design tokens in JSON-like format

Format in clean Markdown with visual hierarchy.`,

  journey: (desc, ctx) => `You are a UX researcher creating comprehensive User Journey Maps and Flow documentation.

Project Description: ${desc}
${ctx ? `Additional Context: ${ctx}` : ''}

Generate detailed user journey documentation that includes:

1. **User Personas** - Create 3-4 detailed personas including:
   - Name and demographics
   - Role/occupation
   - Goals and motivations
   - Pain points and frustrations
   - Technical proficiency
   - Quote that captures their mindset

2. **User Journey Maps** - For each persona, create a journey map with:
   - Stages (Awareness → Consideration → Decision → Onboarding → Usage → Advocacy)
   - Actions at each stage
   - Thoughts/emotions
   - Touchpoints
   - Pain points
   - Opportunities for improvement

3. **User Flows** - Document key flows in detail:
   - **Authentication Flow**: Sign up, login, password reset, 2FA
   - **Primary User Flow**: Main feature usage from start to completion
   - **Settings/Profile Flow**: Account management
   - **Error Recovery Flow**: How users recover from errors
   
   Format flows as: \`Page/State → Action → Page/State → Action...\`

4. **Edge Cases & Error Scenarios**
   - What happens when things go wrong?
   - Empty states
   - Timeout scenarios
   - Permission denied scenarios

5. **Jobs to Be Done (JTBD)** - List 5-10 jobs in format:
   "When [situation], I want to [motivation], so I can [outcome]"

6. **Friction Points & Solutions** - Identify potential UX friction and propose solutions

7. **Success Metrics per Journey** - How to measure if each journey is successful

Format in clean Markdown with tables and flow diagrams (text-based).`,

  testing: (desc, ctx) => `You are a QA lead creating a comprehensive Test Plan and Test Cases document.

Project Description: ${desc}
${ctx ? `Additional Context: ${ctx}` : ''}

Generate a detailed test documentation that includes:

1. **Test Strategy**
   - Testing objectives
   - Testing scope
   - Test levels (unit, integration, system, acceptance)
   - Test types (functional, performance, security, usability)
   - Entry/exit criteria
   - Test environment requirements

2. **Test Cases** - Create detailed test cases for each area:

   **Authentication Tests** (at least 10 cases)
   | ID | Test Case | Steps | Expected Result | Priority |
   
   **Core Feature Tests** (at least 15 cases)
   | ID | Test Case | Steps | Expected Result | Priority |
   
   **Edge Case Tests** (at least 10 cases)
   | ID | Test Case | Steps | Expected Result | Priority |

3. **API Test Scenarios**
   - Endpoint testing matrix
   - Request/response validation
   - Error handling tests
   - Rate limiting tests

4. **Performance Test Plan**
   - Load testing scenarios (concurrent users, requests/second)
   - Stress testing approach
   - Endurance testing plan
   - Performance benchmarks and SLAs

5. **Security Test Checklist**
   - [ ] OWASP Top 10 coverage
   - [ ] Authentication/authorization testing
   - [ ] Input validation
   - [ ] SQL injection
   - [ ] XSS prevention
   - [ ] CSRF protection
   - [ ] Data encryption
   - [ ] API security

6. **Accessibility Testing**
   - WCAG 2.1 AA compliance checklist
   - Screen reader testing plan
   - Keyboard navigation tests

7. **Cross-Browser/Device Matrix**
   | Browser/Device | Version | Priority |

8. **Bug Report Template**
   - Provide a template for reporting bugs

9. **Test Data Requirements**
   - What test data is needed
   - How to generate/obtain it
   - Data privacy considerations

Format in clean Markdown with tables and checklists.`
};

export async function generateContent(
  phase: string,
  projectDescription: string,
  context?: string,
  preferredProvider: AIProvider = 'auto'
): Promise<{ content: string; provider: string; model: string }> {
  
  const promptFn = PHASE_PROMPTS[phase];
  if (!promptFn) {
    throw new Error(`Unknown phase: ${phase}`);
  }
  
  const prompt = promptFn(projectDescription, context);
  
  // Determine which provider to use
  const openai = getOpenAI();
  const gemini = getGemini();
  
  let provider: 'openai' | 'gemini';
  
  if (preferredProvider === 'openai' && openai) {
    provider = 'openai';
  } else if (preferredProvider === 'gemini' && gemini) {
    provider = 'gemini';
  } else if (preferredProvider === 'auto') {
    // Prefer OpenAI if available, fallback to Gemini
    provider = openai ? 'openai' : gemini ? 'gemini' : 'openai';
  } else {
    provider = openai ? 'openai' : 'gemini';
  }
  
  if (provider === 'openai' && openai) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert software consultant who creates detailed, professional documentation.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });
    
    return {
      content: response.choices[0]?.message?.content || 'No content generated',
      provider: 'openai',
      model: 'gpt-4o-mini'
    };
  }
  
  if (provider === 'gemini' && gemini) {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return {
      content: response.text() || 'No content generated',
      provider: 'gemini',
      model: 'gemini-1.5-flash'
    };
  }
  
  throw new Error('No AI provider available. Please set OPENAI_API_KEY or GOOGLE_API_KEY environment variable.');
}

export function getAvailableProviders(): { openai: boolean; gemini: boolean } {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GOOGLE_API_KEY
  };
}
