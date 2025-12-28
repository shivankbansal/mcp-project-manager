import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflowStream } from '../hooks/useWorkflowStream'

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

const PHASE_COLORS = {
  brd: 'from-blue-500 to-blue-600',
  design: 'from-purple-500 to-purple-600',
  journey: 'from-green-500 to-green-600',
  testing: 'from-amber-500 to-amber-600'
}

export default function WorkflowGenerator() {
  const [prompt, setPrompt] = useState('')
  const [started, setStarted] = useState(false)
  const [selectedPhases, setSelectedPhases] = useState(['brd', 'design', 'journey', 'testing'])
  const [provider, setProvider] = useState('auto')
  const navigate = useNavigate()

  const {
    status,
    currentPhase,
    phases,
    workflowId,
    error,
    overallProgress,
    startGeneration,
    cancelGeneration,
    reset
  } = useWorkflowStream()

  const handleStart = () => {
    if (!prompt.trim()) return
    setStarted(true)
    startGeneration(prompt, {
      provider,
      selectedPhases: selectedPhases.length > 0 ? selectedPhases : null
    })
  }

  const handlePhaseToggle = (phase) => {
    if (selectedPhases.includes(phase)) {
      if (selectedPhases.length > 1) {
        setSelectedPhases(selectedPhases.filter(p => p !== phase))
      }
    } else {
      setSelectedPhases([...selectedPhases, phase])
    }
  }

  const handleReset = () => {
    setStarted(false)
    setPrompt('')
    reset()
  }

  const handleViewWorkflow = () => {
    if (workflowId) {
      navigate(`/workflow/${workflowId}`)
    }
  }

  if (!started) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black bg-gradient-to-r from-genz-purple via-genz-pink to-genz-cyan bg-clip-text text-transparent">
            What would you like to build?
          </h1>
          <p className="text-xl text-slate-400 font-medium">
            Describe your project in detail, and AI will generate comprehensive documentation instantly
          </p>
        </div>

        {/* Main Input */}
        <div className="glass-card p-8 space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              Project Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I want to build a mobile banking app for millennials with biometric login, real-time transaction tracking, bill payment, and budgeting tools. It should have a modern dark theme and work on iOS and Android."
              className="w-full h-48 glass-input p-6 text-lg font-medium resize-none"
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500 font-medium">
              {prompt.length} characters • Be detailed for better results
            </p>
          </div>

          {/* Phase Selection */}
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              Select Phases to Generate
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['brd', 'design', 'journey', 'testing'].map(phase => (
                <button
                  key={phase}
                  onClick={() => handlePhaseToggle(phase)}
                  className={`p-4 rounded-2xl font-bold text-sm transition-all ${
                    selectedPhases.includes(phase)
                      ? 'bg-gradient-to-r ' + PHASE_COLORS[phase] + ' text-white shadow-lg'
                      : 'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">{PHASE_ICONS[phase]}</div>
                  <div>{PHASE_NAMES[phase]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="glass-input px-4 py-3 font-bold w-full md:w-auto"
            >
              <option value="auto">🤖 Auto-Select (Recommended)</option>
              <option value="groq">⚡ Groq (Fast & Free)</option>
              <option value="ollama">🦙 Ollama (Self-Hosted)</option>
              <option value="openai">🧠 OpenAI GPT-4o</option>
              <option value="gemini">💎 Google Gemini</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || selectedPhases.length === 0}
            className={`w-full btn-neon-purple py-6 text-xl font-black uppercase tracking-widest transition-all ${
              (!prompt.trim() || selectedPhases.length === 0)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
            }`}
          >
            🚀 Generate Workflow
          </button>

          {selectedPhases.length === 0 && (
            <p className="text-center text-sm text-amber-400 font-bold">
              ⚠️ Please select at least one phase to generate
            </p>
          )}
        </div>

        {/* Tips */}
        <div className="glass-card p-6 bg-white/5">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
            💡 Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-300 font-medium">
            <li>• Include specific features, target audience, and tech preferences</li>
            <li>• Mention platform (web, mobile, desktop) and any integrations needed</li>
            <li>• Describe unique requirements (security, compliance, scalability)</li>
            <li>• The more detail you provide, the better the AI-generated documentation</li>
          </ul>
        </div>
      </div>
    )
  }

  // Generating/Complete View
  const completedPhases = Object.values(phases).filter(p => p.status === 'completed').length
  const totalPhases = Object.keys(phases).length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="glass-card border-red-500/20 bg-red-500/10 p-6 text-red-300 animate-shake">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-black text-lg">💀 Error</span>
              <p className="mt-2 font-medium">{error}</p>
            </div>
            <button onClick={handleReset} className="btn-neon-purple px-6 py-2">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overall Progress */}
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-4xl font-black text-white mb-2">
              {status === 'complete' ? '🎉 Workflow Complete!' : 'Generating Your Workflow'}
            </h2>
            <p className="text-slate-400 font-medium">
              {status === 'complete'
                ? `Generated ${completedPhases} phases with ${Object.values(phases).reduce((sum, p) => sum + (p.wordCount || 0), 0).toLocaleString()} total words`
                : `Processing ${completedPhases} of ${totalPhases} phases...`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black bg-gradient-to-r from-genz-purple to-genz-cyan bg-clip-text text-transparent">
              {Math.round(overallProgress)}%
            </div>
          </div>
        </div>

        <div className="h-6 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-genz-purple via-genz-pink to-genz-cyan transition-all duration-1000 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {status === 'generating' && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-400">
              ⚡ AI is working hard for you...
            </p>
            <button
              onClick={cancelGeneration}
              className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              ⏹️ Cancel
            </button>
          </div>
        )}

        {status === 'complete' && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleViewWorkflow}
              className="flex-1 btn-neon-purple py-4 text-lg font-black uppercase tracking-widest"
            >
              📄 View Full Workflow
            </button>
            <button
              onClick={handleReset}
              className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-sm transition-all"
            >
              ✨ Create Another
            </button>
          </div>
        )}
      </div>

      {/* Phase Cards */}
      <div className="space-y-6">
        {Object.entries(phases).map(([phaseId, phase]) => (
          <PhaseCard
            key={phaseId}
            phaseId={phaseId}
            phase={phase}
            isActive={currentPhase === phaseId}
          />
        ))}
      </div>
    </div>
  )
}

function PhaseCard({ phaseId, phase, isActive }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusIcons = {
    pending: '⏸️',
    generating: '🔄',
    completed: '✅',
    error: '❌'
  }

  const statusColors = {
    pending: 'bg-white/5',
    generating: 'bg-blue-500/20 ring-2 ring-blue-500/50 animate-pulse',
    completed: 'bg-green-500/20 ring-2 ring-green-500/50',
    error: 'bg-red-500/20 ring-2 ring-red-500/50'
  }

  return (
    <div className={`glass-card transition-all ${statusColors[phase.status]} ${isActive ? 'scale-[1.02]' : ''}`}>
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
            phase.status === 'completed' ? 'bg-gradient-to-r ' + PHASE_COLORS[phaseId] :
            phase.status === 'generating' ? 'bg-blue-500/20 animate-pulse' :
            'bg-white/5'
          }`}>
            {phase.status === 'completed' ? '✅' : PHASE_ICONS[phaseId]}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-black text-white">{PHASE_NAMES[phaseId]}</h3>
              <span className="text-2xl">{statusIcons[phase.status]}</span>
            </div>
            {phase.status === 'completed' && (
              <p className="text-sm text-slate-400 font-bold">
                {phase.wordCount?.toLocaleString()} words • {phase.duration}s generation time
              </p>
            )}
            {phase.status === 'generating' && (
              <p className="text-sm text-blue-400 font-bold animate-pulse">
                Generating... {phase.wordCount?.toLocaleString()} words so far
              </p>
            )}
            {phase.status === 'pending' && (
              <p className="text-sm text-slate-500 font-bold">Waiting to start...</p>
            )}
            {phase.status === 'error' && (
              <p className="text-sm text-red-400 font-bold">Error: {phase.error}</p>
            )}
          </div>
        </div>

        {phase.status === 'generating' && (
          <div className="text-right">
            <div className="text-2xl font-black text-blue-400">{Math.round(phase.progress)}%</div>
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${phase.progress}%` }}
              />
            </div>
          </div>
        )}

        {(phase.status === 'completed' || phase.status === 'generating') && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        )}
      </div>

      {/* Expanded Content Preview */}
      {isExpanded && (phase.status === 'generating' || phase.status === 'completed') && (
        <div className="p-6 bg-black/20 border-t border-white/5 animate-in fade-in slide-in-from-top-4">
          <div className="prose prose-invert max-w-none max-h-96 overflow-y-auto">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-xl">
              {phase.content}
              {phase.status === 'generating' && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1">█</span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
