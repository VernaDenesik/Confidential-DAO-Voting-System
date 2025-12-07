import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { FhevmClient } from 'fhevm-sdk'
import { useWallet } from './useWallet'

const ContractContext = createContext()

// Contract ABI - minimal for DAO voting
const CONTRACT_ABI = [
  "function createProposal(string description, uint256 votingPeriod) external",
  "function commitVote(uint256 proposalId, bytes32 commitment) external",
  "function revealVote(uint256 proposalId, bool support, bytes32 nonce) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (tuple(string description, uint256 startTime, uint256 endTime, uint256 yesVotes, uint256 noVotes, bool executed, address proposer))",
  "function proposalCount() external view returns (uint256)",
  "function votingPower(address) external view returns (uint256)",
  "function hasVoted(uint256, address) external view returns (bool)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)",
  "event VoteCommitted(uint256 indexed proposalId, address indexed voter)",
  "event VoteRevealed(uint256 indexed proposalId, address indexed voter, bool support)"
]

const CONTRACT_ADDRESS = '0x08C09eC71Fe5CF02ce7E9bcfCBC406e052EA0248'

export function ContractProvider({ children }) {
  const { provider, signer, address, isConnected } = useWallet()
  const [contract, setContract] = useState(null)
  const [fhevmClient, setFhevmClient] = useState(null)
  const [votingPower, setVotingPower] = useState(0)

  useEffect(() => {
    if (signer && isConnected) {
      const daoContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      setContract(daoContract)

      // Initialize FHEVM client
      initFhevm()

      // Load voting power
      loadVotingPower(daoContract)
    }
  }, [signer, isConnected, address])

  const initFhevm = async () => {
    try {
      const client = new FhevmClient({
        provider,
        signer,
        contractAddress: CONTRACT_ADDRESS
      })
      await client.init()
      setFhevmClient(client)
    } catch (error) {
      console.error('Failed to initialize FHEVM:', error)
    }
  }

  const loadVotingPower = async (daoContract) => {
    try {
      if (address) {
        const power = await daoContract.votingPower(address)
        setVotingPower(Number(power))
      }
    } catch (error) {
      console.error('Failed to load voting power:', error)
    }
  }

  return (
    <ContractContext.Provider
      value={{
        contract,
        fhevmClient,
        votingPower,
        contractAddress: CONTRACT_ADDRESS
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}

export function useContract() {
  const context = useContext(ContractContext)
  if (!context) {
    throw new Error('useContract must be used within ContractProvider')
  }
  return context
}
