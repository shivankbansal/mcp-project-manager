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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Phase Selector */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Create Workflow</h2>
        
        {/* Progress Bar */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">
              Phase {currentPhase + 1} of {initialPhases.length}
            </span>
            <span className="text-sm text-slate-300">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-slate-600/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {initialPhases.map((idx, tabIdx) => (
            <button
              key={WORKFLOW_PHASES[idx].id}
              onClick={() => setCurrentPhase(tabIdx)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                currentPhase === tabIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70'
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
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phase Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            <span className="mr-3">{activePhase.icon}</span>
            {activePhase.title}
          </h3>
          <p className="text-slate-300">{activePhase.description}</p>
        </div>

        {/* Phase Fields */}
        <div className="space-y-5 bg-slate-700/30 border border-slate-600/50 rounded-lg p-6">
          {activePhase.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-white mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="form-textarea"
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type}
                  className="form-input"
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPhase === 0}
            className={`btn-secondary ${currentPhase === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ← Previous
          </button>

          {currentPhase < initialPhases.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={`btn-success ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Workflow'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
