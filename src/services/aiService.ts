import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { Ollama } from 'ollama';

// Initialize clients (lazy - only when keys are available)
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;
let groqClient: Groq | null = null;
let ollamaClient: Ollama | null = null;

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

function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function getOllama(): Ollama | null {
  // Ollama runs locally or on a specified host
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  if (!process.env.OLLAMA_ENABLED && !process.env.OLLAMA_HOST) return null;
  if (!ollamaClient) {
    ollamaClient = new Ollama({ host: ollamaHost });
  }
  return ollamaClient;
}

export type AIProvider = 'openai' | 'gemini' | 'groq' | 'ollama' | 'auto';

const PHASE_PROMPTS: Record<string, (projectDescription: string, context?: string) => string> = {
  brd: (desc, ctx) => `You are a Principal Business Analyst at a Fortune 500 company with 15+ years of experience. You are creating a COMPREHENSIVE, PRODUCTION-READY Business Requirements Document (BRD) that will be used by executives, developers, designers, and QA teams.

PROJECT: ${desc}
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ''}

CRITICAL INSTRUCTIONS:
- This document must be DETAILED and ACTIONABLE - not just headings
- Write FULL paragraphs with specific details, not bullet points only
- Include REAL numbers, metrics, and concrete examples
- Make it feel like a real enterprise document worth $50,000+
- Minimum 3000 words

Generate the complete BRD with these sections (EXPAND EACH FULLY):

---

# Business Requirements Document (BRD)
## [Project Name]
**Version:** 1.0 | **Date:** ${new Date().toLocaleDateString()} | **Status:** Draft

---

## 1. Executive Summary
Write a compelling 3-4 paragraph executive summary that:
- Explains the business problem being solved (be specific)
- Describes the proposed solution and its uniqueness
- Highlights expected ROI and business impact
- Summarizes the investment required and timeline

## 2. Business Context & Problem Statement
### 2.1 Current State Analysis
Describe in detail:
- The existing process/system and its limitations
- Pain points experienced by users (with examples)
- Business costs of the current state (time, money, opportunity cost)
- Competitive pressure driving this initiative

### 2.2 Problem Statement
Write a clear, specific problem statement that any stakeholder can understand.

### 2.3 Market Analysis
- Target market size and characteristics
- Competitor analysis (list 3-5 competitors with their strengths/weaknesses)
- Market trends supporting this solution

## 3. Business Objectives & Success Criteria
### 3.1 Primary Objectives (SMART Goals)
Create 5-7 SMART objectives with specific metrics:
| Objective | Specific Target | Timeline | How Measured |
|-----------|-----------------|----------|--------------|

### 3.2 Key Performance Indicators (KPIs)
Define 8-10 measurable KPIs:
| KPI | Current Baseline | Target | Measurement Method |
|-----|-----------------|--------|-------------------|

### 3.3 Success Criteria
Define what "done" looks like for this project.

## 4. Scope Definition
### 4.1 In-Scope Features (Must Have - P0)
List and describe 8-12 core features in detail:
For each feature include:
- Feature name and description (2-3 sentences)
- Business value it provides
- Acceptance criteria (3-5 specific criteria)
- Dependencies

### 4.2 In-Scope Features (Should Have - P1)
List 5-8 important but not critical features with same detail.

### 4.3 In-Scope Features (Nice to Have - P2)
List 3-5 features for future consideration.

### 4.4 Out of Scope
Explicitly list what is NOT included (important for scope management).

### 4.5 Assumptions
List 10+ assumptions being made.

### 4.6 Constraints
List technical, business, regulatory, and resource constraints.

## 5. Stakeholder Analysis
### 5.1 Stakeholder Matrix
| Stakeholder | Role | Interest Level | Influence | Communication Needs |
|-------------|------|----------------|-----------|-------------------|

### 5.2 RACI Matrix
| Decision/Activity | Responsible | Accountable | Consulted | Informed |
|-------------------|-------------|-------------|-----------|----------|

## 6. Functional Requirements
### 6.1 User Management
**FR-001: User Registration**
- Description: [Detailed description]
- Business Rule: [Specific rules]
- Acceptance Criteria:
  - AC1: [Specific testable criteria]
  - AC2: [Specific testable criteria]
  - AC3: [Specific testable criteria]
- Priority: P0
- Dependencies: None

[Continue with 15-20 detailed functional requirements organized by module]

### 6.2 Core Features
[Detail each core feature with same structure]

### 6.3 Reporting & Analytics
[Detail reporting requirements]

### 6.4 Integration Requirements
[Detail any integrations needed]

## 7. Non-Functional Requirements
### 7.1 Performance Requirements
| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Page Load Time | < 2 seconds | 95th percentile |
| API Response Time | < 200ms | Average |
| Concurrent Users | 10,000+ | Peak load |
| Throughput | 1000 req/sec | Sustained |

### 7.2 Scalability Requirements
[Horizontal/vertical scaling requirements]

### 7.3 Security Requirements
- Authentication requirements (OAuth, MFA, etc.)
- Authorization model (RBAC, ABAC)
- Data encryption (at rest, in transit)
- Compliance requirements (GDPR, SOC2, etc.)
- Audit logging requirements

### 7.4 Availability & Reliability
- Uptime SLA target (e.g., 99.9%)
- RTO/RPO requirements
- Disaster recovery requirements
- Backup requirements

### 7.5 Maintainability
- Code quality standards
- Documentation requirements
- Monitoring and alerting requirements

## 8. User Stories & Use Cases
### 8.1 Epic: [Epic Name]
**User Story US-001:** As a [user type], I want to [action] so that [benefit].
- Acceptance Criteria:
  - Given [context], When [action], Then [outcome]
  - Given [context], When [action], Then [outcome]
- Story Points: [estimate]
- Priority: [P0/P1/P2]

[Include 15-25 detailed user stories organized by epic]

### 8.2 Use Case Diagrams
[Text-based use case descriptions]

## 9. Data Requirements
### 9.1 Data Model Overview
Describe main entities and relationships.

### 9.2 Data Dictionary
| Field | Type | Description | Constraints | Example |
|-------|------|-------------|-------------|---------|

### 9.3 Data Migration Requirements
[If applicable]

### 9.4 Data Retention Policy
[Retention requirements]

## 10. Risk Assessment
### 10.1 Risk Register
| Risk ID | Description | Probability | Impact | Risk Score | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|------------|--------------------| ------|

Include 10-15 risks covering:
- Technical risks
- Business risks
- Resource risks
- External risks
- Security risks

### 10.2 Risk Response Plan
[Detailed mitigation strategies]

## 11. Project Timeline & Milestones
### 11.1 High-Level Timeline
| Phase | Duration | Key Deliverables | Dependencies |
|-------|----------|-----------------|--------------|
| Discovery | 2 weeks | Requirements sign-off | Stakeholder availability |
| Design | 4 weeks | Design system, wireframes | Requirements complete |
| Development Phase 1 | 6 weeks | MVP features | Design complete |
| Testing | 3 weeks | Test results, bug fixes | Development complete |
| Deployment | 1 week | Production release | Testing complete |

### 11.2 Milestone Schedule
[Detailed milestones with dates]

## 12. Budget & Resource Requirements
### 12.1 Resource Plan
| Role | FTE | Duration | Estimated Cost |
|------|-----|----------|----------------|

### 12.2 Technology & Infrastructure Costs
[Estimated costs]

### 12.3 Total Cost of Ownership (TCO)
[3-year TCO analysis]

## 13. Appendices
### Appendix A: Glossary
### Appendix B: Reference Documents
### Appendix C: Sign-off Sheet

---

Format everything in clean, professional Markdown. Be EXTREMELY detailed and specific. This should read like a real enterprise BRD.`,

  design: (desc, ctx) => `You are a Principal UI/UX Designer and Design System Architect at a leading tech company. You are creating a COMPREHENSIVE, PRODUCTION-READY Design Specification that developers can actually implement.

PROJECT: ${desc}
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ''}

CRITICAL INSTRUCTIONS:
- This must be DETAILED and IMPLEMENTABLE - not vague descriptions
- Include ACTUAL values (hex codes, pixel values, font sizes)
- Describe EVERY state of components (default, hover, active, disabled, error, loading)
- Write like you're handing this to a developer who needs to build it exactly
- Minimum 3000 words

Generate the complete Design Specification:

---

# Design System & UI/UX Specification
## [Project Name]
**Version:** 1.0 | **Date:** ${new Date().toLocaleDateString()}

---

## 1. Design Philosophy & Principles

### 1.1 Design Vision
[Write 2-3 paragraphs about the overall design vision, the feeling you want to evoke, and what makes this design unique]

### 1.2 Design Principles
1. **[Principle Name]:** [Detailed explanation with examples of how to apply it]
2. **[Principle Name]:** [Detailed explanation]
[List 5-7 principles]

### 1.3 Brand Personality
- Voice: [Describe tone - friendly, professional, playful, etc.]
- Visual Feel: [Modern, minimal, bold, etc.]
- Key Differentiators: [What makes this visually stand out]

---

## 2. Design Tokens & Foundation

### 2.1 Color System

#### Primary Palette
| Token Name | Hex | RGB | Usage |
|------------|-----|-----|-------|
| --color-primary-50 | #EEF2FF | rgb(238,242,255) | Backgrounds, hover states |
| --color-primary-100 | #E0E7FF | rgb(224,231,255) | Light backgrounds |
| --color-primary-200 | #C7D2FE | rgb(199,210,254) | Borders, dividers |
| --color-primary-300 | #A5B4FC | rgb(165,180,252) | Icons, secondary text |
| --color-primary-400 | #818CF8 | rgb(129,140,248) | Secondary actions |
| --color-primary-500 | #6366F1 | rgb(99,102,241) | Primary brand color |
| --color-primary-600 | #4F46E5 | rgb(79,70,229) | Primary buttons, links |
| --color-primary-700 | #4338CA | rgb(67,56,202) | Hover states |
| --color-primary-800 | #3730A3 | rgb(55,48,163) | Active states |
| --color-primary-900 | #312E81 | rgb(49,46,129) | Dark accents |

#### Neutral Palette
[Same detailed table for grays/neutrals]

#### Semantic Colors
| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| Success | #10B981 | #34D399 | Confirmations, positive feedback |
| Warning | #F59E0B | #FBBF24 | Cautions, alerts |
| Error | #EF4444 | #F87171 | Errors, destructive actions |
| Info | #3B82F6 | #60A5FA | Information, tips |

#### Gradients
| Name | Value | Usage |
|------|-------|-------|
| Primary Gradient | linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%) | Hero sections, CTAs |
| Surface Gradient | linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%) | Cards, panels |

### 2.2 Typography

#### Font Stack
- **Primary Font:** Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Monospace:** JetBrains Mono, Consolas, monospace
- **Display (Optional):** [For headlines if different]

#### Type Scale
| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| --text-xs | 12px | 16px | 400 | 0.01em | Labels, captions |
| --text-sm | 14px | 20px | 400 | 0 | Secondary text, metadata |
| --text-base | 16px | 24px | 400 | 0 | Body text |
| --text-lg | 18px | 28px | 500 | -0.01em | Large body, subtitles |
| --text-xl | 20px | 28px | 600 | -0.01em | Card titles |
| --text-2xl | 24px | 32px | 600 | -0.02em | Section headers |
| --text-3xl | 30px | 36px | 700 | -0.02em | Page titles |
| --text-4xl | 36px | 40px | 700 | -0.02em | Hero text |
| --text-5xl | 48px | 1 | 800 | -0.03em | Display text |

### 2.3 Spacing System
Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| --space-0 | 0px | Reset |
| --space-1 | 4px | Tight spacing, icon gaps |
| --space-2 | 8px | Default element gaps |
| --space-3 | 12px | Form field gaps |
| --space-4 | 16px | Component padding |
| --space-5 | 20px | Card padding |
| --space-6 | 24px | Section spacing |
| --space-8 | 32px | Large section spacing |
| --space-10 | 40px | Major section breaks |
| --space-12 | 48px | Page section spacing |
| --space-16 | 64px | Hero spacing |

### 2.4 Effects & Elevation

#### Shadows
| Level | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| --shadow-md | 0 4px 6px -1px rgba(0,0,0,0.1) | Cards, dropdowns |
| --shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.1) | Modals, popovers |
| --shadow-xl | 0 20px 25px -5px rgba(0,0,0,0.1) | Hero elements |

#### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 4px | Small elements, chips |
| --radius-md | 8px | Buttons, inputs |
| --radius-lg | 12px | Cards |
| --radius-xl | 16px | Large cards, modals |
| --radius-full | 9999px | Pills, avatars |

---

## 3. Component Library

### 3.1 Buttons

#### Primary Button
\`\`\`
Default State:
- Background: var(--color-primary-600)
- Text: white
- Padding: 12px 24px
- Border Radius: 8px
- Font: 14px/20px, weight 600
- Shadow: var(--shadow-sm)

Hover State:
- Background: var(--color-primary-700)
- Shadow: var(--shadow-md)
- Transform: translateY(-1px)
- Transition: all 150ms ease

Active/Pressed State:
- Background: var(--color-primary-800)
- Shadow: none
- Transform: translateY(0)

Disabled State:
- Background: var(--color-gray-300)
- Text: var(--color-gray-500)
- Cursor: not-allowed
- Opacity: 1 (use colors, not opacity)

Loading State:
- Show spinner (16px) replacing text
- Background slightly dimmed
- Cursor: wait
\`\`\`

[Continue with Secondary Button, Ghost Button, Danger Button - same detail level]

#### Button Sizes
| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| xs | 28px | 8px 12px | 12px | 14px |
| sm | 32px | 8px 16px | 14px | 16px |
| md | 40px | 12px 24px | 14px | 18px |
| lg | 48px | 14px 32px | 16px | 20px |

### 3.2 Form Elements

#### Text Input
\`\`\`
Default State:
- Height: 44px
- Padding: 12px 16px
- Background: white
- Border: 1px solid var(--color-gray-300)
- Border Radius: 8px
- Font: 16px (prevents iOS zoom)

Focus State:
- Border: 2px solid var(--color-primary-500)
- Box Shadow: 0 0 0 3px rgba(99,102,241,0.1)
- Outline: none

Error State:
- Border: 2px solid var(--color-error)
- Box Shadow: 0 0 0 3px rgba(239,68,68,0.1)
- Error message below: 12px, color-error

Disabled State:
- Background: var(--color-gray-100)
- Border: 1px solid var(--color-gray-200)
- Text: var(--color-gray-400)
\`\`\`

[Continue with Textarea, Select, Checkbox, Radio, Toggle, File Upload]

### 3.3 Cards
[Detailed specifications for card variants]

### 3.4 Navigation
[Header, sidebar, tabs, breadcrumbs with full specs]

### 3.5 Feedback Components
[Alerts, toasts, modals, tooltips with full specs]

### 3.6 Data Display
[Tables, lists, badges, avatars with full specs]

---

## 4. Layout System

### 4.1 Grid System
- Columns: 12
- Gutter: 24px (desktop), 16px (mobile)
- Max container width: 1280px
- Margin: auto-centered

### 4.2 Responsive Breakpoints
| Name | Min Width | Typical Devices |
|------|-----------|-----------------|
| xs | 0px | Small phones |
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### 4.3 Common Layouts
[Describe and illustrate common page layouts]

---

## 5. Page Specifications

### 5.1 Landing/Home Page
**Purpose:** [What this page does]
**URL:** /

**Layout Description:**
[Detailed description of every section, from top to bottom]

**Components Used:**
- Hero section: [Specs]
- Feature grid: [Specs]
- CTA section: [Specs]
- Footer: [Specs]

**Responsive Behavior:**
- Desktop: [How it looks]
- Tablet: [Changes]
- Mobile: [Changes]

[Continue for 5-8 main pages with same level of detail]

---

## 6. Interaction & Animation

### 6.1 Micro-interactions
| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Button hover | Scale + shadow | 150ms | ease-out |
| Card hover | Lift + shadow | 200ms | ease |
| Menu open | Fade + slide | 200ms | ease-out |
| Toast enter | Slide from right | 300ms | spring |
| Modal open | Fade + scale | 200ms | ease-out |

### 6.2 Loading States
[Describe all loading patterns - skeletons, spinners, etc.]

### 6.3 Empty States
[Describe empty state patterns with illustration guidelines]

### 6.4 Error States
[Describe error handling UI patterns]

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance
[Specific requirements and how design meets them]

### 7.2 Color Contrast
All text must meet:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### 7.3 Focus Management
[Focus indicator specs, focus order requirements]

### 7.4 Screen Reader Support
[ARIA labels, semantic structure]

---

## 8. Dark Mode Specifications
[Complete dark mode color mappings and considerations]

---

## 9. Asset Requirements
### 9.1 Icons
- Icon library: [Recommended library]
- Size variants: 16px, 20px, 24px, 32px
- Stroke width: 1.5px

### 9.2 Illustrations
[Style guidelines for illustrations]

### 9.3 Photography
[Guidelines for photo usage]

---

Format in clean, detailed Markdown that developers can implement directly.`,

  journey: (desc, ctx) => `You are a Principal UX Researcher and Product Strategist at a top product company. You are creating COMPREHENSIVE User Journey documentation that product managers, designers, and developers will use to build the product.

PROJECT: ${desc}
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ''}

CRITICAL INSTRUCTIONS:
- Create DETAILED, REALISTIC personas with depth
- Map COMPLETE journeys with every step, emotion, and touchpoint
- Include SPECIFIC flows with actual page names and actions
- Cover ALL edge cases and error scenarios
- This should be usable for actual product development
- Minimum 3500 words

Generate the complete User Journey Documentation:

---

# User Journey & Experience Documentation
## [Project Name]
**Version:** 1.0 | **Date:** ${new Date().toLocaleDateString()}

---

## 1. User Research Summary

### 1.1 Research Methodology
[Describe the research methods that would have informed these personas]

### 1.2 Key Insights
[List 8-10 key insights from user research]

---

## 2. User Personas

### Persona 1: [Name] - The [Archetype]

**Demographics:**
- Age: [Specific age]
- Location: [City/Region]
- Occupation: [Job title at company type]
- Income: [Range]
- Education: [Level]
- Family: [Status]

**Background Story:**
[Write 2-3 paragraphs telling this person's story - their career journey, current situation, what led them to need this product]

**Goals & Motivations:**
1. [Primary goal with context]
2. [Secondary goal with context]
3. [Tertiary goal with context]

**Pain Points & Frustrations:**
1. [Specific pain point with example scenario]
2. [Specific pain point with example scenario]
3. [Specific pain point with example scenario]
4. [Specific pain point with example scenario]

**Behaviors & Habits:**
- Daily routine: [Describe]
- Technology usage: [Devices, apps, comfort level]
- Decision-making style: [How they evaluate options]
- Information sources: [Where they learn about new products]

**Quote:**
> "[A quote that captures their mindset and needs]"

**Scenario:**
[Write a day-in-the-life scenario showing how they would use this product]

**Success Metrics for This Persona:**
- [How do we know we've succeeded for this user?]

---

[Create 3-4 more detailed personas with same structure - make them diverse]

---

## 3. User Journey Maps

### 3.1 Journey Map: New User Onboarding

**Persona:** [Which persona]
**Scenario:** [Specific scenario being mapped]
**Duration:** [How long this journey takes]

#### Stage 1: Awareness
| Element | Details |
|---------|---------|
| **Actions** | [What user does: e.g., "Sees ad on LinkedIn, clicks through to landing page"] |
| **Thinking** | [Internal thoughts: "This looks interesting, but can it really do what it claims?"] |
| **Feeling** | [Emotional state: Curious but skeptical] |
| **Touchpoints** | [All touchpoints: Social ad, landing page, reviews site] |
| **Pain Points** | [What could go wrong: "Too much jargon, unclear value proposition"] |
| **Opportunities** | [How to improve: "Clear benefit statement, social proof"] |

#### Stage 2: Consideration
[Same detailed structure]

#### Stage 3: Sign-Up
[Same detailed structure]

#### Stage 4: First-Time Use
[Same detailed structure]

#### Stage 5: Aha Moment
[Same detailed structure - when they realize the value]

#### Stage 6: Regular Usage
[Same detailed structure]

#### Stage 7: Advocacy
[Same detailed structure - when they recommend to others]

**Journey Metrics:**
| Stage | Target Metric | Measurement |
|-------|---------------|-------------|
| Awareness | Click-through rate | > 2% |
| Sign-up | Conversion rate | > 15% |
| First use | Time to first action | < 5 minutes |
| Aha moment | Users reaching it | > 60% in first session |

---

[Create 2-3 more detailed journey maps for different scenarios]

---

## 4. Detailed User Flows

### 4.1 Authentication Flows

#### 4.1.1 New User Registration
\`\`\`
[Landing Page]
    │
    ├──► Click "Sign Up"
    │
    ▼
[Registration Modal/Page]
    │
    ├──► Option A: Email Sign Up
    │    │
    │    ├──► Enter email
    │    ├──► Enter password (show requirements)
    │    ├──► Enter name
    │    ├──► Accept terms (required checkbox)
    │    ├──► Click "Create Account"
    │    │
    │    ▼
    │   [Email Verification Screen]
    │    │
    │    ├──► Check email
    │    ├──► Click verification link
    │    │
    │    ▼
    │   [Email Verified - Success Screen]
    │    │
    │    ├──► Click "Continue to App"
    │    │
    │    ▼
    │   [Onboarding Flow - Step 1]
    │
    ├──► Option B: Google OAuth
    │    │
    │    ├──► Click "Continue with Google"
    │    ├──► Google OAuth popup
    │    ├──► Select/confirm Google account
    │    ├──► Grant permissions
    │    │
    │    ▼
    │   [Onboarding Flow - Step 1]
    │
    └──► Option C: Already have account?
         │
         ├──► Click "Log In"
         │
         ▼
        [Login Flow]
\`\`\`

**Error Handling:**
- Email already exists → Show message, offer login link
- Weak password → Show requirements, highlight unmet
- OAuth failure → Show retry option, fallback to email
- Network error → Show retry with offline indicator
- Verification email not received → Resend option, check spam tip

#### 4.1.2 Returning User Login
[Same detailed flow structure]

#### 4.1.3 Password Reset Flow
[Same detailed flow structure]

#### 4.1.4 Multi-Factor Authentication (if applicable)
[Same detailed flow structure]

---

### 4.2 Core Feature Flows

#### 4.2.1 [Primary Feature Flow]
[Extremely detailed flow with every screen, action, and decision point]

#### 4.2.2 [Secondary Feature Flow]
[Same detail level]

[Continue for all major features]

---

### 4.3 Settings & Account Management

#### 4.3.1 Profile Update Flow
[Detailed flow]

#### 4.3.2 Subscription/Billing Flow
[Detailed flow]

#### 4.3.3 Account Deletion Flow
[Detailed flow with confirmation and data handling]

---

## 5. Edge Cases & Error Scenarios

### 5.1 Empty States
| State | When It Occurs | What User Sees | Action Available |
|-------|---------------|----------------|------------------|
| No projects | New user, no projects created | Illustration + "Create your first project" message | Primary CTA button |
| No search results | Search returns nothing | "No results for [query]" + suggestions | Clear search, try suggestions |
| No notifications | User has no notifications | "You're all caught up" message | None needed |

### 5.2 Error Scenarios
| Error | Trigger | User Message | Recovery Path |
|-------|---------|--------------|---------------|
| Network offline | Lost connectivity | "You're offline. Changes will sync when connected." | Auto-retry when online |
| Session expired | Token expired | "Your session expired. Please log in again." | Redirect to login, preserve context |
| Permission denied | Access restricted resource | "You don't have access to this. Contact your admin." | Link to request access |
| Server error | 500 error | "Something went wrong. We're looking into it." | Retry button, contact support |
| Rate limited | Too many requests | "Slow down! Try again in X seconds." | Timer countdown |

### 5.3 Edge Case Scenarios
| Scenario | Expected Behavior | Notes |
|----------|------------------|-------|
| User submits form twice quickly | Debounce, only process once | Show loading state immediately |
| File upload too large | Reject with size limit message | Show allowed max size |
| Concurrent editing | Show conflict resolution UI | Offer merge or choose version |
| Session in multiple tabs | Sync state across tabs | Use broadcast channel |
| Browser back button | Preserve state appropriately | Handle with router state |

---

## 6. Jobs to Be Done (JTBD)

### 6.1 Core Jobs
| # | When... | I want to... | So I can... | Priority |
|---|---------|--------------|-------------|----------|
| 1 | [Situation with context] | [Specific action] | [Desired outcome with emotional benefit] | Must-have |
| 2 | [Situation] | [Action] | [Outcome] | Must-have |
[List 15-20 jobs]

### 6.2 Related Jobs
[Jobs that are tangentially related but important]

### 6.3 Emotional Jobs
[Underlying emotional needs the product serves]

---

## 7. Friction Analysis & Solutions

### 7.1 Identified Friction Points
| Friction Point | Impact | Current Experience | Proposed Solution | Effort |
|----------------|--------|-------------------|-------------------|--------|
| [Specific point] | High | [What happens now] | [Detailed solution] | Medium |
[List 10-15 friction points]

### 7.2 Friction Reduction Roadmap
[Prioritized plan to address friction]

---

## 8. Success Metrics by Journey

### 8.1 Onboarding Success
| Metric | Definition | Target | Current |
|--------|------------|--------|---------|
| Time to value | Time from signup to first [key action] | < 5 min | - |
| Activation rate | % who complete [activation criteria] | > 40% | - |
| Drop-off points | Where users abandon onboarding | < 20% per step | - |

### 8.2 Core Experience Success
[Similar metrics table]

### 8.3 Retention Indicators
[Similar metrics table]

---

## 9. Accessibility Considerations for Journeys
[How each journey accommodates users with different abilities]

---

## 10. Cross-Platform Journey Considerations
[How journeys work across web, mobile, tablet]

---

Format in clean, detailed Markdown. This should be comprehensive enough to actually build the product.`,

  testing: (desc, ctx) => `You are a Principal QA Engineer and Test Architect at a leading tech company. You are creating a COMPREHENSIVE Test Plan and Test Cases document that QA teams can execute immediately.

PROJECT: ${desc}
${ctx ? `ADDITIONAL CONTEXT: ${ctx}` : ''}

CRITICAL INSTRUCTIONS:
- Create EXECUTABLE test cases with step-by-step instructions
- Cover HAPPY PATH, EDGE CASES, NEGATIVE TESTS, and BOUNDARY CONDITIONS
- Include SPECIFIC test data and expected results
- This must be usable for actual QA execution
- Minimum 4000 words
- Include at least 50 detailed test cases

Generate the complete Test Documentation:

---

# Test Plan & Test Cases Document
## [Project Name]
**Version:** 1.0 | **Date:** ${new Date().toLocaleDateString()} | **Author:** QA Team

---

## 1. Test Strategy

### 1.1 Testing Objectives
1. Verify all functional requirements are implemented correctly
2. Ensure application performs under expected load
3. Validate security controls are effective
4. Confirm cross-browser and cross-device compatibility
5. Ensure accessibility compliance (WCAG 2.1 AA)

### 1.2 Testing Scope

#### In Scope
- All user-facing features
- API endpoints
- Database operations
- Third-party integrations
- Performance under load
- Security vulnerabilities
- Accessibility compliance

#### Out of Scope
- [List items not being tested]

### 1.3 Test Levels
| Level | Description | Responsibility | Tools |
|-------|-------------|----------------|-------|
| Unit Testing | Individual functions/methods | Developers | Jest, Vitest |
| Integration Testing | Component interactions | Dev + QA | Jest, Supertest |
| System Testing | End-to-end workflows | QA Team | Playwright, Cypress |
| UAT | Business requirement validation | Product + Stakeholders | Manual |

### 1.4 Entry Criteria
- [ ] Development complete and code merged
- [ ] Unit tests passing (>80% coverage)
- [ ] Build successful in CI/CD
- [ ] Test environment deployed and stable
- [ ] Test data prepared

### 1.5 Exit Criteria
- [ ] All P0 test cases passed
- [ ] All P1 test cases passed (>95%)
- [ ] No open P0/P1 bugs
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Accessibility audit passed

### 1.6 Test Environment
| Environment | URL | Purpose | Data |
|-------------|-----|---------|------|
| Development | dev.example.com | Developer testing | Synthetic |
| Staging | staging.example.com | QA testing | Anonymized prod |
| Pre-prod | preprod.example.com | Final validation | Prod mirror |

---

## 2. Test Cases - Authentication Module

### TC-AUTH-001: Successful User Registration with Email
**Priority:** P0 | **Type:** Functional | **Automation:** Yes

**Preconditions:**
- User is not logged in
- Email address is not already registered

**Test Data:**
- Email: test_user_[timestamp]@example.com
- Password: Test@12345
- Name: Test User

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to homepage | Homepage loads within 2 seconds |
| 2 | Click "Sign Up" button | Registration modal/page opens |
| 3 | Enter email: test_user_[timestamp]@example.com | Email field accepts input |
| 4 | Enter password: Test@12345 | Password field shows masked input, strength indicator shows "Strong" |
| 5 | Enter name: Test User | Name field accepts input |
| 6 | Check "I agree to Terms" checkbox | Checkbox is selected |
| 7 | Click "Create Account" button | Loading spinner appears |
| 8 | Wait for response | Success message: "Verification email sent" |
| 9 | Check email inbox | Email received within 60 seconds |
| 10 | Click verification link in email | Browser opens verification page |
| 11 | Observe verification page | "Email verified successfully" message |
| 12 | Click "Continue to App" | User redirected to dashboard, logged in |

**Expected Final State:**
- User account created in database
- User is logged in
- Session token generated
- Welcome email sent
- Analytics event tracked

---

### TC-AUTH-002: Registration with Existing Email
**Priority:** P0 | **Type:** Negative | **Automation:** Yes

**Preconditions:**
- Email "existing@example.com" already registered

**Test Data:**
- Email: existing@example.com
- Password: Test@12345

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to registration page | Page loads |
| 2 | Enter email: existing@example.com | Email field accepts input |
| 3 | Enter valid password | Password accepted |
| 4 | Click "Create Account" | Request sent |
| 5 | Observe error handling | Error message: "An account with this email already exists. Would you like to log in instead?" |
| 6 | Verify "Log In" link present | Link navigates to login page |

---

### TC-AUTH-003: Registration with Invalid Email Format
**Priority:** P1 | **Type:** Validation | **Automation:** Yes

**Test Data Matrix:**
| Email Input | Expected Behavior |
|-------------|-------------------|
| (empty) | "Email is required" error |
| test | "Please enter a valid email" error |
| test@ | "Please enter a valid email" error |
| test@domain | "Please enter a valid email" error |
| @domain.com | "Please enter a valid email" error |
| test @domain.com | "Please enter a valid email" error |
| test@domain.com | Accepted |

---

### TC-AUTH-004: Password Strength Validation
**Priority:** P0 | **Type:** Validation | **Automation:** Yes

**Test Data Matrix:**
| Password | Expected Strength | Accepted? |
|----------|-------------------|-----------|
| (empty) | N/A | No - "Password is required" |
| 123 | Weak | No - "Minimum 8 characters" |
| 12345678 | Weak | No - "Must include letters" |
| password | Weak | No - "Must include numbers" |
| Password1 | Medium | No - "Must include special character" |
| Password1! | Strong | Yes |
| P@ssw0rd!2023 | Very Strong | Yes |

---

### TC-AUTH-005: Successful Login
**Priority:** P0 | **Type:** Functional | **Automation:** Yes

**Preconditions:**
- User account exists and is verified
- User is logged out

**Test Data:**
- Email: verified_user@example.com
- Password: Test@12345

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login form displayed |
| 2 | Enter email | Email accepted |
| 3 | Enter password | Password masked |
| 4 | Click "Log In" | Loading state shown |
| 5 | Wait for response | Redirected to dashboard |
| 6 | Verify session | User name shown in header |
| 7 | Refresh page | User remains logged in |
| 8 | Check cookies/storage | Session token present |

---

### TC-AUTH-006: Login with Incorrect Password
**Priority:** P0 | **Type:** Negative | **Automation:** Yes

[Detailed steps...]

---

### TC-AUTH-007: Login with Unverified Email
**Priority:** P1 | **Type:** Negative | **Automation:** Yes

[Detailed steps...]

---

### TC-AUTH-008: Password Reset - Happy Path
**Priority:** P0 | **Type:** Functional | **Automation:** Yes

**Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Forgot Password" on login | Password reset page opens |
| 2 | Enter registered email | Email accepted |
| 3 | Click "Send Reset Link" | Success: "Reset link sent to your email" |
| 4 | Check email | Reset email received within 60 seconds |
| 5 | Click reset link | Password reset form opens |
| 6 | Enter new password: NewPass@123 | Password accepted |
| 7 | Confirm password: NewPass@123 | Passwords match |
| 8 | Click "Reset Password" | Success: "Password updated successfully" |
| 9 | Login with new password | Login successful |
| 10 | Login with old password | Login fails |

---

### TC-AUTH-009: Password Reset Link Expiry
**Priority:** P1 | **Type:** Boundary | **Automation:** Yes

[Detailed steps - test link expiration after 24 hours...]

---

### TC-AUTH-010: Session Timeout
**Priority:** P1 | **Type:** Security | **Automation:** Yes

[Detailed steps - test session expiry after inactivity...]

---

## 3. Test Cases - Core Feature Module

### TC-CORE-001: [Feature] - Create New Item
**Priority:** P0 | **Type:** Functional | **Automation:** Yes

[Full detailed test case...]

---

[Continue with 15-20 more core feature test cases, each with full detail]

---

## 4. Test Cases - Edge Cases & Boundary Conditions

### TC-EDGE-001: Empty State Handling
**Priority:** P1 | **Type:** Edge Case | **Automation:** Yes

**Scenarios:**
| Scenario | Navigation | Expected Display |
|----------|------------|------------------|
| New user, no items | Dashboard | Empty state illustration + "Create your first..." CTA |
| Search with no results | Search page | "No results found for [query]" + suggestions |
| Filtered list empty | List page | "No items match your filters" + clear filters option |

---

### TC-EDGE-002: Maximum Input Lengths
**Priority:** P1 | **Type:** Boundary | **Automation:** Yes

| Field | Max Length | Test Value | Expected Behavior |
|-------|------------|------------|-------------------|
| Name | 100 chars | 101 chars | Truncated or prevented |
| Description | 1000 chars | 1001 chars | Error shown |
| Email | 254 chars | 255 chars | Validation error |

---

### TC-EDGE-003: Special Characters Handling
**Priority:** P1 | **Type:** Edge Case | **Automation:** Yes

| Input | Test Value | Expected |
|-------|------------|----------|
| Name field | <script>alert('xss')</script> | Sanitized, no script execution |
| Search | '; DROP TABLE users;-- | Sanitized, no SQL injection |
| URL parameter | ../../../etc/passwd | Blocked, no path traversal |

---

### TC-EDGE-004: Concurrent Operations
**Priority:** P2 | **Type:** Edge Case | **Automation:** Yes

[Test same item edited by two users simultaneously...]

---

### TC-EDGE-005: Network Interruption During Save
**Priority:** P1 | **Type:** Edge Case | **Automation:** Partial

[Test behavior when network drops mid-operation...]

---

[Continue with 10+ more edge case tests]

---

## 5. Test Cases - Must-Have Requirements

### TC-MUST-001 through TC-MUST-015
[Critical path tests that MUST pass for release]

---

## 6. Test Cases - Good-to-Have (P2)

### TC-GOOD-001 through TC-GOOD-010
[Lower priority but still valuable tests]

---

## 7. API Test Cases

### API-001: GET /api/users - List Users
**Method:** GET
**Auth:** Bearer token required

| Test | Request | Expected Response |
|------|---------|-------------------|
| Valid request | GET /api/users | 200 OK, array of users |
| No auth | GET /api/users (no token) | 401 Unauthorized |
| Invalid token | GET /api/users (expired token) | 401 Unauthorized |
| Pagination | GET /api/users?page=2&limit=10 | 200 OK, paginated results |

**Response Schema Validation:**
\`\`\`json
{
  "data": [
    {
      "id": "string (required)",
      "email": "string (required)",
      "name": "string (required)",
      "createdAt": "ISO 8601 date (required)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number"
  }
}
\`\`\`

---

[Continue with 15+ API test cases]

---

## 8. Performance Test Plan

### 8.1 Load Testing Scenarios
| Scenario | Users | Duration | Target |
|----------|-------|----------|--------|
| Normal load | 100 concurrent | 10 min | <500ms response |
| Peak load | 500 concurrent | 5 min | <1s response |
| Stress test | 1000+ concurrent | 5 min | Graceful degradation |

### 8.2 Performance Benchmarks
| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Page load (FCP) | <1.5s | <2.5s | >3s |
| API response | <200ms | <500ms | >1s |
| Search query | <300ms | <800ms | >2s |
| File upload (5MB) | <3s | <5s | >10s |

### 8.3 Endurance Testing
[Long-running stability tests...]

---

## 9. Security Test Checklist

### 9.1 OWASP Top 10 Coverage
| Vulnerability | Test Status | Notes |
|--------------|-------------|-------|
| A01 - Broken Access Control | [ ] | Test horizontal/vertical privilege escalation |
| A02 - Cryptographic Failures | [ ] | Verify encryption at rest/transit |
| A03 - Injection | [ ] | SQL, NoSQL, OS command injection |
| A04 - Insecure Design | [ ] | Business logic flaws |
| A05 - Security Misconfiguration | [ ] | Default credentials, debug modes |
| A06 - Vulnerable Components | [ ] | Dependency audit |
| A07 - Auth Failures | [ ] | Brute force, session management |
| A08 - Software Integrity | [ ] | Verify update mechanisms |
| A09 - Logging Failures | [ ] | Verify security event logging |
| A10 - SSRF | [ ] | Server-side request forgery |

### 9.2 Authentication Security Tests
[Detailed security test cases...]

### 9.3 Data Protection Tests
[Encryption, PII handling tests...]

---

## 10. Accessibility Test Checklist

### 10.1 WCAG 2.1 AA Compliance
| Criteria | Test | Status |
|----------|------|--------|
| 1.1.1 Non-text Content | All images have alt text | [ ] |
| 1.4.3 Contrast | Text meets 4.5:1 ratio | [ ] |
| 2.1.1 Keyboard | All functions keyboard accessible | [ ] |
| 2.4.7 Focus Visible | Focus indicator visible | [ ] |
[Continue full checklist...]

---

## 11. Cross-Browser/Device Test Matrix

| Browser | Version | OS | Priority | Status |
|---------|---------|-----|----------|--------|
| Chrome | Latest | Windows 11 | P0 | [ ] |
| Chrome | Latest | macOS | P0 | [ ] |
| Safari | Latest | macOS | P0 | [ ] |
| Safari | Latest | iOS | P0 | [ ] |
| Firefox | Latest | Windows | P1 | [ ] |
| Edge | Latest | Windows | P1 | [ ] |
| Chrome | Latest | Android | P0 | [ ] |

---

## 12. Bug Report Template

### Bug ID: BUG-XXX
**Title:** [Brief description]
**Severity:** P0/P1/P2/P3
**Environment:** [Browser, OS, Version]
**Reporter:** [Name]
**Date:** [Date]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Attachments:**
[Screenshots, videos, logs]

**Additional Notes:**
[Any relevant context]

---

## 13. Test Data Requirements

### 13.1 Test User Accounts
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | Test@Admin123 | Admin flow testing |
| Standard User | user@test.com | Test@User123 | Regular user testing |
| New User | (generated) | (generated) | Registration testing |

### 13.2 Test Data Generation
[Scripts or tools for generating test data]

---

Format in clean, detailed Markdown. Every test case should be immediately executable by a QA engineer.`
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
  
  // System prompt for all providers
  const systemPrompt = `You are an elite software consultant at a Fortune 500 consulting firm earning $500/hour. 
You create EXTREMELY detailed, comprehensive, production-ready documentation that enterprises pay tens of thousands of dollars for.
CRITICAL: Always produce FULL content, not summaries. Fill every section with SPECIFIC details, real examples, and actionable information.
Your output should be at MINIMUM 3000-4000 words. Never produce thin, generic content.
Format everything in clean, professional Markdown with proper hierarchy.`;

  // Determine which provider to use
  const openai = getOpenAI();
  const gemini = getGemini();
  const groq = getGroq();
  const ollama = getOllama();
  
  let provider: 'openai' | 'gemini' | 'groq' | 'ollama';
  
  if (preferredProvider === 'openai' && openai) {
    provider = 'openai';
  } else if (preferredProvider === 'gemini' && gemini) {
    provider = 'gemini';
  } else if (preferredProvider === 'groq' && groq) {
    provider = 'groq';
  } else if (preferredProvider === 'ollama' && ollama) {
    provider = 'ollama';
  } else if (preferredProvider === 'auto') {
    // Priority: Groq (free & fast) > Ollama (self-hosted) > OpenAI > Gemini
    if (groq) provider = 'groq';
    else if (ollama) provider = 'ollama';
    else if (openai) provider = 'openai';
    else if (gemini) provider = 'gemini';
    else provider = 'groq'; // Will fail with helpful error
  } else {
    provider = groq ? 'groq' : ollama ? 'ollama' : openai ? 'openai' : 'gemini';
  }
  
  // Groq - Fast inference with Llama/Mixtral (FREE tier available!)
  if (provider === 'groq' && groq) {
    console.log('[AI Service] Using Groq with llama-3.3-70b-versatile');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',  // Powerful 70B model, free tier
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 8000,
      temperature: 0.75
    });
    
    return {
      content: response.choices[0]?.message?.content || 'No content generated',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile'
    };
  }
  
  // Ollama - Self-hosted LLMs (completely free, runs locally)
  if (provider === 'ollama' && ollama) {
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
    console.log(`[AI Service] Using Ollama with ${ollamaModel}`);
    const response = await ollama.chat({
      model: ollamaModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: 0.75,
        num_predict: 8000
      }
    });
    
    return {
      content: response.message?.content || 'No content generated',
      provider: 'ollama',
      model: ollamaModel
    };
  }
  
  if (provider === 'openai' && openai) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Upgraded to gpt-4o for higher quality
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 16000,  // Increased significantly for comprehensive output
      temperature: 0.75   // Slightly higher for more detailed, creative output
    });
    
    return {
      content: response.choices[0]?.message?.content || 'No content generated',
      provider: 'openai',
      model: 'gpt-4o'
    };
  }
  
  if (provider === 'gemini' && gemini) {
    console.log('[AI Service] Using Gemini model: gemini-2.0-flash');
    const model = gemini.getGenerativeModel({ 
      model: 'gemini-2.0-flash',  // Stable second-gen flash model
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.75
      }
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return {
      content: response.text() || 'No content generated',
      provider: 'gemini',
      model: 'gemini-2.0-flash'
    };
  }
  
  throw new Error('No AI provider available. Set GROQ_API_KEY (free!), OLLAMA_ENABLED=true, OPENAI_API_KEY, or GOOGLE_API_KEY.');
}

export function getAvailableProviders(): { openai: boolean; gemini: boolean; groq: boolean; ollama: boolean } {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GOOGLE_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    ollama: !!(process.env.OLLAMA_ENABLED || process.env.OLLAMA_HOST)
  };
}
