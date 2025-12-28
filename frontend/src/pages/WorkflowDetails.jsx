import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const PHASE_COLORS = {
  brd: 'badge-brd',
  design: 'badge-design',
  journey: 'badge-journey',
  testing: 'badge-testing'
}

const PHASE_ICONS = {
  brd: '📋',
  design: '🎨',
  journey: '🚶',
  testing: '✅'
}

const PHASE_NAMES = {
  brd: 'Business Requirements',
  design: 'Design & Wireframes',
  journey: 'User Journeys',
  testing: 'Test Cases'
}

export default function WorkflowDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executingStep, setExecutingStep] = useState(null)
  const [error, setError] = useState(null)
  const [expandedStep, setExpandedStep] = useState(null)
  const [answers, setAnswers] = useState({})
  const [savingAnswers, setSavingAnswers] = useState(false)
  const [aiProviders, setAiProviders] = useState({ openai: false, gemini: false })
  const [selectedProvider, setSelectedProvider] = useState('auto')

  const API_URL = import.meta.env.VITE_API_URL ?? ''

  useEffect(() => {
    console.info('[devtrifecta] boot WorkflowDetails', { id })
    fetchWorkflow()
    checkAIProviders()
  }, [id])

  const checkAIProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workflows/ai/providers`)
      setAiProviders(response.data)
    } catch (err) {
      console.warn('[devtrifecta] Could not check AI providers')
    }
  }

  const fetchWorkflow = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/workflows/${id}`)
      const workflowData = response.data
      if (workflowData) {
        workflowData.steps = Array.isArray(workflowData.steps) ? workflowData.steps : []
        workflowData.phases = Array.isArray(workflowData.phases) ? workflowData.phases : []
        workflowData.questions = Array.isArray(workflowData.questions) ? workflowData.questions : []
      }
      setWorkflow(workflowData)
    } catch (err) {
      console.error('[devtrifecta] Error fetching workflow:', err)
      setError('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const executeStep = async (stepIndex) => {
    try {
      setExecutingStep(stepIndex)
      setError(null)
      
      const response = await axios.post(`${API_URL}/api/workflows/${id}/execute`, {
        stepIndex,
        provider: selectedProvider
      })
      
      // Update the step in the workflow
      setWorkflow(prev => {
        if (!prev) return prev
        const newSteps = [...prev.steps]
        if (newSteps[stepIndex]) {
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            status: 'completed',
            result: response.data.result
          }
        }
        return { ...prev, steps: newSteps }
      })
      
      // Keep expanded to show results
      setExpandedStep(stepIndex)
      
      if (response.data.providers) {
        setAiProviders(response.data.providers)
      }
    } catch (err) {
      console.error('[devtrifecta] Error executing step:', err)
      setError(`Failed to execute step: ${err?.response?.data?.error || err.message}`)
    } finally {
      setExecutingStep(null)
    }
  }

  const executeAllSteps = async () => {
    const steps = workflow?.steps || []
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].status !== 'completed') {
        await executeStep(i)
      }
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      await axios.put(`${API_URL}/api/workflows/${id}`, { status: newStatus })
      setWorkflow(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('[devtrifecta] Error updating status:', err)
    }
  }

  const submitAnswers = async () => {
    try {
      setSavingAnswers(true)
      const q = Array.isArray(workflow?.questions) ? workflow.questions : []
      const payload = q
        .filter(item => !item.answer && (answers[item.id] || answers[item.id] === ''))
        .map(item => ({ id: item.id, answer: answers[item.id] }))

      if (payload.length === 0) return

      await axios.post(`${API_URL}/api/workflows/${id}/answer`, { answers: payload })
      await fetchWorkflow()
      setAnswers({})
    } catch (err) {
      console.error('[devtrifecta] Error submitting answers:', err)
      setError('Failed to submit answers')
    } finally {
      setSavingAnswers(false)
    }
  }

  const exportToMarkdown = () => {
    const steps = workflow?.steps || []
    let markdown = `# ${workflow?.name || 'Workflow'}\n\n`
    markdown += `**Description:** ${workflow?.description || 'N/A'}\n\n`
    markdown += `**Status:** ${workflow?.status || 'draft'}\n\n`
    markdown += `**Created:** ${new Date(workflow?.createdAt).toLocaleDateString()}\n\n`
    markdown += `---\n\n`

    steps.forEach((step, index) => {
      markdown += `## ${index + 1}. ${step.title || PHASE_NAMES[step.phase] || step.phase}\n\n`
      if (step.result?.content) {
        markdown += step.result.content + '\n\n'
      } else {
        markdown += '*Not yet generated*\n\n'
      }
      markdown += `---\n\n`
    })

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(workflow?.name || 'workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportStepToMarkdown = (step) => {
    const content = step.result?.content || 'Not yet generated'
    const filename = `${(step.title || step.phase).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300">Loading workflow...</p>
        </div>
      </div>
    )
  }

  if (error && !workflow) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-300 text-center">
        <p className="text-lg font-semibold mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  if (!workflow) {
    return <div className="text-center text-slate-300">Workflow not found</div>
  }

  const steps = workflow.steps || []
  const questions = Array.isArray(workflow.questions) ? workflow.questions : []
  const unanswered = questions.filter(q => !q?.answer)
  const hasAI = aiProviders.openai || aiProviders.gemini
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0

  return (
    <div className="space-y-10">
      {/* Error Banner */}
      {error && (
        <div className="glass-card border-red-500/20 bg-red-500/10 p-4 text-red-300 flex justify-between items-center animate-shake">
          <span className="font-bold">💀 {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* AI Status Banner */}
      {!hasAI && (
        <div className="glass-card border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
          <strong className="font-black uppercase tracking-widest text-xs">⚠️ No AI Found:</strong> 
          <p className="text-sm mt-1 font-medium">Set OPENAI_API_KEY or GOOGLE_API_KEY in your backend env to unlock the magic.</p>
        </div>
      )}

      {/* Header Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bento-item bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-genz-purple/20 text-genz-purple rounded-full text-[10px] font-black uppercase tracking-widest border border-genz-purple/30">
                  Project
                </span>
                <span className="text-slate-500 text-xs font-bold">
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none">{workflow.name}</h2>
              <p className="text-lg text-slate-400 font-medium max-w-2xl">{workflow.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={workflow.status || 'draft'}
                onChange={(e) => updateStatus(e.target.value)}
                className="glass-input px-4 py-2.5 text-sm font-bold uppercase tracking-wider"
              >
                <option value="draft">📝 Draft</option>
                <option value="in-progress">🔄 Active</option>
                <option value="completed">✅ Done</option>
                <option value="archived">📦 Stashed</option>
              </select>
              <button
                onClick={exportToMarkdown}
                className="btn-neon-pink px-6 py-2.5 text-white rounded-xl font-black uppercase tracking-wider text-xs"
              >
                📥 Export All
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-10 space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Completion Status</p>
                <p className="text-2xl font-black text-white">{progress}% <span className="text-slate-500 text-sm font-bold">({completedSteps}/{steps.length} steps)</span></p>
              </div>
            </div>
            <div className="w-full bg-white/5 rounded-full h-4 p-1 border border-white/5">
              <div
                className="bg-gradient-to-r from-genz-purple via-genz-pink to-genz-cyan h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bento-item bg-gradient-to-br from-genz-cyan/10 to-transparent border-genz-cyan/20 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-genz-cyan uppercase tracking-[0.2em] mb-4">AI Engine</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Select Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs font-bold"
                >
                  <option value="auto">🤖 Auto-Pilot</option>
                  {aiProviders.openai && <option value="openai">OpenAI GPT-4</option>}
                  {aiProviders.gemini && <option value="gemini">Google Gemini</option>}
                </select>
              </div>
              <button
                onClick={executeAllSteps}
                disabled={executingStep !== null}
                className={`w-full btn-neon-purple py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs ${executingStep !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {executingStep !== null ? 'Cooking...' : '🚀 Blast Off'}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-tight mt-6">
            One click to generate all deliverables using advanced AI.
          </p>
        </div>
      </div>

      {/* Follow-up Questions Bento */}
      {unanswered.length > 0 && (
        <div className="bento-item border-genz-yellow/20 bg-genz-yellow/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-genz-yellow/20 rounded-xl flex items-center justify-center text-genz-yellow text-xl">🤔</div>
            <h3 className="text-2xl font-black tracking-tight text-white">The AI needs more tea ☕️</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unanswered.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{q.text || q.question}</label>
                <input
                  className="glass-input w-full p-4 font-medium"
                  placeholder="Spill the beans..."
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={submitAnswers}
              disabled={savingAnswers}
              className={`btn-neon-purple px-10 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs ${savingAnswers ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {savingAnswers ? 'Saving...' : 'Update Context ✨'}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables Section */}
      <div className="space-y-6">
        <h3 className="text-3xl font-black tracking-tighter text-white">Deliverables</h3>
        
        <div className="grid grid-cols-1 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.id || index}
              className={`glass-card overflow-hidden transition-all duration-500 ${expandedStep === index ? 'ring-2 ring-genz-purple/50' : 'hover:border-white/20'}`}
            >
              {/* Step Header */}
              <button
                onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between group"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 ${
                    step.status === 'completed'
                      ? 'bg-genz-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : executingStep === index
                      ? 'bg-genz-cyan text-white animate-pulse'
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    {step.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${PHASE_COLORS[step.phase]}`}>
                        {PHASE_ICONS[step.phase]} {step.phase}
                      </span>
                      {step.result?.aiGenerated && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                          🤖 {step.result.provider}
                        </span>
                      )}
                    </div>
                    <h4 className="text-2xl font-black text-white tracking-tight group-hover:text-genz-purple transition-colors">
                      {step.title || PHASE_NAMES[step.phase] || step.phase}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {step.result?.content && (
                    <button
                      onClick={(e) => { e.stopPropagation(); exportStepToMarkdown(step); }}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                      📥
                    </button>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 transition-transform duration-500 ${expandedStep === index ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedStep === index && (
                <div className="border-t border-white/5 bg-white/[0.02] animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Action Bar */}
                  <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <button
                      onClick={() => executeStep(index)}
                      disabled={executingStep !== null}
                      className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                        executingStep === index
                          ? 'bg-genz-cyan text-white animate-pulse'
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {executingStep === index ? 'Cooking...' : step.result?.content ? '🔄 Regenerate' : '▶ Generate'}
                    </button>
                    {step.result?.content && (
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Generated {new Date(step.result.generatedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    {step.result?.notice && (
                      <div className="mb-8 p-4 bg-genz-yellow/10 border border-genz-yellow/20 rounded-2xl text-genz-yellow text-xs font-bold">
                        ⚠️ {step.result.notice}
                      </div>
                    )}
                    
                    {step.result?.content ? (
                      <div className="prose prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-white prose-code:text-genz-cyan prose-pre:bg-slate-900/50 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-4xl mb-8" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-2xl mt-12 mb-6 text-genz-purple" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xl mt-8 mb-4 text-white" {...props} />,
                            table: ({node, ...props}) => <div className="my-8 overflow-hidden rounded-2xl border border-white/5"><table className="w-full text-sm" {...props} /></div>,
                            th: ({node, ...props}) => <th className="bg-white/5 p-4 text-left font-black uppercase tracking-widest text-[10px] text-slate-400" {...props} />,
                            td: ({node, ...props}) => <td className="p-4 border-t border-white/5 text-slate-300" {...props} />,
                          }}
                        >
                          {step.result.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-6 opacity-20">✨</div>
                        <p className="text-slate-500 font-bold text-lg mb-8">Ready to manifest this deliverable?</p>
                        <button onClick={() => executeStep(index)} className="btn-neon-purple px-10 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                          Generate Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-10 border-t border-white/5">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors">
          ← Back to Base
        </button>
        <button
          onClick={async () => {
            if (confirm('Delete this project? No cap?')) {
              try {
                await axios.delete(`${API_URL}/api/workflows/${id}`)
                navigate('/')
              } catch (err) {
                console.error('Error deleting workflow:', err)
              }
            }
          }}
          className="text-red-500/50 hover:text-red-500 font-black uppercase tracking-widest text-xs transition-colors"
        >
          🗑️ Delete Project
        </button>
      </div>
    </div>
  )
}
