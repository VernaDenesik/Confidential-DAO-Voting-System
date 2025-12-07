import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'

const WalletContext = createContext()

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null)
  const [balance, setBalance] = useState('0')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        return
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await web3Provider.send('eth_requestAccounts', [])
      const web3Signer = await web3Provider.getSigner()
      const userAddress = accounts[0]

      setProvider(web3Provider)
      setSigner(web3Signer)
      setAddress(userAddress)
      setIsConnected(true)

      // Get balance
      const bal = await web3Provider.getBalance(userAddress)
      setBalance(ethers.formatEther(bal))
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet: ' + error.message)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setBalance('0')
    setProvider(null)
    setSigner(null)
    setIsConnected(false)
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          connectWallet()
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        provider,
        signer,
        isConnected,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
