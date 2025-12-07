import React, { useState } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { ethers } from 'ethers'

export default function VotePanel() {
  const { contract, fhevmClient } = useContract()
  const { isConnected } = useWallet()
  const [proposalId, setProposalId] = useState('')
  const [voteChoice, setVoteChoice] = useState(null)
  const [nonce, setNonce] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('commit') // 'commit' or 'reveal'

  const generateNonce = () => {
    const randomNonce = ethers.hexlify(ethers.randomBytes(32))
    setNonce(randomNonce)
    return randomNonce
  }

  const handleCommitVote = async (support) => {
    if (!contract) {
      setStatus({ type: 'error', message: 'Contract not initialized' })
      return
    }

    if (!proposalId) {
      setStatus({ type: 'error', message: 'Please enter a proposal ID' })
      return
    }

    try {
      setLoading(true)
      setStatus({ type: 'info', message: 'Committing vote...' })

      // Generate nonce if not exists
      const voteNonce = nonce || generateNonce()

      // Create commitment: hash(support, nonce)
      const commitment = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bool', 'bytes32'],
          [support, voteNonce]
        )
      )

      const tx = await contract.commitVote(proposalId, commitment)
      setStatus({ type: 'info', message: 'Transaction submitted. Waiting for confirmation...' })

      await tx.wait()

      setVoteChoice(support)
      setStatus({
        type: 'success',
        message: `Vote committed successfully! Save your nonce: ${voteNonce}. You'll need it to reveal your vote.`
      })
    } catch (error) {
      console.error('Failed to commit vote:', error)
      setStatus({
        type: 'error',
        message: `Failed to commit vote: ${error.message || 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevealVote = async () => {
    if (!contract) {
      setStatus({ type: 'error', message: 'Contract not initialized' })
      return
    }

    if (!proposalId || !nonce || voteChoice === null) {
      setStatus({ type: 'error', message: 'Please provide all required information' })
      return
    }

    try {
      setLoading(true)
      setStatus({ type: 'info', message: 'Revealing vote...' })

      const tx = await contract.revealVote(proposalId, voteChoice, nonce)
      setStatus({ type: 'info', message: 'Transaction submitted. Waiting for confirmation...' })

      await tx.wait()

      setStatus({ type: 'success', message: 'Vote revealed successfully!' })

      // Reset form
      setProposalId('')
      setVoteChoice(null)
      setNonce('')
    } catch (error) {
      console.error('Failed to reveal vote:', error)
      setStatus({
        type: 'error',
        message: `Failed to reveal vote: ${error.message || 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>🗳️ Vote on Proposal</h2>

      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`tab ${phase === 'commit' ? 'active' : ''}`}
          onClick={() => setPhase('commit')}
        >
          Commit Vote
        </button>
        <button
          className={`tab ${phase === 'reveal' ? 'active' : ''}`}
          onClick={() => setPhase('reveal')}
        >
          Reveal Vote
        </button>
      </div>

      {!isConnected && (
        <div className="status info">
          <p>Please connect your wallet to vote</p>
        </div>
      )}

      {isConnected && phase === 'commit' && (
        <div>
          <div className="form-group">
            <label htmlFor="proposalId">Proposal ID</label>
            <input
              type="number"
              id="proposalId"
              placeholder="Enter proposal ID"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Your Vote</label>
            <div className="vote-buttons">
              <button
                className="btn btn-yes"
                onClick={() => handleCommitVote(true)}
                disabled={loading}
              >
                👍 Vote Yes
              </button>
              <button
                className="btn btn-no"
                onClick={() => handleCommitVote(false)}
                disabled={loading}
              >
                👎 Vote No
              </button>
            </div>
          </div>

          <div className="status info">
            <p><strong>Note:</strong> Your vote will be hidden until you reveal it after the voting period ends. Save the nonce that will be generated!</p>
          </div>
        </div>
      )}

      {isConnected && phase === 'reveal' && (
        <div>
          <div className="form-group">
            <label htmlFor="revealProposalId">Proposal ID</label>
            <input
              type="number"
              id="revealProposalId"
              placeholder="Enter proposal ID"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nonce">Nonce (from commit phase)</label>
            <input
              type="text"
              id="nonce"
              placeholder="0x..."
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Your Original Vote</label>
            <div className="vote-buttons">
              <button
                className={`btn ${voteChoice === true ? 'btn-yes' : ''}`}
                onClick={() => setVoteChoice(true)}
                style={{ opacity: voteChoice === true ? 1 : 0.5 }}
              >
                👍 Yes
              </button>
              <button
                className={`btn ${voteChoice === false ? 'btn-no' : ''}`}
                onClick={() => setVoteChoice(false)}
                style={{ opacity: voteChoice === false ? 1 : 0.5 }}
              >
                👎 No
              </button>
            </div>
          </div>

          <button className="btn" onClick={handleRevealVote} disabled={loading}>
            {loading ? 'Revealing...' : 'Reveal Vote'}
          </button>

          <div className="status info">
            <p><strong>Important:</strong> You must reveal your vote with the same choice and nonce you used during the commit phase.</p>
          </div>
        </div>
      )}

      {status.message && (
        <div className={`status ${status.type}`} style={{ marginTop: '20px' }}>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}
