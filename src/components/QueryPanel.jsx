import React, { useState } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'

export default function QueryPanel() {
  const { contract } = useContract()
  const { isConnected } = useWallet()
  const [proposalId, setProposalId] = useState('')
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleQuery = async () => {
    if (!contract) {
      setError('Contract not initialized')
      return
    }

    if (!proposalId) {
      setError('Please enter a proposal ID')
      return
    }

    try {
      setLoading(true)
      setError('')
      setProposal(null)

      const proposalData = await contract.getProposal(proposalId)

      setProposal({
        id: proposalId,
        description: proposalData.description,
        startTime: Number(proposalData.startTime),
        endTime: Number(proposalData.endTime),
        yesVotes: Number(proposalData.yesVotes),
        noVotes: Number(proposalData.noVotes),
        executed: proposalData.executed,
        proposer: proposalData.proposer
      })
    } catch (err) {
      console.error('Failed to query proposal:', err)
      setError(`Failed to query proposal: ${err.message || 'Proposal not found'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getStatus = () => {
    if (!proposal) return ''
    const now = Math.floor(Date.now() / 1000)
    if (proposal.executed) return '✅ Executed'
    if (now > proposal.endTime) return '⏸️ Ended'
    if (now < proposal.startTime) return '⏳ Pending'
    return '🔴 Active'
  }

  const getTotalVotes = () => {
    if (!proposal) return 0
    return proposal.yesVotes + proposal.noVotes
  }

  const getYesPercentage = () => {
    const total = getTotalVotes()
    if (total === 0) return 0
    return ((proposal.yesVotes / total) * 100).toFixed(1)
  }

  const getNoPercentage = () => {
    const total = getTotalVotes()
    if (total === 0) return 0
    return ((proposal.noVotes / total) * 100).toFixed(1)
  }

  return (
    <div>
      <h2>🔍 Query Proposal</h2>

      {!isConnected && (
        <div className="status info">
          <p>Please connect your wallet to query proposals</p>
        </div>
      )}

      {isConnected && (
        <>
          <div className="form-group">
            <label htmlFor="queryProposalId">Proposal ID</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                id="queryProposalId"
                placeholder="Enter proposal ID"
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
                min="0"
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={handleQuery} disabled={loading}>
                {loading ? 'Querying...' : 'Query'}
              </button>
            </div>
          </div>

          {error && (
            <div className="status error">
              <p>{error}</p>
            </div>
          )}

          {proposal && (
            <div className="proposal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3>Proposal #{proposal.id}</h3>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  whiteSpace: 'nowrap'
                }}>
                  {getStatus()}
                </span>
              </div>

              <p style={{ margin: '15px 0' }}>{proposal.description}</p>

              <div className="info-grid">
                <div className="info-item">
                  <div>Yes Votes</div>
                  <div className="info-value">{proposal.yesVotes} ({getYesPercentage()}%)</div>
                </div>
                <div className="info-item">
                  <div>No Votes</div>
                  <div className="info-value">{proposal.noVotes} ({getNoPercentage()}%)</div>
                </div>
                <div className="info-item">
                  <div>Total Votes</div>
                  <div className="info-value">{getTotalVotes()}</div>
                </div>
                <div className="info-item">
                  <div>Executed</div>
                  <div className="info-value">{proposal.executed ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="info-grid" style={{ marginTop: '15px' }}>
                <div className="info-item">
                  <div>Proposer</div>
                  <div className="info-value" style={{ fontSize: '0.8em' }}>
                    {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                  </div>
                </div>
                <div className="info-item">
                  <div>Start Time</div>
                  <div className="info-value" style={{ fontSize: '0.8em' }}>
                    {formatDate(proposal.startTime)}
                  </div>
                </div>
                <div className="info-item">
                  <div>End Time</div>
                  <div className="info-value" style={{ fontSize: '0.8em' }}>
                    {formatDate(proposal.endTime)}
                  </div>
                </div>
              </div>

              {/* Vote results visualization */}
              {getTotalVotes() > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', height: '30px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${getYesPercentage()}%`,
                        background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {getYesPercentage()}%
                    </div>
                    <div
                      style={{
                        width: `${getNoPercentage()}%`,
                        background: 'linear-gradient(45deg, #f44336, #da190b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {getNoPercentage()}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
