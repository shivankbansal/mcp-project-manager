import React from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard'
import WorkflowBuilder from './pages/WorkflowBuilder'
import WorkflowDetails from './pages/WorkflowDetails'

function Layout({ children }) {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <nav className="sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass-card px-6 py-3 flex items-center justify-between border-white/5">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-genz-purple to-genz-pink rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl">DT</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              dev<span className="text-transparent bg-clip-text bg-gradient-to-r from-genz-purple to-genz-pink">trifecta</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/builder')}
              className="btn-neon-purple px-6 py-2.5 text-white rounded-xl font-bold text-sm uppercase tracking-wider"
            >
              + New Project
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/builder"
          element={
            <Layout>
              <WorkflowBuilder />
            </Layout>
          }
        />
        <Route
          path="/workflow/:id"
          element={
            <Layout>
              <WorkflowDetails />
            </Layout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
