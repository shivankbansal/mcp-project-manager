import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const WORKFLOW_TEMPLATES = [
  {
    id: 'full-lifecycle',
    name: 'Full Project Lifecycle',
    description: 'Complete workflow from BRD to testing and deployment',
    phases: ['BRD', 'Design', 'User Journey', 'Test Cases'],
    icon: '🚀'
  },
  {
    id: 'requirements-design',
    name: 'Requirements to Design',
    description: 'Focus on BRD and UI/UX design with wireframes',
    phases: ['BRD', 'Design', 'Wireframes'],
    icon: '🎨'
  },
  {
    id: 'test-coverage',
    name: 'Test Coverage',
    description: 'Generate comprehensive test cases and user journeys',
    phases: ['User Journey', 'Test Cases', 'Coverage Analysis'],
    icon: '✅'
  },
  {
    id: 'documentation',
    name: 'Documentation & Specs',
    description: 'Create detailed technical specifications and docs',
    phases: ['BRD', 'Technical Specs', 'API Design'],
    icon: '📚'
  }
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/workflows`)
      setWorkflows(response.data || [])
    } catch (err) {
      console.error('Error fetching workflows:', err)
      setError('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkflow = (templateId) => {
    navigate('/builder', { state: { templateId } })
  }

  const handleWorkflowClick = (workflowId) => {
    navigate(`/workflow/${workflowId}`)
  }

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome to MCP Project Manager</h2>
        <p className="text-blue-100">
          Streamline your project workflow from requirements through design, wireframing, user journeys, and comprehensive testing.
        </p>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Start with a Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOW_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg p-6 hover:bg-slate-600/70 hover:border-slate-500 transition-all cursor-pointer card-hover"
              onClick={() => handleStartWorkflow(template.id)}
            >
              <div className="text-4xl mb-3">{template.icon}</div>
              <h4 className="text-lg font-bold text-white mb-2">{template.name}</h4>
              <p className="text-slate-300 text-sm mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.phases.map((phase) => (
                  <span
                    key={phase}
                    className={`text-xs px-2 py-1 rounded-full font-semibold badge-status ${
                      phase === 'BRD'
                        ? 'badge-brd'
                        : phase === 'Design'
                        ? 'badge-design'
                        : phase === 'Test Cases'
                        ? 'badge-testing'
                        : 'badge-journey'
                    }`}
                  >
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workflows Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Recent Workflows</h3>
          {workflows.length > 0 && (
            <span className="text-slate-400 text-sm">{workflows.length} workflows</span>
          )}
        </div>

        {loading ? (
          <div className="bg-slate-700/30 rounded-lg p-8 text-center">
            <p className="text-slate-300">Loading workflows...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-slate-700/30 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">No workflows yet. Create your first workflow!</p>
            <button
              onClick={() => navigate('/builder')}
              className="btn-primary"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow._id || workflow.id}
                className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg p-6 hover:bg-slate-600/70 transition-all cursor-pointer"
                onClick={() => handleWorkflowClick(workflow._id || workflow.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-bold text-white flex-1">{workflow.name}</h4>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {workflow.steps?.length || 0} steps
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-4">{workflow.description}</p>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                  <span>Status: {workflow.status || 'draft'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-400 mb-1">{workflows.length}</div>
          <p className="text-slate-300 text-sm">Total Workflows</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="text-3xl font-bold text-green-400 mb-1">
            {workflows.filter(w => w.status === 'completed').length}
          </div>
          <p className="text-slate-300 text-sm">Completed</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {workflows.filter(w => w.status === 'in-progress').length}
          </div>
          <p className="text-slate-300 text-sm">In Progress</p>
        </div>
      </div>
    </div>
  )
}
