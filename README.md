# Confidential DAO Voting System

## December 2025 FHEVM Example - Zama Bounty Track Submission

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Ethereum-orange)](https://hardhat.org/)

## 🎯 Project Overview

**Confidential DAO Voting System** is a privacy-preserving governance platform that demonstrates secure voting mechanisms for decentralized autonomous organizations. This project implements a cryptographic commit-reveal scheme to eliminate vote manipulation, prevent coercion, and ensure fair democratic decision-making in blockchain-based governance.

### Core Problem Solved

Traditional on-chain voting systems suffer from critical vulnerabilities:
- **Vote Buying**: Voters can prove their vote choice to buyers
- **Coercion**: Voters can be forced to vote in specific ways under threat
- **Strategic Manipulation**: Early results influence remaining voters
- **Front-Running**: Observers can see votes before casting their own
- **Privacy Violations**: Individual voting preferences become public knowledge

This system eliminates these vulnerabilities through cryptographic privacy guarantees.

## 🏆 Competition Category

**Advanced DAO Governance Pattern** - Demonstrating commit-reveal voting mechanism with weighted voting power and multi-phase execution.

## 📹 Video Demonstration

**Duration**: 1 minute

**Link**: [View Demo Video](./demo1.mp4)

The demonstration video showcases:
1. Complete voting lifecycle from proposal creation to execution
2. Commit-reveal mechanism in action
3. Weighted voting power system
4. Privacy protection features
5. User interface interaction flow

## 🔑 Key Features

### 1. Commit-Reveal Voting Mechanism

**What is Commit-Reveal?**
The commit-reveal pattern is a cryptographic technique that separates voting into two distinct phases:

- **Phase 1 - Commit**: Voters submit a cryptographic hash of their vote choice combined with a random nonce
- **Phase 2 - Reveal**: After voting concludes, voters reveal their actual vote and nonce for verification

**Benefits:**
- ✅ Vote privacy during voting period
- ✅ Prevention of vote buying (buyers cannot verify vote delivery)
- ✅ Elimination of strategic voting based on partial results
- ✅ Protection against coercion attacks
- ✅ Cryptographic proof of vote integrity

### 2. Weighted Voting Power

**Governance Token Integration**
- Voting power proportional to token holdings or stake
- Minimum threshold requirements for proposal creation
- Batch weight assignment for efficient management
- Dynamic weight updates by contract owner

**Use Cases:**
- Token-weighted DAO governance
- Stake-based decision making
- Multi-tier membership systems
- Delegated voting mechanisms

### 3. Proposal Lifecycle Management

**Complete Governance Flow:**
```
Proposal Creation → Commit Phase → Reveal Phase → Execution
     (7 days)        (1 day)      (After reveal)
```

**Phases:**
1. **Creation**: Community members with sufficient voting power submit proposals
2. **Commit**: Voters submit encrypted vote commitments
3. **Reveal**: Voters prove their votes and choices are tallied
4. **Execution**: Approved proposals are marked as executed on-chain

### 4. Security Features

- **Double Vote Prevention**: Blockchain-enforced one-vote-per-address
- **Hash Verification**: Cryptographic proof prevents vote tampering
- **Time-Lock Enforcement**: Automatic phase transitions
- **Emergency Controls**: Owner can pause compromised proposals
- **Gas Optimization**: Efficient data structures minimize costs

## 🏗️ Technical Architecture

### Smart Contract Design

**Contract**: `SecureDAOVoting.sol`
**Language**: Solidity ^0.8.24
**Network**: Ethereum (Sepolia Testnet)
**Framework**: Hardhat

### Core Data Structures

```solidity
struct Proposal {
    uint256 id;
    string title;
    string description;
    address creator;
    uint256 createdAt;
    uint256 votingEnd;
    uint256 yesVotes;
    uint256 noVotes;
    uint256 totalVoters;
    bool executed;
    bool active;
    mapping(address => bool) hasVoted;
    mapping(address => bytes32) voteHashes;
}
```

### Critical Functions

#### Proposal Management
```solidity
createProposal(string title, string description)
```
Creates a new governance proposal. Requires minimum voting power threshold.

#### Vote Commitment
```solidity
commitVote(uint256 proposalId, bytes32 voteHash)
```
Submits encrypted vote commitment. Vote hash = keccak256(vote_choice, nonce, voter_address)

#### Vote Revelation
```solidity
revealVote(uint256 proposalId, bool support, uint256 nonce)
```
Reveals actual vote with cryptographic proof. Contract verifies hash matches commitment.

#### Execution
```solidity
executeProposal(uint256 proposalId)
```
Marks proposal as executed based on vote results. Callable after reveal period ends.

### Frontend Architecture

**Technology Stack:**
- HTML5/CSS3 for responsive UI
- Vanilla JavaScript for Web3 interaction
- Ethers.js v6 for blockchain communication
- MetaMask for wallet integration

**Key Components:**
- `WalletConnect.jsx`: Web3 wallet connection management
- `Dashboard.jsx`: Real-time proposal statistics
- `ProposalsList.jsx`: Active and historical proposals
- `CreateProposal.jsx`: Proposal submission interface
- `VotePanel.jsx`: Commit-reveal voting interface
- `QueryPanel.jsx`: Blockchain state queries

## 📊 Use Cases

### DAO Governance
- **Protocol Upgrades**: Vote on smart contract improvements and feature additions
- **Treasury Management**: Approve spending proposals and fund allocation
- **Parameter Tuning**: Adjust system parameters (fees, limits, timeouts)
- **Community Grants**: Allocate resources to community initiatives

### Organizational Voting
- **Board Elections**: Confidential voting for leadership positions
- **Strategic Planning**: Vote on organizational direction and priorities
- **Resource Allocation**: Decide budget distribution across departments
- **Policy Changes**: Approve organizational policies and procedures

### DeFi Applications
- **Liquidity Mining**: Vote on reward distribution mechanisms
- **Token Listings**: Community approval for new trading pairs
- **Fee Structure**: Adjust protocol fees and revenue sharing
- **Risk Parameters**: Set collateral ratios and liquidation thresholds

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 16.0.0
npm >= 8.0.0
MetaMask browser extension
Sepolia testnet ETH (from faucet)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/VernaDenesik/SecureDAOVoting.git
cd SecureDAOVoting
```

2. **Install dependencies**
```bash
cd daovoting
npm install
```

3. **Configure environment**
Create `.env` file in `daovoting/` directory:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. **Compile contracts**
```bash
npx hardhat compile
```

5. **Run tests**
```bash
npx hardhat test
```

6. **Deploy to Sepolia**
```bash
npx hardhat run scripts/deploy-secure-voting.js --network sepolia
```

### Frontend Setup

1. **Navigate to root directory**
```bash
cd ..
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Update contract address**
Edit `src/App.jsx` with your deployed contract address:
```javascript
const CONTRACT_ADDRESS = "0xYourContractAddress";
```

4. **Start development server**
```bash
npm run dev
```

5. **Access application**
Open `http://localhost:5173` in MetaMask-enabled browser

## 🧪 Testing

### Test Coverage

The project includes comprehensive test suites covering:

- ✅ Proposal creation with voting power validation
- ✅ Vote commitment hash generation
- ✅ Commit phase timing enforcement
- ✅ Reveal phase verification
- ✅ Vote tallying with weighted power
- ✅ Double voting prevention
- ✅ Proposal execution logic
- ✅ Access control mechanisms
- ✅ Edge cases and error conditions

### Running Tests

```bash
cd daovoting
npx hardhat test
```

**Expected Output:**
```
  SecureDAOVoting Contract
    ✓ Should deploy with correct initial state
    ✓ Should set voter weights correctly
    ✓ Should create proposals with minimum voting power
    ✓ Should commit votes with valid hash
    ✓ Should prevent double voting
    ✓ Should reveal votes correctly after voting ends
    ✓ Should execute proposals after reveal period
    ✓ Should calculate weighted votes correctly
```

### Test Coverage Report

```bash
npx hardhat coverage
```

## 📖 User Guide

### For Voters

**Step 1: Connect Wallet**
- Install MetaMask browser extension
- Switch to Sepolia testnet
- Click "Connect Wallet" button
- Approve connection in MetaMask

**Step 2: Browse Proposals**
- View active proposals in main dashboard
- Read proposal title, description, and creator
- Check voting deadline and current status
- Verify your voting power (must be > 0)

**Step 3: Commit Your Vote**
- Select a proposal in commit phase
- Choose "Yes" or "No" position
- System automatically generates random nonce
- Click "Commit Vote" and approve transaction
- Save your nonce (required for reveal phase)

**Step 4: Reveal Your Vote**
- Wait for voting period to end
- Return to the proposal
- Enter your saved nonce
- Select your original vote choice
- Click "Reveal Vote" and approve transaction

**Step 5: View Results**
- After reveal period, see final vote tally
- Check if proposal passed (yes votes > no votes)
- View execution status

### For Proposal Creators

**Step 1: Ensure Voting Power**
- Contact DAO administrator to receive voting power
- Minimum 100 voting power required to create proposals
- Check your power in dashboard

**Step 2: Create Proposal**
- Click "Create Proposal" button
- Enter clear, descriptive title
- Provide detailed description of proposed action
- Submit transaction and pay gas fee

**Step 3: Monitor Progress**
- Track vote commitments during voting period
- Monitor reveal rate after voting ends
- Check final results after reveal period

**Step 4: Execute (if passed)**
- Click "Execute Proposal" after reveal period
- Proposal marked as executed on blockchain
- Implement approved changes off-chain

## 🔐 Security Considerations

### Cryptographic Security

**Hash Function**: Keccak-256 (SHA-3)
- Collision resistant
- Pre-image resistant
- Used for vote commitments

**Nonce Generation**: Cryptographically secure random values
- Prevents hash prediction
- Should be unique per vote
- Must be saved for reveal phase

**Vote Hash Formula**:
```
hash = keccak256(abi.encodePacked(support, nonce, msg.sender))
```

### Smart Contract Security

**Access Controls**:
- Owner-only functions for system management
- Voter-only functions for proposal creation
- Public functions for viewing data

**Validation Checks**:
- Input parameter validation
- State transition verification
- Time-based access control
- Duplicate prevention

**Emergency Mechanisms**:
- Proposal pause functionality
- Voting system toggle
- No fund custody (no reentrancy risk)

### Best Practices

**For Users**:
- ✅ Save your nonce immediately after committing
- ✅ Use strong random nonces (never reuse)
- ✅ Verify contract address before interaction
- ✅ Keep private keys secure
- ✅ Test with small amounts first

**For Developers**:
- ✅ Audit contract code before mainnet deployment
- ✅ Use hardware wallets for owner account
- ✅ Implement time-locks for critical changes
- ✅ Monitor contract events for suspicious activity
- ✅ Maintain emergency response procedures

## 🎓 Educational Value

### Concepts Demonstrated

1. **Commit-Reveal Pattern**: Two-phase cryptographic voting
2. **Hash Functions**: Keccak-256 for vote commitments
3. **Time-Locked Execution**: Block timestamp-based phase transitions
4. **Weighted Voting**: Token-based governance power
5. **Event Emissions**: Blockchain event logging for transparency
6. **Access Control**: Role-based function restrictions
7. **Gas Optimization**: Efficient data structures and operations

### Learning Outcomes

After studying this project, developers will understand:
- How to implement privacy-preserving voting on blockchain
- Cryptographic commit-reveal pattern application
- Ethereum smart contract development with Hardhat
- Web3 frontend integration with Ethers.js
- Testing methodologies for smart contracts
- Deployment workflows for Ethereum networks

## 🛣️ Roadmap

### Completed ✅
- [x] Core commit-reveal voting mechanism
- [x] Weighted voting power system
- [x] Web3 frontend interface
- [x] Comprehensive testing suite
- [x] Sepolia testnet deployment
- [x] Documentation and user guides

### Future Enhancements 🚀
- [ ] Integration with FHEVM for true vote privacy
- [ ] Delegation mechanisms for representative voting
- [ ] Quadratic voting support
- [ ] Multi-signature proposal execution
- [ ] IPFS integration for proposal storage
- [ ] Governance token integration (ERC20)
- [ ] Mobile-responsive redesign
- [ ] Mainnet deployment after security audit

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines

- Write comprehensive tests for new features
- Follow Solidity style guide
- Document code with NatSpec comments
- Update README with new functionality
- Ensure all tests pass before PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Team**: For organizing the FHEVM bounty program
- **OpenZeppelin**: For secure smart contract patterns
- **Hardhat Team**: For excellent development framework
- **Ethereum Community**: For blockchain infrastructure

## 📞 Contact & Support

- **GitHub**: [VernaDenesik/SecureDAOVoting](https://github.com/VernaDenesik/SecureDAOVoting)
- **Live Demo**: [https://secure-dao-voting.vercel.app/](https://secure-dao-voting.vercel.app/)
- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind, express or implied. This is experimental software intended for educational and development purposes.

**Important Notes**:
- Currently deployed on testnet only
- Not audited for mainnet production use
- Users are responsible for their own private key security
- Always verify contract code before interacting with real funds
- No liability for losses incurred through usage

---

**Built with ❤️ for the Zama FHEVM Bounty Program - December 2025**

*Advancing privacy-preserving blockchain governance*
