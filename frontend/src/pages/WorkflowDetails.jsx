import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

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

export default function WorkflowDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState(null)
  const [expandedStep, setExpandedStep] = useState(null)
  const [stepResults, setStepResults] = useState({})
  const [answers, setAnswers] = useState({})
  const [savingAnswers, setSavingAnswers] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

  useEffect(() => {
    console.info('[devtrifecta] boot WorkflowDetails', { id })
    fetchWorkflow()
  }, [id])

  const fetchWorkflow = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/workflows/${id}`)
      const workflowData = response.data
      // Ensure arrays are properly initialized
      if (workflowData) {
        workflowData.steps = Array.isArray(workflowData.steps) ? workflowData.steps : []
        workflowData.phases = Array.isArray(workflowData.phases) ? workflowData.phases : []
        workflowData.questions = Array.isArray(workflowData.questions) ? workflowData.questions : []
      }
      console.debug('[devtrifecta] fetched workflow', {
        id: workflowData?._id || workflowData?.id,
        steps: Array.isArray(workflowData?.steps) ? workflowData.steps.length : 0,
        phases: Array.isArray(workflowData?.phases) ? workflowData.phases.length : 0,
        questions: Array.isArray(workflowData?.questions) ? workflowData.questions.length : 0
      })
      setWorkflow(workflowData)
    } catch (err) {
      console.error('[devtrifecta] Error fetching workflow:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
      setError('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const executeStep = async (stepIndex) => {
    try {
      setExecuting(true)
      console.debug('[devtrifecta] execute step', { stepIndex })
      const response = await axios.post(`${API_URL}/api/workflows/${id}/execute`, {
        stepIndex: stepIndex
      })
      setStepResults(prev => ({
        ...prev,
        [stepIndex]: response.data.result
      }))
    } catch (err) {
      console.error('[devtrifecta] Error executing step:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
      setError('Failed to execute step')
    } finally {
      setExecuting(false)
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      console.debug('[devtrifecta] update status', { newStatus })
      await axios.put(`${API_URL}/api/workflows/${id}`, {
        status: newStatus
      })
      setWorkflow(prev => ({
        ...prev,
        status: newStatus
      }))
    } catch (err) {
      console.error('[devtrifecta] Error updating status:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
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

      console.debug('[devtrifecta] submit answers', { count: payload.length })
      await axios.post(`${API_URL}/api/workflows/${id}/answer`, { answers: payload })
      await fetchWorkflow()
      setAnswers({})
    } catch (err) {
      console.error('[devtrifecta] Error submitting answers:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data
      })
      setError('Failed to submit answers')
    } finally {
      setSavingAnswers(false)
    }
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

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-300 text-center">
        <p className="text-lg font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="text-center text-slate-300">
        Workflow not found
      </div>
    )
  }

  const steps = workflow.steps || []
  const questions = Array.isArray(workflow.questions) ? workflow.questions : []
  const unanswered = questions.filter(q => !q?.answer)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{workflow.name}</h2>
            <p className="text-slate-300">{workflow.description}</p>
          </div>
          <select
            value={workflow.status || 'draft'}
            onChange={(e) => updateStatus(e.target.value)}
            className="form-input bg-slate-700 border-slate-600 text-white px-4 py-2 rounded"
          >
            <option value="draft">Draft</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Phases */}
        {Array.isArray(workflow.phases) && workflow.phases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {workflow.phases.map((phase) => (
              <span
                key={phase}
                className={`text-sm px-3 py-1 rounded-full font-semibold badge-status ${PHASE_COLORS[phase]}`}
              >
                {PHASE_ICONS[phase]} {phase.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{Array.isArray(steps) ? steps.length : 0}</div>
          <p className="text-slate-300 text-sm">Total Steps</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {Array.isArray(steps) ? steps.filter(s => s.status === 'completed').length : 0}
          </div>
          <p className="text-slate-300 text-sm">Completed</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {Array.isArray(steps) ? steps.filter(s => s.status === 'in-progress').length : 0}
          </div>
          <p className="text-slate-300 text-sm">In Progress</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-300">
            {Array.isArray(steps) && steps.length > 0 ? Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100) : 0}%
          </div>
          <p className="text-slate-300 text-sm">Progress</p>
        </div>
      </div>

      {/* Follow-up Questions */}
      {unanswered.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">Follow-up Questions</h3>
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
            <div className="flex gap-3">
              <button
                onClick={submitAnswers}
                disabled={savingAnswers}
                className={`btn-primary ${savingAnswers ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingAnswers ? 'Saving…' : 'Submit Answers'}
              </button>
              <p className="text-slate-400 text-sm self-center">Answering helps improve generated deliverables.</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps Timeline */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Workflow Steps</h3>
        
        {steps.length === 0 ? (
          <div className="bg-slate-700/30 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">No steps defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(steps) && steps.map((step, index) => (
              <div
                key={step.id || index}
                className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  className="w-full text-left p-6 hover:bg-slate-600/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`step-dot ${
                      step.status === 'completed'
                        ? 'step-dot-completed'
                        : step.status === 'in-progress'
                        ? 'step-dot-active'
                        : 'step-dot-pending'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{step.title || step.phase}</h4>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold badge-status ${
                          PHASE_COLORS[step.phase]
                        }`}>
                          {PHASE_ICONS[step.phase]} {step.phase}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          step.status === 'completed'
                            ? 'bg-green-900 text-green-300'
                            : step.status === 'in-progress'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {step.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-400 ml-4">
                    {expandedStep === index ? '▼' : '▶'}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedStep === index && (
                  <div className="border-t border-slate-600 p-6 bg-slate-600/20 space-y-4">
                    {stepResults[index] ? (
                      <div className="space-y-3">
                        <h5 className="font-semibold text-white">Results:</h5>
                        <div className="bg-slate-900/50 rounded p-4 text-slate-200 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                          {typeof stepResults[index] === 'string'
                            ? stepResults[index]
                            : JSON.stringify(stepResults[index], null, 2)}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-300 text-sm">No results yet. Execute this step to generate content.</p>
                    )}

                    <button
                      onClick={() => executeStep(index)}
                      disabled={executing}
                      className={`btn-primary w-full ${executing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {executing ? 'Executing...' : '▶ Execute Step'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Data (for debugging) */}
      <details className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-slate-300 hover:text-white">
          Raw Workflow Data
        </summary>
        <pre className="mt-4 bg-slate-900/50 rounded p-4 text-slate-300 text-xs overflow-x-auto max-h-96 overflow-y-auto">
          {JSON.stringify(workflow, null, 2)}
        </pre>
      </details>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Back to Dashboard
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
          Delete Workflow
        </button>
      </div>
    </div>
  )
}
