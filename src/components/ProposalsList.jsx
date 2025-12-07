import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'

export default function ProposalsList() {
  const { contract } = useContract()
  const { isConnected } = useWallet()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (contract && isConnected) {
      loadProposals()
    }
  }, [contract, isConnected])

  const loadProposals = async () => {
    try {
      setLoading(true)
      const count = await contract.proposalCount()
      const proposalsData = []

      for (let i = 0; i < Number(count); i++) {
        const proposal = await contract.getProposal(i)
        proposalsData.push({
          id: i,
          description: proposal.description,
          startTime: Number(proposal.startTime),
          endTime: Number(proposal.endTime),
          yesVotes: Number(proposal.yesVotes),
          noVotes: Number(proposal.noVotes),
          executed: proposal.executed,
          proposer: proposal.proposer
        })
      }

      setProposals(proposalsData.reverse())
    } catch (error) {
      console.error('Failed to load proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (proposal) => {
    const now = Math.floor(Date.now() / 1000)
    if (proposal.executed) return '✅ Executed'
    if (now > proposal.endTime) return '⏸️ Ended'
    if (now < proposal.startTime) return '⏳ Pending'
    return '🔴 Active'
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div>
      <h2>📋 All Proposals</h2>

      {loading && <div className="status info">Loading proposals...</div>}

      {!loading && proposals.length === 0 && (
        <div className="status info">
          <p>No proposals found. Create the first one!</p>
        </div>
      )}

      {!loading && proposals.map((proposal) => (
        <div key={proposal.id} className="proposal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3>Proposal #{proposal.id}</h3>
              <p style={{ margin: '10px 0' }}>{proposal.description}</p>
            </div>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 10px',
              borderRadius: '5px',
              whiteSpace: 'nowrap'
            }}>
              {getStatus(proposal)}
            </span>
          </div>

          <div className="info-grid" style={{ marginTop: '15px' }}>
            <div className="info-item">
              <div>Yes Votes</div>
              <div className="info-value">{proposal.yesVotes}</div>
            </div>
            <div className="info-item">
              <div>No Votes</div>
              <div className="info-value">{proposal.noVotes}</div>
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
        </div>
      ))}

      {!isConnected && (
        <div className="status info">
          <p>Please connect your wallet to view proposals</p>
        </div>
      )}
    </div>
  )
}
