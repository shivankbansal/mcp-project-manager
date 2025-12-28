# Real-Time Workflow System - Design Document

## 🎯 Vision

Transform the MCP Project Manager into an **intelligent, real-time workflow engine** where users see AI working in real-time, generating each phase step-by-step with live progress updates.

## Current vs. Proposed Flow

### Current Flow ❌
```
User → Fill Form → Submit → Click "Execute" → Wait → See Result
(No visibility into what's happening)
```

### Proposed Flow ✅
```
User → Enter Prompt → AI Starts Immediately
  ↓
  Real-time Progress:
  ✅ Understanding requirements... (2s)
  🔄 Generating BRD... (15s)
  ✅ BRD Complete! (3,245 words)
  🔄 Now creating design specifications... (12s)
  ✅ Design Complete!
  🔄 Mapping user journeys... (10s)
  ✅ User Journeys Complete!
  🔄 Generating test cases... (14s)
  ✅ All Phases Complete! 🎉
```

---

## 🎨 UI/UX Design

### 1. **Simplified Entry Point**

Instead of multi-step form, use a **single intelligent prompt**:

```
┌─────────────────────────────────────────────────────┐
│  What would you like to build?                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐│
│  │ Describe your project idea...                  ││
│  │                                                 ││
│  │ e.g., "Build a mobile banking app for         ││
│  │ millennials with biometric login, real-time   ││
│  │ transactions, and bill payment features"      ││
│  │                                                 ││
│  └────────────────────────────────────────────────┘│
│                                                      │
│  Optional Details (expand)                          │
│  • Target Platform: [Web] [Mobile] [Desktop]        │
│  • Timeline: [3 months]                             │
│  • Budget: [$50k-100k]                              │
│                                                      │
│  [🚀 Generate Full Workflow]  [⚙️ Advanced Options] │
└─────────────────────────────────────────────────────┘
```

### 2. **Live Progress Dashboard**

Once user clicks "Generate", show real-time progress:

```
┌─────────────────────────────────────────────────────┐
│  Mobile Banking App                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 65% Complete       │
│                                                      │
│  Phase 1: Business Requirements                     │
│  ✅ ━━━━━━━━━━━━━━━━━━━━ 100%  Complete (3,245 words)│
│     Generated in 18 seconds                          │
│     [📄 View Document] [💬 Refine]                   │
│                                                      │
│  Phase 2: Design & Wireframes                       │
│  🔄 ━━━━━━━━━━━━━━━━━━━━ 85%   Generating...        │
│     "Creating color palette and typography..."      │
│     Estimated: 3 seconds remaining                   │
│                                                      │
│  Phase 3: User Journeys                             │
│  ⏸️  ━━━━━━━━━━━━━━━━━━━━ 0%    Queued              │
│                                                      │
│  Phase 4: Test Cases                                │
│  ⏸️  ━━━━━━━━━━━━━━━━━━━━ 0%    Queued              │
│                                                      │
│  💡 AI is working hard for you!                     │
│  [⏸️  Pause] [⏹️  Stop] [⚙️  Settings]               │
└─────────────────────────────────────────────────────┘
```

### 3. **Streaming Text Output**

Show AI generating content in real-time (like ChatGPT):

```
┌─────────────────────────────────────────────────────┐
│  📋 Business Requirements Document                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                      │
│  ## Executive Summary                               │
│                                                      │
│  The Mobile Banking App is a comprehensive         │
│  financial solution designed for tech-savvy        │
│  millennials who demand seamless, secure, and      │
│  instant access to their finances. This           │
│  application will provide biometric               │
│  authentication, real-time transaction tracking█  │
│                                                      │
│  [Generating... 1,234 / ~3,500 words]               │
└─────────────────────────────────────────────────────┘
```

### 4. **Interactive Refinement**

Allow users to refine AI output without regenerating everything:

```
┌─────────────────────────────────────────────────────┐
│  ✅ BRD Complete! (3,245 words)                      │
│                                                      │
│  💬 Need changes?                                   │
│  ┌────────────────────────────────────────────────┐│
│  │ Add more details about security features...    ││
│  └────────────────────────────────────────────────┘│
│                                                      │
│  [🔄 Refine this section] [✅ Looks good, continue] │
└─────────────────────────────────────────────────────┘
```

### 5. **Smart Notifications**

Keep users informed with contextual notifications:

```
┌──────────────────────────────────────┐
│  🎉 Phase 2 Complete!                │
│  Design specifications ready         │
│  • 12 pages defined                  │
│  • Color palette created             │
│  • Accessibility checklist included  │
│                                      │
│  [Review Now] [Continue to Phase 3]  │
└──────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Architecture Changes

#### 1. **Backend: Streaming Endpoints**

Create Server-Sent Events (SSE) endpoint for real-time updates:

**New Route:** `POST /api/workflows/generate/stream`

```typescript
// src/routes/workflowRoutes.ts
router.post('/generate/stream', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const { prompt, options } = req.body

  try {
    // Phase 1: Extract requirements from prompt
    sendEvent(res, 'phase_start', {
      phase: 'brd',
      message: 'Understanding your requirements...'
    })

    // Generate BRD with streaming
    for await (const chunk of generateBRDStream(prompt)) {
      sendEvent(res, 'content_chunk', {
        phase: 'brd',
        chunk: chunk,
        wordCount: countWords(chunk)
      })
    }

    sendEvent(res, 'phase_complete', {
      phase: 'brd',
      totalWords: 3245,
      duration: 18
    })

    // Phase 2: Design
    sendEvent(res, 'phase_start', {
      phase: 'design',
      message: 'Creating design specifications...'
    })
    // ... continue for all phases

    sendEvent(res, 'workflow_complete', {
      workflowId: savedWorkflow._id
    })

  } catch (error) {
    sendEvent(res, 'error', { message: error.message })
  } finally {
    res.end()
  }
})

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
```

#### 2. **AI Service: Streaming Support**

Update AI service to support streaming:

```typescript
// src/services/aiService.ts
export async function* generateBRDStream(prompt: string) {
  const groq = getGroq()

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: BRD_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    stream: true,  // Enable streaming
    max_tokens: 8000
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) {
      yield content
    }
  }
}
```

#### 3. **Frontend: SSE Client**

Create a React hook for SSE:

```jsx
// frontend/src/hooks/useWorkflowStream.js
import { useState, useEffect } from 'react'

export function useWorkflowStream(prompt, options) {
  const [status, setStatus] = useState('idle') // idle, connecting, generating, complete, error
  const [currentPhase, setCurrentPhase] = useState(null)
  const [phases, setPhases] = useState({
    brd: { status: 'pending', content: '', progress: 0 },
    design: { status: 'pending', content: '', progress: 0 },
    journey: { status: 'pending', content: '', progress: 0 },
    testing: { status: 'pending', content: '', progress: 0 }
  })
  const [workflowId, setWorkflowId] = useState(null)
  const [error, setError] = useState(null)

  const startGeneration = () => {
    setStatus('connecting')

    const eventSource = new EventSource(
      `${API_URL}/api/workflows/generate/stream?prompt=${encodeURIComponent(prompt)}`
    )

    eventSource.addEventListener('phase_start', (e) => {
      const data = JSON.parse(e.data)
      setCurrentPhase(data.phase)
      setPhases(prev => ({
        ...prev,
        [data.phase]: { ...prev[data.phase], status: 'generating' }
      }))
      setStatus('generating')
    })

    eventSource.addEventListener('content_chunk', (e) => {
      const data = JSON.parse(e.data)
      setPhases(prev => ({
        ...prev,
        [data.phase]: {
          ...prev[data.phase],
          content: prev[data.phase].content + data.chunk,
          progress: Math.min((data.wordCount / 3500) * 100, 99)
        }
      }))
    })

    eventSource.addEventListener('phase_complete', (e) => {
      const data = JSON.parse(e.data)
      setPhases(prev => ({
        ...prev,
        [data.phase]: {
          ...prev[data.phase],
          status: 'completed',
          progress: 100,
          duration: data.duration,
          wordCount: data.totalWords
        }
      }))
    })

    eventSource.addEventListener('workflow_complete', (e) => {
      const data = JSON.parse(e.data)
      setWorkflowId(data.workflowId)
      setStatus('complete')
      eventSource.close()
    })

    eventSource.addEventListener('error', (e) => {
      const data = JSON.parse(e.data)
      setError(data.message)
      setStatus('error')
      eventSource.close()
    })

    return () => eventSource.close()
  }

  return {
    status,
    currentPhase,
    phases,
    workflowId,
    error,
    startGeneration
  }
}
```

#### 4. **New Page: Real-Time Workflow**

```jsx
// frontend/src/pages/WorkflowGenerator.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflowStream } from '../hooks/useWorkflowStream'

export default function WorkflowGenerator() {
  const [prompt, setPrompt] = useState('')
  const [started, setStarted] = useState(false)
  const navigate = useNavigate()

  const { status, currentPhase, phases, workflowId, error, startGeneration } = useWorkflowStream(prompt)

  const handleStart = () => {
    if (!prompt.trim()) return
    setStarted(true)
    startGeneration()
  }

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-black mb-8">
          What would you like to build?
        </h1>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your project in detail...

e.g., I want to build a mobile banking app for millennials with biometric login, real-time transaction tracking, bill payment, and budgeting tools. It should have a modern dark theme and work on iOS and Android."
          className="w-full h-64 glass-input p-6 text-lg"
        />

        <button
          onClick={handleStart}
          disabled={!prompt.trim()}
          className="btn-neon-purple w-full py-6 mt-6 text-xl"
        >
          🚀 Generate Complete Workflow
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Overall Progress */}
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-black">Generating Your Workflow</h2>
          <span className="text-2xl font-black text-genz-purple">
            {Math.round(
              (Object.values(phases).filter(p => p.status === 'completed').length / 4) * 100
            )}%
          </span>
        </div>

        <div className="h-4 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-genz-purple via-genz-pink to-genz-cyan transition-all duration-1000"
            style={{
              width: `${(Object.values(phases).filter(p => p.status === 'completed').length / 4) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Phases */}
      {Object.entries(phases).map(([phaseId, phase]) => (
        <PhaseCard
          key={phaseId}
          phaseId={phaseId}
          phase={phase}
          isActive={currentPhase === phaseId}
        />
      ))}

      {/* Completion */}
      {status === 'complete' && (
        <div className="glass-card p-8 text-center animate-in fade-in slide-in-from-bottom">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-3xl font-black mb-4">Workflow Complete!</h3>
          <button
            onClick={() => navigate(`/workflow/${workflowId}`)}
            className="btn-neon-purple px-12 py-4"
          >
            View Full Workflow
          </button>
        </div>
      )}
    </div>
  )
}

function PhaseCard({ phaseId, phase, isActive }) {
  const icons = {
    brd: '📋',
    design: '🎨',
    journey: '🚶',
    testing: '✅'
  }

  const titles = {
    brd: 'Business Requirements',
    design: 'Design & Wireframes',
    journey: 'User Journeys',
    testing: 'Test Cases'
  }

  return (
    <div className={`glass-card transition-all ${
      isActive ? 'ring-2 ring-genz-purple animate-pulse' : ''
    }`}>
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            phase.status === 'completed' ? 'bg-green-500/20' :
            phase.status === 'generating' ? 'bg-blue-500/20 animate-pulse' :
            'bg-white/5'
          }`}>
            {phase.status === 'completed' ? '✅' : icons[phaseId]}
          </div>
          <div>
            <h3 className="text-xl font-black">{titles[phaseId]}</h3>
            <p className="text-sm text-slate-400">
              {phase.status === 'completed' && `${phase.wordCount} words in ${phase.duration}s`}
              {phase.status === 'generating' && 'Generating...'}
              {phase.status === 'pending' && 'Waiting...'}
            </p>
          </div>
        </div>

        {phase.status === 'generating' && (
          <span className="text-sm font-bold text-genz-cyan">
            {Math.round(phase.progress)}%
          </span>
        )}
      </div>

      {phase.status === 'generating' && (
        <div className="p-6 bg-black/20">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${phase.progress}%` }}
            />
          </div>

          {/* Streaming content preview */}
          <div className="prose prose-invert max-h-96 overflow-y-auto">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap">
              {phase.content}
              <span className="animate-pulse">█</span>
            </pre>
          </div>
        </div>
      )}

      {phase.status === 'completed' && (
        <div className="p-6 flex justify-end">
          <button className="text-sm font-bold text-genz-purple hover:underline">
            View Full Document →
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 🎁 Additional Feature Suggestions

### Priority 1: Must-Have Features

#### 1. **Smart Prompt Enhancement**
- AI suggests improvements to user's initial prompt
- "I noticed you didn't mention security. Should I include authentication requirements?"

#### 2. **Conversation Mode**
- Ask follow-up questions as AI generates
- "I'm about to design the payment flow. Should it support Apple Pay and Google Pay?"

#### 3. **Live Collaboration**
- Multiple users can watch workflow generation
- Real-time cursors and comments

#### 4. **Version History**
- Auto-save every phase
- Compare different versions
- Roll back to previous iterations

#### 5. **Export Options**
- PDF with custom branding
- Confluence/Notion integration
- GitHub markdown with proper formatting
- Jira ticket generation

### Priority 2: Nice-to-Have Features

#### 6. **AI Chat Assistant**
- Sidebar chat to ask questions while generating
- "Can you add more details about the database schema?"

#### 7. **Template Marketplace**
- Community-contributed workflow templates
- Industry-specific templates (fintech, healthcare, e-commerce)
- Share and discover best practices

#### 8. **Budget Estimator**
- AI calculates development costs based on requirements
- Resource allocation suggestions
- Timeline predictions

#### 9. **Tech Stack Recommendations**
- AI suggests technologies based on requirements
- "For real-time features, consider WebSocket or Server-Sent Events"

#### 10. **Dependency Mapper**
- Visual graph showing feature dependencies
- Critical path analysis
- Risk assessment

### Priority 3: Advanced Features

#### 11. **Code Generation**
- Generate actual code scaffolding from BRD
- API endpoint generation
- Database schema creation
- Test file templates

#### 12. **Diagram Generation**
- Auto-generate architecture diagrams
- User flow diagrams
- Database ERD
- Sequence diagrams (using Mermaid.js)

#### 13. **Integration Hub**
- Connect with GitHub/GitLab
- Sync with Jira/Linear/Asana
- Slack notifications
- Calendar integration for milestones

#### 14. **Analytics Dashboard**
- Track workflow completion times
- AI token usage and costs
- Team productivity metrics
- Popular features/phases

#### 15. **Voice Input**
- Describe project by speaking
- Real-time transcription
- Multi-language support

#### 16. **Collaborative Refinement**
- Team members can suggest edits
- Approval workflows
- Comment threads on specific sections
- @mentions and notifications

#### 17. **Smart Search**
- Search across all workflows
- Find similar past projects
- Reuse components from previous work

#### 18. **Compliance Checker**
- Ensure BRD meets industry standards
- GDPR/HIPAA compliance verification
- Security best practices audit

#### 19. **Mobile App**
- Generate workflows on the go
- Push notifications for completion
- Offline viewing of past workflows

#### 20. **API Marketplace**
- Recommend third-party APIs for features
- Integration guides
- Cost comparisons

---

## 📊 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement SSE backend endpoint
- [ ] Create streaming AI service
- [ ] Build real-time progress UI
- [ ] Basic single-prompt workflow

### Phase 2: Enhancement (Week 3-4)
- [ ] Add streaming text display
- [ ] Implement phase refinement
- [ ] Smart notifications
- [ ] Export improvements

### Phase 3: Intelligence (Week 5-6)
- [ ] Conversation mode
- [ ] Prompt enhancement
- [ ] Follow-up questions
- [ ] Tech stack recommendations

### Phase 4: Collaboration (Week 7-8)
- [ ] Multi-user support
- [ ] Comments and mentions
- [ ] Version history
- [ ] Team dashboard

### Phase 5: Ecosystem (Week 9-10)
- [ ] Template marketplace
- [ ] Integration hub
- [ ] Analytics dashboard
- [ ] Mobile app (future)

---

## 🎯 Success Metrics

### User Experience
- **Time to first result**: < 10 seconds
- **Completion rate**: > 80% of started workflows
- **User satisfaction**: 4.5+ stars
- **Return rate**: > 60% within 7 days

### Technical Performance
- **SSE latency**: < 100ms per chunk
- **Phase generation time**: < 20s per phase
- **Concurrent users**: Support 100+ simultaneous generations
- **Error rate**: < 1%

### Business Impact
- **User adoption**: 10x increase in daily active users
- **Workflow quality**: 90% require no manual edits
- **Time saved**: 80% reduction vs. manual writing
- **Conversion**: 50% of free users upgrade for premium features

---

## 💡 Quick Wins (Implement First)

1. **Single Prompt Input** - Replace multi-step form
2. **SSE Progress Bar** - Show real-time % for each phase
3. **Streaming Output** - Display content as it generates
4. **Smart Notifications** - Toast for phase completion
5. **Export to Markdown** - One-click download

These 5 features alone will transform the user experience!

---

**Next Steps**: Would you like me to start implementing any of these features? I recommend starting with the SSE backend and real-time progress UI for immediate impact.
