# SecureDAO Voting - React Application

A fully converted React application from the original static HTML DAO voting platform, now integrated with FHEVM SDK.

## Overview

This is a decentralized autonomous organization (DAO) voting platform that implements cryptographic commit-reveal schemes to prevent vote manipulation and ensure fair governance. The application has been converted from static HTML to a modern React application with FHEVM SDK integration.

## Features

### React Implementation
- **Modern React 18** with functional components and hooks
- **Custom Hooks** for wallet and contract management
- **Context API** for state management
- **Vite** for fast development and building
- **FHEVM SDK Integration** for confidential computations

### DAO Voting Features
- **Commit-Reveal Voting** - Two-phase voting for privacy
- **Cryptographic Security** - Hash-based vote commitments
- **Time-Locked Phases** - Structured voting periods
- **Weighted Voting** - Support for different voting powers
- **Real-time Updates** - Live proposal status and vote tallies

## Project Structure

```
SecureDAOVoting-main/
├── src/
│   ├── components/           # React components
│   │   ├── WalletConnect.jsx # Wallet connection component
│   │   ├── Dashboard.jsx     # Dashboard overview
│   │   ├── ProposalsList.jsx # List all proposals
│   │   ├── CreateProposal.jsx# Create new proposals
│   │   ├── VotePanel.jsx     # Voting interface
│   │   └── QueryPanel.jsx    # Query proposal details
│   ├── hooks/                # Custom React hooks
│   │   ├── useWallet.jsx     # Wallet management hook
│   │   └── useContract.jsx   # Contract interaction hook
│   ├── styles/               # CSS stylesheets
│   │   ├── index.css         # Global styles
│   │   └── App.css           # Application styles
│   ├── App.jsx               # Main application component
│   └── main.jsx              # Entry point
├── index.html                # Original static HTML version
├── index-react.html          # React version entry point
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies and scripts
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### 1. Connect Wallet

Click "Connect MetaMask" to connect your wallet to the Sepolia testnet.

### 2. View Dashboard

See overview of total proposals, active proposals, and your voting participation.

### 3. Browse Proposals

Navigate to the "Proposals" tab to view all governance proposals with their status and voting results.

### 4. Create Proposal

- Minimum 100 voting power required
- Navigate to "Create" tab
- Enter proposal description
- Set voting period (minimum 1 hour)
- Submit proposal

### 5. Vote on Proposals

**Commit Phase:**
- Navigate to "Vote" tab
- Select "Commit Vote"
- Enter proposal ID
- Choose Yes or No
- Save the generated nonce (important!)

**Reveal Phase:**
- After voting period ends
- Select "Reveal Vote"
- Enter proposal ID and saved nonce
- Select your original vote choice
- Submit reveal

### 6. Query Proposals

Use the "Query" tab to view detailed information about any proposal including:
- Vote counts and percentages
- Proposal status
- Time periods
- Visual vote distribution

## Technical Details

### Custom Hooks

#### useWallet
Manages wallet connection, account information, and network status:
- Connect/disconnect wallet
- Track address and balance
- Handle account and network changes

#### useContract
Handles contract interactions and FHEVM initialization:
- Initialize FHEVM client
- Interact with DAO contract
- Load voting power
- Manage contract state

### Components

All components are functional React components using hooks for state management:
- **WalletConnect** - Wallet connection UI and account info
- **Dashboard** - Statistics and overview
- **ProposalsList** - Display all proposals with filtering
- **CreateProposal** - Form for creating new proposals
- **VotePanel** - Commit and reveal voting interface
- **QueryPanel** - Detailed proposal information viewer

### Styling

CSS uses the same gradient theme as the original:
- Purple/blue gradient background
- Glass-morphism effects
- Responsive design
- Mobile-friendly interface

## FHEVM SDK Integration

The application integrates FHEVM SDK for confidential computations:

```javascript
import { FhevmClient } from 'fhevm-sdk'

const client = new FhevmClient({
  provider,
  signer,
  contractAddress: CONTRACT_ADDRESS
})

await client.init()
```

## Contract Information

- **Network**: Sepolia Testnet
- **Contract Address**: `0x08C09eC71Fe5CF02ce7E9bcfCBC406e052EA0248`
- **Explorer**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x08C09eC71Fe5CF02ce7E9bcfCBC406e052EA0248)

## Development

### Dependencies

- **react**: ^18.2.0
- **react-dom**: ^18.2.0
- **ethers**: ^6.4.0
- **fhevm-sdk**: file:../../packages/fhevm-sdk
- **vite**: ^5.0.0

### Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext js,jsx,ts,tsx"
}
```

## Differences from Static HTML

### Improvements
- ✅ Component-based architecture
- ✅ Better state management with hooks and context
- ✅ More maintainable code structure
- ✅ TypeScript support ready
- ✅ Hot module replacement in development
- ✅ Optimized production builds
- ✅ Better error handling

### Preserved Features
- ✅ All original functionality
- ✅ Same UI/UX design
- ✅ Same contract integration
- ✅ Commit-reveal mechanism
- ✅ All tabs and features

## Security Considerations

- Vote commitments use cryptographic hashing
- Nonces must be saved securely by users
- Votes cannot be changed after commitment
- Private keys must never be shared
- Always verify contract address

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari (with MetaMask mobile)

## License

MIT License

## Resources

- [Original Static Version](./index.html)
- [FHEVM SDK Documentation](../../packages/fhevm-sdk/README.md)
- [Live Demo](https://secure-dao-voting.vercel.app/)

---

**Built with React + FHEVM SDK for confidential DAO governance**
