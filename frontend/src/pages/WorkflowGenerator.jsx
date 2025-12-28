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

const PHASE_DESCRIPTIONS = {
  brd: 'Define project goals, features & requirements',
  design: 'Create visual specifications & wireframes',
  journey: 'Map user flows & interaction paths',
  testing: 'Generate comprehensive test scenarios'
}

const PHASE_COLORS = {
  brd: 'from-violet-500 via-purple-500 to-violet-600',
  design: 'from-pink-500 via-rose-500 to-pink-600',
  journey: 'from-cyan-500 via-blue-500 to-cyan-600',
  testing: 'from-amber-500 via-yellow-500 to-amber-600'
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
      <div className="max-w-5xl mx-auto space-y-10 animate-slide-in-up">
        {/* Header */}
        <div className="text-center space-y-6 py-8">
          <div className="inline-block mb-4">
            <div className="text-7xl mb-6 animate-float">✨</div>
          </div>
          <h1 className="text-7xl font-bold leading-tight" style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #22D3EE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            What would you like to build?
          </h1>
          <p className="text-2xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Describe your project idea, and watch AI generate comprehensive documentation in real-time
          </p>
        </div>

        {/* Main Input Card */}
        <div className="glass-card p-10 space-y-8 animate-scale-in">
          {/* Project Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Project Description
              </label>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 font-semibold" style={{ color: 'var(--accent-purple)' }}>
                {prompt.length} chars
              </span>
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Build a mobile banking app for millennials with biometric authentication, real-time transaction notifications, bill payment scheduling, budget tracking with AI insights, and peer-to-peer money transfers. The app should work on both iOS and Android with a modern dark theme..."
                className="w-full h-56 glass-input p-6 text-lg resize-none transition-all"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.7'
                }}
                autoFocus
              />
              <div className="absolute bottom-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm" style={{ color: 'var(--text-muted)' }}>
                Be detailed for better results ✨
              </div>
            </div>
          </div>

          {/* Phase Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Select Documentation Phases
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['brd', 'design', 'journey', 'testing'].map(phase => (
                <button
                  key={phase}
                  onClick={() => handlePhaseToggle(phase)}
                  className={`group relative p-6 rounded-2xl font-semibold transition-all duration-300 ${
                    selectedPhases.includes(phase)
                      ? 'bg-gradient-to-r ' + PHASE_COLORS[phase] + ' text-white shadow-xl scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20'
                  }`}
                  style={{
                    color: selectedPhases.includes(phase) ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-4xl transition-transform duration-300 ${selectedPhases.includes(phase) ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {PHASE_ICONS[phase]}
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-lg font-bold mb-1">{PHASE_NAMES[phase]}</div>
                      <div className={`text-sm ${selectedPhases.includes(phase) ? 'text-white/90' : ''}`} style={{ color: selectedPhases.includes(phase) ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
                        {PHASE_DESCRIPTIONS[phase]}
                      </div>
                    </div>
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPhases.includes(phase) ? 'bg-white border-white' : 'border-white/30'
                    }`}>
                      {selectedPhases.includes(phase) && (
                        <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Provider Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              AI Provider
            </label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="glass-input px-5 py-4 font-semibold w-full appearance-none cursor-pointer text-base"
                style={{ paddingRight: '3rem' }}
              >
                <option value="auto">🤖 Auto-Select (Recommended)</option>
                <option value="groq">⚡ Groq - Fastest, Free</option>
                <option value="ollama">🦙 Ollama - Privacy-First, Self-Hosted</option>
                <option value="openai">🧠 OpenAI GPT-4o - Highest Quality</option>
                <option value="gemini">💎 Google Gemini - Balanced Performance</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5" style={{ color: 'var(--accent-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleStart}
              disabled={!prompt.trim() || selectedPhases.length === 0}
              className={`w-full btn-neon-purple py-6 rounded-2xl text-xl font-bold uppercase tracking-wider transition-all duration-300 ${
                (!prompt.trim() || selectedPhases.length === 0)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <span className="flex items-center justify-center gap-3">
                <span className="text-2xl">🚀</span>
                <span>Generate Workflow</span>
              </span>
            </button>

            {selectedPhases.length === 0 && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--accent-amber)' }}>
                  ⚠️ Please select at least one phase to generate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pro Tips Card */}
        <div className="glass-card p-8 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border-violet-500/20">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Pro Tips for Best Results
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-violet-400 mt-1">✓</span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Include <strong>specific features</strong>, target audience, and technical preferences
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-violet-400 mt-1">✓</span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Mention <strong>platform requirements</strong> (web, mobile, desktop, cross-platform)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-violet-400 mt-1">✓</span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Describe <strong>unique needs</strong> (security, compliance, accessibility, scalability)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-violet-400 mt-1">✓</span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Add <strong>context</strong> about integrations, third-party services, or constraints
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Generating/Complete View
  const completedPhases = Object.values(phases).filter(p => p.status === 'completed').length
  const totalPhases = Object.keys(phases).length
  const totalWords = Object.values(phases).reduce((sum, p) => sum + (p.wordCount || 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="glass-card border-red-500/30 bg-red-500/10 p-6 animate-slide-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <span className="font-bold text-lg text-red-300">Something went wrong</span>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            </div>
            <button onClick={handleReset} className="btn-neon-purple px-6 py-3 rounded-xl font-semibold">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Overall Progress Card */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {status === 'complete' ? 'Workflow Complete!' : 'Generating Your Workflow'}
              </h2>
              <span className="text-4xl">{status === 'complete' ? '🎉' : '⚡'}</span>
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {status === 'complete'
                ? `Successfully generated ${completedPhases} phases with ${totalWords.toLocaleString()} total words`
                : `Processing phase ${completedPhases} of ${totalPhases}...`}
            </p>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {Math.round(overallProgress)}%
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-8 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500 transition-all duration-1000 ease-out relative"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white drop-shadow-lg">
              {status === 'generating' ? 'Generating...' : status === 'complete' ? '✓ Done' : 'Starting...'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          {status === 'generating' && (
            <>
              <div className="flex-1 flex items-center gap-3 px-6 py-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold" style={{ color: 'var(--accent-purple)' }}>
                  AI is working hard for you...
                </span>
              </div>
              <button
                onClick={cancelGeneration}
                className="btn-secondary px-8 py-4 rounded-xl font-semibold text-red-400 hover:text-red-300"
              >
                <span className="flex items-center gap-2">
                  <span>⏹️</span>
                  <span>Cancel</span>
                </span>
              </button>
            </>
          )}

          {status === 'complete' && (
            <>
              <button
                onClick={handleViewWorkflow}
                className="flex-1 btn-neon-purple py-5 rounded-2xl text-lg font-bold uppercase tracking-wider"
              >
                <span className="flex items-center justify-center gap-3">
                  <span>📄</span>
                  <span>View Full Workflow</span>
                </span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary px-10 py-5 rounded-2xl font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="flex items-center gap-2">
                  <span>✨</span>
                  <span>Create Another</span>
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phase Cards */}
      <div className="space-y-6">
        {Object.entries(phases).map(([phaseId, phase], index) => (
          <PhaseCard
            key={phaseId}
            phaseId={phaseId}
            phase={phase}
            isActive={currentPhase === phaseId}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

function PhaseCard({ phaseId, phase, isActive, index }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = {
    pending: {
      icon: '⏸️',
      label: 'Waiting to start...',
      color: 'var(--text-muted)',
      bgClass: 'bg-white/5',
      borderClass: 'border-white/10'
    },
    generating: {
      icon: '🔄',
      label: 'Generating...',
      color: 'var(--accent-blue)',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/30 animate-pulse-glow'
    },
    completed: {
      icon: '✅',
      label: 'Complete',
      color: 'var(--accent-green)',
      bgClass: 'bg-green-500/10',
      borderClass: 'border-green-500/30'
    },
    error: {
      icon: '❌',
      label: 'Error',
      color: '#EF4444',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/30'
    }
  }

  const config = statusConfig[phase.status]
  const animationDelay = `${index * 100}ms`

  return (
    <div
      className={`glass-card transition-all duration-500 border-2 ${config.bgClass} ${config.borderClass} ${isActive ? 'scale-[1.01]' : ''}`}
      style={{ animationDelay }}
    >
      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 flex-1">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 ${
            phase.status === 'completed' ? 'bg-gradient-to-r ' + PHASE_COLORS[phaseId] + ' shadow-lg' :
            phase.status === 'generating' ? 'bg-blue-500/20 animate-pulse' :
            'bg-white/5'
          }`}>
            {phase.status === 'completed' ? '✅' : PHASE_ICONS[phaseId]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {PHASE_NAMES[phaseId]}
              </h3>
              <span className="text-2xl flex-shrink-0">{config.icon}</span>
            </div>

            {/* Status-specific info */}
            {phase.status === 'completed' && (
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span style={{ color: 'var(--text-secondary)' }}>
                  {phase.wordCount?.toLocaleString()} words
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {phase.duration}s generation
                </span>
              </div>
            )}

            {phase.status === 'generating' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: config.color }}>
                  {phase.wordCount?.toLocaleString()} words generated...
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ color: config.color }}>
                    {Math.round(phase.progress)}%
                  </span>
                </div>
              </div>
            )}

            {phase.status === 'pending' && (
              <p className="text-sm font-semibold" style={{ color: config.color }}>
                {config.label}
              </p>
            )}

            {phase.status === 'error' && (
              <p className="text-sm font-semibold text-red-400">
                Error: {phase.error}
              </p>
            )}
          </div>
        </div>

        {/* Expand Button */}
        {(phase.status === 'completed' || phase.status === 'generating') && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Content Preview */}
      {isExpanded && (phase.status === 'generating' || phase.status === 'completed') && (
        <div className="border-t border-white/10 p-6 bg-black/30 animate-slide-in-up">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Live Preview
            </h4>
            <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 font-semibold" style={{ color: 'var(--accent-purple)' }}>
              {phase.content?.split(' ').length || 0} words
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed" style={{
                color: 'var(--text-secondary)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }}>
                {phase.content}
                {phase.status === 'generating' && (
                  <span className="typing-cursor inline-block ml-1" style={{ color: 'var(--accent-purple)' }}>█</span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
