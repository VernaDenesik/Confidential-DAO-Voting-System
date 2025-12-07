import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import WalletConnect from './components/WalletConnect'
import Dashboard from './components/Dashboard'
import ProposalsList from './components/ProposalsList'
import CreateProposal from './components/CreateProposal'
import VotePanel from './components/VotePanel'
import QueryPanel from './components/QueryPanel'
import { WalletProvider } from './hooks/useWallet'
import { ContractProvider } from './hooks/useContract'
import './styles/App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', component: Dashboard },
    { id: 'proposals', label: '📋 Proposals', component: ProposalsList },
    { id: 'create', label: '➕ Create', component: CreateProposal },
    { id: 'vote', label: '🗳️ Vote', component: VotePanel },
    { id: 'query', label: '🔍 Query', component: QueryPanel }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard

  return (
    <WalletProvider>
      <ContractProvider>
        <div className="app-container">
          <div className="header">
            <h1>🗳️ SecureDAO Voting</h1>
            <p>Preventing Vote Manipulation with Cryptographic Commitments</p>
          </div>

          <WalletConnect />

          <div className="main-interface">
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="content-section card">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </ContractProvider>
    </WalletProvider>
  )
}

export default App
