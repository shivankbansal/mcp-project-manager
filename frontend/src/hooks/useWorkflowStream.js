import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

/**
 * Custom hook for real-time workflow generation using Server-Sent Events (SSE)
 */
export function useWorkflowStream() {
  const [status, setStatus] = useState('idle') // idle, connecting, generating, complete, error
  const [currentPhase, setCurrentPhase] = useState(null)
  const [phases, setPhases] = useState({
    brd: { status: 'pending', content: '', progress: 0, wordCount: 0 },
    design: { status: 'pending', content: '', progress: 0, wordCount: 0 },
    journey: { status: 'pending', content: '', progress: 0, wordCount: 0 },
    testing: { status: 'pending', content: '', progress: 0, wordCount: 0 }
  })
  const [workflowId, setWorkflowId] = useState(null)
  const [error, setError] = useState(null)
  const [overallProgress, setOverallProgress] = useState(0)

  const eventSourceRef = useRef(null)
  const abortControllerRef = useRef(null)

  const startGeneration = useCallback(async (prompt, options = {}) => {
    const { provider = 'auto', selectedPhases = null } = options

    // Reset state
    setStatus('connecting')
    setError(null)
    setCurrentPhase(null)
    setWorkflowId(null)
    setOverallProgress(0)

    // Reset phases
    const phasesToGenerate = selectedPhases || ['brd', 'design', 'journey', 'testing']
    const initialPhases = {}
    phasesToGenerate.forEach(phase => {
      initialPhases[phase] = { status: 'pending', content: '', progress: 0, wordCount: 0 }
    })
    setPhases(initialPhases)

    try {
      // Create abort controller for fetch
      abortControllerRef.current = new AbortController()

      // Make POST request to start streaming
      const response = await fetch(`${API_URL}/api/workflows/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          provider,
          phases: selectedPhases
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported')
      }

      setStatus('generating')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.slice(6).trim()
            continue
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5))
              handleSSEEvent(data, eventType || 'message')
            } catch (e) {
              console.warn('[SSE] Failed to parse data:', e)
            }
          }
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[SSE] Generation cancelled by user')
        setStatus('idle')
      } else {
        console.error('[SSE] Error:', err)
        setError(err.message || 'Failed to generate workflow')
        setStatus('error')
      }
    }
  }, [])

  const handleSSEEvent = useCallback((data, event) => {
    console.log('[SSE Event]', event, data)

    switch (event) {
      case 'workflow_start':
        setStatus('generating')
        break

      case 'phase_start':
        setCurrentPhase(data.phase)
        setPhases(prev => ({
          ...prev,
          [data.phase]: {
            ...prev[data.phase],
            status: 'generating',
            progress: 0
          }
        }))
        break

      case 'content_chunk':
        setPhases(prev => {
          const phaseData = prev[data.phase] || {}
          const newContent = (phaseData.content || '') + data.chunk
          const progress = Math.min((data.wordCount / 3500) * 100, 99)

          return {
            ...prev,
            [data.phase]: {
              ...phaseData,
              content: newContent,
              wordCount: data.wordCount,
              progress,
              metadata: data.metadata
            }
          }
        })
        break

      case 'phase_complete':
        setPhases(prev => ({
          ...prev,
          [data.phase]: {
            ...prev[data.phase],
            status: 'completed',
            progress: 100,
            wordCount: data.wordCount,
            duration: data.duration
          }
        }))

        // Update overall progress
        setPhases(currentPhases => {
          const totalPhases = Object.keys(currentPhases).length
          const completedPhases = Object.values(currentPhases).filter(
            p => p.status === 'completed'
          ).length
          setOverallProgress((completedPhases / totalPhases) * 100)
          return currentPhases
        })
        break

      case 'phase_error':
        setPhases(prev => ({
          ...prev,
          [data.phase]: {
            ...prev[data.phase],
            status: 'error',
            error: data.error
          }
        }))
        break

      case 'workflow_complete':
        setWorkflowId(data.workflowId)
        setStatus('complete')
        setOverallProgress(100)
        setCurrentPhase(null)
        break

      case 'error':
        setError(data.message)
        setStatus('error')
        break

      default:
        console.log('[SSE] Unknown event:', event, data)
    }
  }, [])

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setStatus('idle')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setCurrentPhase(null)
    setPhases({
      brd: { status: 'pending', content: '', progress: 0, wordCount: 0 },
      design: { status: 'pending', content: '', progress: 0, wordCount: 0 },
      journey: { status: 'pending', content: '', progress: 0, wordCount: 0 },
      testing: { status: 'pending', content: '', progress: 0, wordCount: 0 }
    })
    setWorkflowId(null)
    setError(null)
    setOverallProgress(0)
  }, [])

  return {
    status,
    currentPhase,
    phases,
    workflowId,
    error,
    overallProgress,
    startGeneration,
    cancelGeneration,
    reset
  }
}
