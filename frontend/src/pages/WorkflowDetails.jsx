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
    <div className="space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* AI Status Banner */}
      {!hasAI && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-yellow-300">
          <strong>⚠️ AI Not Configured:</strong> Set OPENAI_API_KEY or GOOGLE_API_KEY environment variables on the backend to enable AI-powered content generation.
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-3xl font-bold text-white mb-2">{workflow.name}</h2>
            <p className="text-slate-300">{workflow.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={workflow.status || 'draft'}
              onChange={(e) => updateStatus(e.target.value)}
              className="form-input bg-slate-600 border-slate-500 text-white px-4 py-2 rounded-lg"
            >
              <option value="draft">📝 Draft</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="archived">📦 Archived</option>
            </select>
            <button
              onClick={exportToMarkdown}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              title="Export all deliverables to Markdown"
            >
              📥 Export All
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">{completedSteps} of {steps.length} steps completed</span>
            <span className="text-slate-300">{progress}%</span>
          </div>
          <div className="w-full bg-slate-600/50 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phases */}
        {Array.isArray(workflow.phases) && workflow.phases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {workflow.phases.map((phase) => (
              <span
                key={phase}
                className={`text-sm px-3 py-1 rounded-full font-semibold badge-status ${PHASE_COLORS[phase]}`}
              >
                {PHASE_ICONS[phase]} {(PHASE_NAMES[phase] || phase).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Provider Selection */}
      {hasAI && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-medium">AI Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="form-input bg-slate-600 border-slate-500 text-white px-3 py-1.5 rounded"
            >
              <option value="auto">🤖 Auto (Best Available)</option>
              {aiProviders.openai && <option value="openai">OpenAI GPT-4</option>}
              {aiProviders.gemini && <option value="gemini">Google Gemini</option>}
            </select>
          </div>
          <button
            onClick={executeAllSteps}
            disabled={executingStep !== null}
            className={`btn-primary ${executingStep !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {executingStep !== null ? '⏳ Generating...' : '🚀 Generate All Deliverables'}
          </button>
        </div>
      )}

      {/* Follow-up Questions */}
      {unanswered.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">📝 Follow-up Questions</h3>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-4">
            {unanswered.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-slate-200 font-medium">{q.text || q.question || 'Additional information'}</label>
                <input
                  className="form-input bg-slate-800/50 border-slate-600 text-white w-full"
                  placeholder="Type your answer"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
            <button
              onClick={submitAnswers}
              disabled={savingAnswers}
              className={`btn-primary ${savingAnswers ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {savingAnswers ? '⏳ Saving...' : '💾 Submit Answers'}
            </button>
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">📦 Deliverables</h3>
        
        {steps.length === 0 ? (
          <div className="bg-slate-700/30 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">No deliverables defined yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id || index}
                className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden"
              >
                {/* Step Header */}
                <button
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  className="w-full text-left p-5 hover:bg-slate-600/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      step.status === 'completed'
                        ? 'bg-green-600 text-white'
                        : executingStep === index
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {step.status === 'completed' ? '✓' : executingStep === index ? '⏳' : index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{step.title || PHASE_NAMES[step.phase] || step.phase}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PHASE_COLORS[step.phase]}`}>
                          {PHASE_ICONS[step.phase]} {step.phase}
                        </span>
                        {step.result?.aiGenerated && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-900 text-purple-300">
                            🤖 {step.result.provider} / {step.result.model}
                          </span>
                        )}
                        {step.result?.generatedAt && (
                          <span className="text-xs text-slate-400">
                            Generated {new Date(step.result.generatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {step.result?.content && (
                      <button
                        onClick={(e) => { e.stopPropagation(); exportStepToMarkdown(step); }}
                        className="text-green-400 hover:text-green-300 text-sm"
                        title="Export to Markdown"
                      >
                        📥
                      </button>
                    )}
                    <span className="text-slate-400 text-xl">
                      {expandedStep === index ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedStep === index && (
                  <div className="border-t border-slate-600 bg-slate-800/50">
                    {/* Action Bar */}
                    <div className="p-4 border-b border-slate-600 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeStep(index)}
                          disabled={executingStep !== null}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            executingStep === index
                              ? 'bg-blue-600 text-white animate-pulse'
                              : executingStep !== null
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {executingStep === index ? '⏳ Generating...' : step.result?.content ? '🔄 Regenerate' : '▶ Generate'}
                        </button>
                      </div>
                      {step.result?.content && (
                        <button
                          onClick={() => exportStepToMarkdown(step)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                        >
                          📥 Export Markdown
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {step.result?.notice && (
                        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                          ⚠️ {step.result.notice}
                        </div>
                      )}
                      
                      {step.result?.content ? (
                        <div className="prose prose-invert prose-slate max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-base font-bold text-white mt-3 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="text-slate-300 mb-3 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside text-slate-300 mb-3 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside text-slate-300 mb-3 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                              em: ({node, ...props}) => <em className="italic text-slate-200" {...props} />,
                              code: ({node, inline, ...props}) => 
                                inline 
                                  ? <code className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-300 text-sm" {...props} />
                                  : <code className="block bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-400 mb-4" {...props} />,
                              table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="min-w-full border border-slate-600" {...props} /></div>,
                              th: ({node, ...props}) => <th className="border border-slate-600 px-3 py-2 bg-slate-700 text-white font-semibold text-left" {...props} />,
                              td: ({node, ...props}) => <td className="border border-slate-600 px-3 py-2 text-slate-300" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                              hr: ({node, ...props}) => <hr className="border-slate-600 my-6" {...props} />,
                            }}
                          >
                            {step.result.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          <p className="text-lg mb-4">No content generated yet</p>
                          <p className="text-sm">Click "Generate" to create {PHASE_NAMES[step.phase] || step.phase} documentation</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button onClick={() => navigate('/')} className="btn-secondary">
          ← Back to Dashboard
        </button>
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to delete this workflow?')) {
              try {
                await axios.delete(`${API_URL}/api/workflows/${id}`)
                navigate('/')
              } catch (err) {
                console.error('Error deleting workflow:', err)
              }
            }
          }}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          🗑️ Delete Workflow
        </button>
      </div>
    </div>
  )
}
