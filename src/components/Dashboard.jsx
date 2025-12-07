import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'

export default function Dashboard() {
  const { contract } = useContract()
  const { isConnected, address } = useWallet()
  const [totalProposals, setTotalProposals] = useState(0)
  const [activeProposals, setActiveProposals] = useState(0)
  const [myVotes, setMyVotes] = useState(0)

  useEffect(() => {
    if (contract && isConnected) {
      loadDashboardData()
    }
  }, [contract, isConnected])

  const loadDashboardData = async () => {
    try {
      const count = await contract.proposalCount()
      setTotalProposals(Number(count))

      // Count active proposals
      let active = 0
      let votes = 0
      const now = Math.floor(Date.now() / 1000)

      for (let i = 0; i < Number(count); i++) {
        const proposal = await contract.getProposal(i)
        if (Number(proposal.endTime) > now && !proposal.executed) {
          active++
        }

        const hasVoted = await contract.hasVoted(i, address)
        if (hasVoted) {
          votes++
        }
      }

      setActiveProposals(active)
      setMyVotes(votes)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  return (
    <div>
      <h2>📊 DAO Dashboard</h2>
      <div className="info-grid">
        <div className="info-item">
          <div>Total Proposals</div>
          <div className="info-value">{totalProposals}</div>
        </div>
        <div className="info-item">
          <div>Active Proposals</div>
          <div className="info-value">{activeProposals}</div>
        </div>
        <div className="info-item">
          <div>My Votes</div>
          <div className="info-value">{myVotes}</div>
        </div>
        <div className="info-item">
          <div>Participation Rate</div>
          <div className="info-value">
            {totalProposals > 0 ? ((myVotes / totalProposals) * 100).toFixed(1) + '%' : '0%'}
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="status info">
          <p>Please connect your wallet to view dashboard data</p>
        </div>
      )}
    </div>
  )
}
