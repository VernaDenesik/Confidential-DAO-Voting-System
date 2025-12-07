import React, { useState } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'

export default function CreateProposal() {
  const { contract, votingPower } = useContract()
  const { isConnected } = useWallet()
  const [description, setDescription] = useState('')
  const [votingPeriod, setVotingPeriod] = useState('86400') // 1 day in seconds
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!contract) {
      setStatus({ type: 'error', message: 'Contract not initialized' })
      return
    }

    if (votingPower < 100) {
      setStatus({ type: 'error', message: 'You need at least 100 voting power to create proposals' })
      return
    }

    if (!description.trim()) {
      setStatus({ type: 'error', message: 'Please enter a proposal description' })
      return
    }

    try {
      setLoading(true)
      setStatus({ type: 'info', message: 'Creating proposal...' })

      const tx = await contract.createProposal(description, votingPeriod)
      setStatus({ type: 'info', message: 'Transaction submitted. Waiting for confirmation...' })

      await tx.wait()

      setStatus({ type: 'success', message: 'Proposal created successfully!' })
      setDescription('')
    } catch (error) {
      console.error('Failed to create proposal:', error)
      setStatus({
        type: 'error',
        message: `Failed to create proposal: ${error.message || 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>➕ Create New Proposal</h2>

      {!isConnected && (
        <div className="status info">
          <p>Please connect your wallet to create proposals</p>
        </div>
      )}

      {isConnected && votingPower < 100 && (
        <div className="status error">
          <p>⚠️ You need at least 100 voting power to create proposals. Current power: {votingPower}</p>
        </div>
      )}

      {isConnected && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Proposal Description</label>
            <textarea
              id="description"
              rows="4"
              placeholder="Describe your proposal in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="votingPeriod">Voting Period (seconds)</label>
            <input
              type="number"
              id="votingPeriod"
              placeholder="86400 (1 day)"
              value={votingPeriod}
              onChange={(e) => setVotingPeriod(e.target.value)}
              min="3600"
              required
            />
            <small style={{ color: 'rgba(255,255,255,0.7)', marginTop: '5px', display: 'block' }}>
              Minimum: 3600 seconds (1 hour), Recommended: 86400 seconds (1 day)
            </small>
          </div>

          <button type="submit" className="btn" disabled={loading || votingPower < 100}>
            {loading ? 'Creating...' : 'Create Proposal'}
          </button>
        </form>
      )}

      {status.message && (
        <div className={`status ${status.type}`} style={{ marginTop: '20px' }}>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}
