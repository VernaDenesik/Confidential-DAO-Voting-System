import React from 'react'
import { useWallet } from '../hooks/useWallet'
import { useContract } from '../hooks/useContract'

export default function WalletConnect() {
  const { address, balance, isConnected, connectWallet, disconnectWallet } = useWallet()
  const { votingPower, contractAddress } = useContract()

  const formatAddress = (addr) => {
    if (!addr) return '-'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="card">
      {!isConnected ? (
        <button className="btn" onClick={connectWallet}>
          Connect MetaMask
        </button>
      ) : (
        <>
          <button className="btn" onClick={disconnectWallet}>
            Disconnect
          </button>
          <div className="info-grid">
            <div className="info-item">
              <div>Your Address</div>
              <div className="info-value">{formatAddress(address)}</div>
            </div>
            <div className="info-item">
              <div>ETH Balance</div>
              <div className="info-value">{parseFloat(balance).toFixed(4)}</div>
            </div>
            <div className="info-item">
              <div>Voting Power</div>
              <div className="info-value">{votingPower}</div>
            </div>
            <div className="info-item">
              <div>Network</div>
              <div className="info-value">Sepolia</div>
            </div>
            <div className="info-item">
              <div>Contract</div>
              <div className="info-value">
                <a
                  href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#667eea', textDecoration: 'none' }}
                >
                  {formatAddress(contractAddress)}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
