import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const WORKFLOW_PHASES = [
  {
    id: 'brd',
    title: 'Business Requirements',
    icon: '📋',
    description: 'Define project scope, requirements, and objectives',
    fields: [
      { name: 'projectName', label: 'Project Name', type: 'text', required: true },
      { name: 'projectDescription', label: 'Project Description', type: 'textarea', required: true },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Enterprise users, Mobile app users' },
      { name: 'mainFeatures', label: 'Main Features', type: 'textarea', placeholder: 'List key features separated by newlines' },
      { name: 'timeline', label: 'Timeline', type: 'text', placeholder: 'e.g., 3 months' },
      { name: 'budget', label: 'Budget Range', type: 'text', placeholder: 'e.g., $50k-100k' },
    ]
  },
  {
    id: 'design',
    title: 'Design & Wireframes',
    icon: '🎨',
    description: 'Create UI/UX design and wireframe specifications',
    fields: [
      { name: 'designStyle', label: 'Design Style', type: 'text', placeholder: 'e.g., Modern, Minimalist, Bold' },
      { name: 'colorScheme', label: 'Color Scheme', type: 'text', placeholder: 'e.g., Blue and white, Dark mode' },
      { name: 'mainPages', label: 'Main Pages/Screens', type: 'textarea', placeholder: 'List key pages or screens' },
      { name: 'wireframeNotes', label: 'Wireframe Notes', type: 'textarea', placeholder: 'Specific wireframe requirements' },
      { name: 'accessibility', label: 'Accessibility Requirements', type: 'text', placeholder: 'e.g., WCAG 2.1 AA compliance' },
    ]
  },
  {
    id: 'journey',
    title: 'User Journey & Workflows',
    icon: '🚶',
    description: 'Define user flows and interaction patterns',
    fields: [
      { name: 'userPersonas', label: 'User Personas', type: 'textarea', placeholder: 'Describe different user types and roles' },
      { name: 'userFlows', label: 'Key User Flows', type: 'textarea', placeholder: 'Main user journeys through the application' },
      { name: 'painPoints', label: 'User Pain Points', type: 'textarea', placeholder: 'Problems the application solves' },
      { name: 'successMetrics', label: 'Success Metrics', type: 'textarea', placeholder: 'How to measure user satisfaction' },
    ]
  },
  {
    id: 'testing',
    title: 'Test Cases & QA',
    icon: '✅',
    description: 'Define comprehensive test scenarios and coverage',
    fields: [
      { name: 'testTypes', label: 'Test Types', type: 'text', placeholder: 'e.g., Unit, Integration, E2E, Performance' },
      { name: 'criticalPaths', label: 'Critical User Paths', type: 'textarea', placeholder: 'Must-test user workflows' },
      { name: 'edgeCases', label: 'Edge Cases', type: 'textarea', placeholder: 'Unusual scenarios to test' },
      { name: 'performanceTargets', label: 'Performance Targets', type: 'text', placeholder: 'e.g., Page load < 2s, 99.9% uptime' },
      { name: 'browserSupport', label: 'Browser/Device Support', type: 'text', placeholder: 'e.g., Chrome, Firefox, Safari, Mobile' },
    ]
  }
]

export default function WorkflowBuilder() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentPhase, setCurrentPhase] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL ?? ''

  // Initialize form data with template selection
  const templateId = location.state?.templateId
  const initialPhases = templateId === 'requirements-design' 
    ? [0, 1]
    : templateId === 'test-coverage'
    ? [2, 3]
    : templateId === 'documentation'
    ? [0]
    : [0, 1, 2, 3]

  const [formData, setFormData] = useState(
    initialPhases.reduce((acc, idx) => {
      const phase = WORKFLOW_PHASES[idx]
      phase.fields.forEach(field => {
        acc[field.name] = ''
      })
      return acc
    }, {})
  )

  const activePhase = WORKFLOW_PHASES[currentPhase]

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleNext = () => {
    if (currentPhase < initialPhases.length - 1) {
      setCurrentPhase(currentPhase + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrev = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const workflowPayload = {
        name: formData.projectName || 'Untitled Workflow',
        description: formData.projectDescription || 'No description',
        phases: initialPhases.map(idx => WORKFLOW_PHASES[idx].id),
        formData: formData,
        steps: initialPhases.map((idx, stepIdx) => ({
          id: `step-${idx}`,
          phase: WORKFLOW_PHASES[idx].id,
          title: WORKFLOW_PHASES[idx].title,
          status: 'pending',
          order: stepIdx
        })),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const response = await axios.post(`${API_URL}/api/workflows`, workflowPayload)
      const workflowId = response.data._id || response.data.id
      
      // Navigate to workflow details
      navigate(`/workflow/${workflowId}`)
    } catch (err) {
      console.error('Error creating workflow:', err)
      setError('Failed to create workflow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const phaseIndex = initialPhases[currentPhase]
  const progress = ((currentPhase + 1) / initialPhases.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 glass-card flex items-center justify-center text-slate-400 hover:text-white transition-all">
            ←
          </button>
          <h2 className="text-4xl font-black text-white tracking-tighter">Manifest Project</h2>
        </div>
        
        {/* Progress Bento */}
        <div className="bento-item bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Current Phase</p>
              <p className="text-xl font-black text-white">
                {WORKFLOW_PHASES[phaseIndex].icon} {WORKFLOW_PHASES[phaseIndex].title}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Progress</p>
              <p className="text-xl font-black text-genz-purple">{Math.round(progress)}%</p>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-genz-purple to-genz-pink h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {initialPhases.map((idx, tabIdx) => (
            <button
              key={WORKFLOW_PHASES[idx].id}
              onClick={() => setCurrentPhase(tabIdx)}
              className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] whitespace-nowrap transition-all ${
                currentPhase === tabIdx
                  ? 'bg-genz-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              <span className="mr-2">{WORKFLOW_PHASES[idx].icon}</span>
              {WORKFLOW_PHASES[idx].title}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card border-red-500/20 bg-red-500/10 p-4 text-red-300 font-bold animate-shake">
          💀 {error}
        </div>
      )}

      {/* Form Bento */}
      <div className="bento-item bg-slate-900/50">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            {WORKFLOW_PHASES[phaseIndex].title}
          </h3>
          <p className="text-slate-400 font-medium">{WORKFLOW_PHASES[phaseIndex].description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WORKFLOW_PHASES[phaseIndex].fields.map((field) => (
              <div key={field.name} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {field.label} {field.required && <span className="text-genz-pink">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="glass-input w-full p-4 min-h-[120px] font-medium"
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="glass-input w-full p-4 font-medium"
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPhase === 0}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                currentPhase === 0 ? 'opacity-0 pointer-events-none' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              ← Back
            </button>
            
            {currentPhase === initialPhases.length - 1 ? (
              <button
                type="submit"
                disabled={loading}
                className="btn-neon-purple px-12 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                {loading ? 'Manifesting...' : 'Launch Project 🚀'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="btn-neon-purple px-12 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Next Phase →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
