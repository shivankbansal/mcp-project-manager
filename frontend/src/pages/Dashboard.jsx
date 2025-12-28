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
  const [quickPrompt, setQuickPrompt] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL ?? ''

  useEffect(() => {
    console.info('[devtrifecta] boot Dashboard', { API_URL })
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/workflows`)
      const workflowsData = Array.isArray(response.data) ? response.data : []
      setWorkflows(workflowsData)
    } catch (err) {
      console.error('[devtrifecta] Error fetching workflows:', err)
      setError('Failed to load workflows')
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkflow = (templateId) => {
    navigate('/builder', { state: { templateId } })
  }

  const handleQuickStart = async () => {
    if (!quickPrompt.trim()) return
    try {
      setQuickLoading(true)
      setError(null)
      const response = await axios.post(`${API_URL}/api/workflows/quickstart`, { prompt: quickPrompt.trim() })
      const wf = response.data
      setQuickPrompt('')
      navigate(`/workflow/${wf._id || wf.id}`)
    } catch (err) {
      console.error('[devtrifecta] Quickstart failed:', err)
      setError('Failed to create workflow from prompt')
    } finally {
      setQuickLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] p-12 bg-gradient-to-br from-genz-purple via-purple-600 to-genz-pink shadow-2xl shadow-purple-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-black uppercase tracking-widest mb-6">
            ✨ AI-Powered Magic
          </span>
          <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none mb-6">
            Ship your ideas <br />
            <span className="text-genz-yellow">faster than ever.</span>
          </h2>
          <p className="text-xl text-purple-100 font-medium mb-8 leading-relaxed">
            From zero to BRD, Design, and Test Cases in seconds. Stop wasting time on docs, start building.
          </p>
        </div>
      </div>

      {/* Quick Start Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-item bg-gradient-to-br from-slate-800 to-slate-900 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-genz-cyan/20 rounded-xl flex items-center justify-center text-genz-cyan text-xl">🚀</div>
            <h3 className="text-2xl font-black tracking-tight text-white">Quick Launch</h3>
          </div>
          <div className="space-y-4">
            <textarea
              className="w-full h-32 glass-input p-4 text-lg font-medium placeholder:text-slate-500 resize-none"
              placeholder="What are we building today? (e.g. 'A Tinder for finding coding partners')"
              value={quickPrompt}
              onChange={e => setQuickPrompt(e.target.value)}
            />
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400 font-medium">
                AI will handle the boring stuff. You handle the vision.
              </p>
              <button 
                onClick={handleQuickStart} 
                disabled={quickLoading || !quickPrompt.trim()} 
                className={`btn-neon-purple px-8 py-3 text-white rounded-2xl font-black uppercase tracking-wider text-sm whitespace-nowrap ${quickLoading || !quickPrompt.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {quickLoading ? 'Cooking...' : 'Generate ✨'}
              </button>
            </div>
          </div>
        </div>

        <div className="bento-item bg-gradient-to-br from-genz-pink/10 to-transparent border-genz-pink/20 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-genz-pink/20 rounded-2xl flex items-center justify-center text-genz-pink text-2xl mb-6">🔥</div>
            <h3 className="text-2xl font-black tracking-tight text-white mb-2">Templates</h3>
            <p className="text-slate-400 font-medium">Don't know where to start? We gotchu.</p>
          </div>
          <button 
            onClick={() => navigate('/builder')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all"
          >
            Browse All Templates →
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-tighter text-white">Starter Packs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bento-item group cursor-pointer"
              onClick={() => handleStartWorkflow(template.id)}
            >
              <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 origin-left">{template.icon}</div>
              <h4 className="text-xl font-black text-white mb-2 tracking-tight">{template.name}</h4>
              <p className="text-slate-400 text-sm font-medium mb-6 line-clamp-2">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.phases.slice(0, 3).map((phase) => (
                  <span key={phase} className="text-[10px] px-2 py-1 bg-white/5 rounded-md text-slate-300 font-bold uppercase tracking-widest">
                    {phase}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Workflows */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-tighter text-white">Your Projects</h3>
          <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-400 text-xs font-bold">{workflows.length} Total</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 glass-card animate-pulse bg-white/5"></div>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-2 border-white/10">
            <p className="text-slate-400 font-bold text-xl mb-6">No projects yet. L + Ratio.</p>
            <button onClick={() => navigate('/builder')} className="btn-neon-purple px-8 py-3 text-white rounded-2xl font-black uppercase tracking-wider">
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow._id || workflow.id}
                className="bento-item flex items-center justify-between group cursor-pointer"
                onClick={() => navigate(`/workflow/${workflow._id || workflow.id}`)}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform">
                    {workflow.phases?.[0] === 'brd' ? '📋' : '🚀'}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight group-hover:text-genz-purple transition-colors">{workflow.name}</h4>
                    <p className="text-slate-400 text-sm font-medium line-clamp-1">{workflow.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-genz-cyan">{workflow.status || 'draft'}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
