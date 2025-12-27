import React, { useState } from 'react'
import './App.css'

export default function App() {
  const [workflows, setWorkflows] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createWorkflow = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, steps: [], tags: [] })
    })
    const { workflow } = await res.json()
    setWorkflows([...workflows, workflow])
    setName('')
    setDescription('')
  }

  return (
    <div className="container">
      <h1>MCP Project Manager</h1>
      <form onSubmit={createWorkflow}>
        <input
          type="text"
          placeholder="Workflow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Create Workflow</button>
      </form>
      <div className="workflows">
        {workflows.map((wf) => (
          <div key={wf.id} className="card">
            <h3>{wf.name}</h3>
            <p>{wf.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
