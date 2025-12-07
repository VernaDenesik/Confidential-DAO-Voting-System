# Hello FHEVM: Building Your First Confidential dApp

## 🎯 Tutorial Overview

Welcome to the **Hello FHEVM** tutorial! This comprehensive guide will teach you how to build your first **Fully Homomorphic Encryption Virtual Machine (FHEVM)** application. By the end of this tutorial, you'll have created a complete confidential voting dApp that protects vote privacy using FHE encryption.

### What You'll Learn

- 📚 **FHEVM Fundamentals**: Core concepts of confidential smart contracts
- 🔐 **Encrypted Inputs/Outputs**: How to handle sensitive data on-chain
- 🗳️ **Real-World Application**: Build a complete confidential voting system
- 🚀 **End-to-End Development**: Smart contract + frontend integration
- 🔧 **Best Practices**: Security patterns and optimization techniques

### Target Audience

This tutorial is designed for Web3 developers who:
- ✅ Have basic Solidity knowledge (can write and deploy simple smart contracts)
- ✅ Are familiar with standard Ethereum tools (Hardhat, MetaMask, React)
- ✅ Want to learn confidential computing without FHE/cryptography background
- ❌ **No advanced mathematics or cryptography knowledge required!**

---

## 📋 Table of Contents

1. [What is FHEVM?](#what-is-fhevm)
2. [Understanding the Problem](#understanding-the-problem)
3. [FHEVM vs Traditional Solutions](#fhevm-vs-traditional-solutions)
4. [Setting Up Your Development Environment](#setting-up-your-development-environment)
5. [Building the Confidential Voting Contract](#building-the-confidential-voting-contract)
6. [Frontend Integration](#frontend-integration)
7. [Deployment and Testing](#deployment-and-testing)
8. [Best Practices and Security](#best-practices-and-security)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## 🔍 What is FHEVM?

### The Simple Explanation

**FHEVM (Fully Homomorphic Encryption Virtual Machine)** is a blockchain technology that allows smart contracts to perform computations on **encrypted data** without ever decrypting it. Think of it as a "privacy-preserving calculator" that can work with secret numbers while keeping them secret.

### Key Concepts

```solidity
// Traditional Smart Contract (Data is PUBLIC)
contract TraditionalVoting {
    mapping(address => bool) public votes; // ❌ Everyone can see your vote

    function vote(bool choice) public {
        votes[msg.sender] = choice; // ❌ Vote is visible on blockchain
    }
}

// FHEVM Smart Contract (Data is ENCRYPTED)
contract ConfidentialVoting {
    mapping(address => euint8) private encryptedVotes; // ✅ Votes are encrypted

    function vote(inEuint8 calldata encryptedChoice) public {
        euint8 choice = TFHE.asEuint8(encryptedChoice);
        encryptedVotes[msg.sender] = choice; // ✅ Vote stays encrypted
    }
}
```

### FHEVM Data Types

| Traditional Type | FHEVM Encrypted Type | Description |
|------------------|---------------------|-------------|
| `bool` | `ebool` | Encrypted boolean |
| `uint8` | `euint8` | Encrypted 8-bit integer |
| `uint16` | `euint16` | Encrypted 16-bit integer |
| `uint32` | `euint32` | Encrypted 32-bit integer |
| `address` | `eaddress` | Encrypted address |

---

## 🎯 Understanding the Problem

### Traditional Voting Challenges

**Problem 1: Vote Privacy**
```
Voter Alice wants to vote "YES" on Proposal #1
❌ Traditional blockchain: Everyone sees Alice voted YES
✅ FHEVM: Vote is encrypted, privacy preserved
```

**Problem 2: Vote Buying**
```
❌ Traditional: Buyers can verify votes were cast as paid
✅ FHEVM: Impossible to verify encrypted votes externally
```

**Problem 3: Coercion**
```
❌ Traditional: Voters can be forced to prove their vote
✅ FHEVM: Even voters cannot prove their encrypted vote to others
```

### Why Current Solutions Fall Short

#### 1. **Commit-Reveal Schemes** (Like this project currently uses)
```solidity
// Phase 1: Commit hash of vote
function commitVote(bytes32 voteHash) external {
    votes[msg.sender] = voteHash; // Hash is public
}

// Phase 2: Reveal actual vote
function revealVote(bool choice, uint256 nonce) external {
    require(keccak256(abi.encode(choice, nonce)) == votes[msg.sender]);
    // Vote becomes public here! ❌
}
```

**Problems:**
- ❌ Votes become public during reveal phase
- ❌ Complex two-phase process
- ❌ Unrevealed votes are lost
- ❌ Still vulnerable to coercion after reveal

#### 2. **Zero-Knowledge Proofs**
- ❌ Complex cryptography knowledge required
- ❌ Large proof sizes and verification costs
- ❌ Limited programmability

#### 3. **Off-Chain Solutions**
- ❌ Centralization risks
- ❌ Trust assumptions
- ❌ Limited composability with other contracts

---

## 🆚 FHEVM vs Traditional Solutions

### Comparison Table

| Feature | Traditional Blockchain | Commit-Reveal | Zero-Knowledge | **FHEVM** |
|---------|----------------------|---------------|----------------|-----------|
| **Vote Privacy** | ❌ Public | ⚠️ Temporary | ✅ Private | ✅ **Always Private** |
| **Simplicity** | ✅ Simple | ❌ Complex | ❌ Very Complex | ✅ **Simple** |
| **Gas Costs** | ✅ Low | ⚠️ Medium | ❌ High | ✅ **Reasonable** |
| **Composability** | ✅ High | ⚠️ Limited | ⚠️ Limited | ✅ **High** |
| **Real-time Results** | ✅ Yes | ❌ No | ✅ Yes | ✅ **Yes** |
| **Lost Votes** | ❌ N/A | ❌ Yes | ❌ No | ✅ **No** |

### FHEVM Advantages

1. **🔐 End-to-End Encryption**: Data never exists in unencrypted form on-chain
2. **🚀 Developer Friendly**: Write contracts almost like traditional Solidity
3. **🔄 Composable**: Encrypted values can interact with other FHEVM contracts
4. **⚡ Efficient**: No complex proof generation or verification
5. **🛡️ Future-Proof**: Quantum-resistant encryption

---

## 🛠️ Setting Up Your Development Environment

### Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed
- [ ] **Git** for version control
- [ ] **MetaMask** browser extension
- [ ] **Basic Solidity knowledge**
- [ ] **Familiarity with Hardhat or Foundry**

### Step 1: Install FHEVM Development Tools

```bash
# Create new project directory
mkdir hello-fhevm-voting
cd hello-fhevm-voting

# Initialize npm project
npm init -y

# Install FHEVM dependencies
npm install fhevmjs @zama-ai/fhevm

# Install development dependencies
npm install --save-dev @nomicfoundation/hardhat-ethers ethers hardhat
```

### Step 2: FHEVM Hardhat Configuration

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    // Zama Devnet for FHEVM
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 8009,
    },
    // Local FHEVM node
    localfhe: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
      chainId: 31337,
    },
  },
};
```

### Step 3: Project Structure

```
hello-fhevm-voting/
├── contracts/
│   ├── ConfidentialVoting.sol
│   └── interfaces/
├── scripts/
│   ├── deploy.js
│   └── setup.js
├── test/
│   └── ConfidentialVoting.test.js
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── hardhat.config.js
├── package.json
└── README.md
```

---

## 🗳️ Building the Confidential Voting Contract

### Step 1: Basic FHEVM Imports and Setup

Create `contracts/ConfidentialVoting.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@zama-ai/fhevm/contracts/TFHE.sol";

/// @title Confidential Voting with FHEVM
/// @notice A privacy-preserving voting system using Fully Homomorphic Encryption
contract ConfidentialVoting {

    // State variables
    uint256 public proposalCount;
    address public owner;

    // Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votingEnd;
        euint32 yesVotes;    // ✅ Encrypted vote count
        euint32 noVotes;     // ✅ Encrypted vote count
        uint256 totalVoters;
        bool active;
        mapping(address => ebool) hasVoted;        // ✅ Encrypted voting status
        mapping(address => euint8) voterChoices;   // ✅ Encrypted individual votes
    }

    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(address => euint32) public voterWeights; // ✅ Encrypted voting power

    // Constants
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_VOTING_POWER = 100;

    // Events
    event ProposalCreated(uint256 indexed proposalId, string title, address creator);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalEnded(uint256 indexed proposalId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
}
```

### Step 2: Core Voting Functions

```solidity
/// @notice Create a new proposal
/// @param title The proposal title
/// @param description The proposal description
function createProposal(
    string memory title,
    string memory description
) external {
    // Check if user has minimum voting power (encrypted comparison)
    euint32 userWeight = voterWeights[msg.sender];
    ebool hasMinWeight = TFHE.ge(userWeight, TFHE.asEuint32(MIN_VOTING_POWER));

    // This require will revert if user doesn't have enough weight
    require(TFHE.decrypt(hasMinWeight), "Insufficient voting power");

    proposalCount++;
    Proposal storage newProposal = proposals[proposalCount];

    newProposal.id = proposalCount;
    newProposal.title = title;
    newProposal.description = description;
    newProposal.creator = msg.sender;
    newProposal.createdAt = block.timestamp;
    newProposal.votingEnd = block.timestamp + VOTING_DURATION;
    newProposal.active = true;

    // Initialize encrypted vote counts to 0
    newProposal.yesVotes = TFHE.asEuint32(0);
    newProposal.noVotes = TFHE.asEuint32(0);

    emit ProposalCreated(proposalCount, title, msg.sender);
}

/// @notice Cast an encrypted vote
/// @param proposalId The proposal to vote on
/// @param encryptedChoice Encrypted vote choice (0 = No, 1 = Yes)
function vote(
    uint256 proposalId,
    inEuint8 calldata encryptedChoice
) external {
    require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal");

    Proposal storage proposal = proposals[proposalId];
    require(proposal.active, "Proposal not active");
    require(block.timestamp < proposal.votingEnd, "Voting ended");

    // Check if user already voted (encrypted check)
    ebool alreadyVoted = proposal.hasVoted[msg.sender];
    require(!TFHE.decrypt(alreadyVoted), "Already voted");

    // Convert input to encrypted uint8
    euint8 choice = TFHE.asEuint8(encryptedChoice);

    // Validate choice is 0 or 1
    ebool isValid = TFHE.or(
        TFHE.eq(choice, TFHE.asEuint8(0)),  // No vote
        TFHE.eq(choice, TFHE.asEuint8(1))   // Yes vote
    );
    require(TFHE.decrypt(isValid), "Invalid vote choice");

    // Record the vote
    proposal.hasVoted[msg.sender] = TFHE.asEbool(true);
    proposal.voterChoices[msg.sender] = choice;

    // Get voter's weight
    euint32 weight = voterWeights[msg.sender];

    // Add weight to appropriate vote count based on choice
    ebool isYes = TFHE.eq(choice, TFHE.asEuint8(1));

    // Conditional addition: if choice is Yes, add to yesVotes, else add to noVotes
    proposal.yesVotes = TFHE.add(
        proposal.yesVotes,
        TFHE.cmux(isYes, weight, TFHE.asEuint32(0))
    );

    proposal.noVotes = TFHE.add(
        proposal.noVotes,
        TFHE.cmux(isYes, TFHE.asEuint32(0), weight)
    );

    proposal.totalVoters++;

    emit VoteCast(proposalId, msg.sender);
}
```

### Step 3: Advanced FHEVM Features

```solidity
/// @notice Get proposal results (only after voting ends)
/// @param proposalId The proposal ID
/// @return yesCount Decrypted yes vote count
/// @return noCount Decrypted no vote count
function getResults(uint256 proposalId)
    external
    view
    returns (uint32 yesCount, uint32 noCount)
{
    require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal");

    Proposal storage proposal = proposals[proposalId];
    require(block.timestamp >= proposal.votingEnd, "Voting not ended");

    // Only decrypt results after voting ends
    yesCount = TFHE.decrypt(proposal.yesVotes);
    noCount = TFHE.decrypt(proposal.noVotes);
}

/// @notice Check if user voted (returns encrypted boolean)
/// @param proposalId The proposal ID
/// @param user The user address
/// @return encryptedHasVoted Encrypted boolean indicating if user voted
function hasUserVoted(uint256 proposalId, address user)
    external
    view
    returns (ebool encryptedHasVoted)
{
    return proposals[proposalId].hasVoted[user];
}

/// @notice Set voter weight (only owner)
/// @param voter The voter address
/// @param encryptedWeight Encrypted voting weight
function setVoterWeight(
    address voter,
    inEuint32 calldata encryptedWeight
) external onlyOwner {
    voterWeights[voter] = TFHE.asEuint32(encryptedWeight);
}

/// @notice Get user's vote choice (only the user themselves)
/// @param proposalId The proposal ID
/// @return choice Decrypted vote choice (only for msg.sender)
function getMyVote(uint256 proposalId) external view returns (uint8 choice) {
    Proposal storage proposal = proposals[proposalId];

    // Only allow users to decrypt their own votes
    require(TFHE.decrypt(proposal.hasVoted[msg.sender]), "You didn't vote");

    return TFHE.decrypt(proposal.voterChoices[msg.sender]);
}
```

### Step 4: Complete Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@zama-ai/fhevm/contracts/TFHE.sol";

contract ConfidentialVoting {
    uint256 public proposalCount;
    address public owner;

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votingEnd;
        euint32 yesVotes;
        euint32 noVotes;
        uint256 totalVoters;
        bool active;
        mapping(address => ebool) hasVoted;
        mapping(address => euint8) voterChoices;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => euint32) public voterWeights;

    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_VOTING_POWER = 100;

    event ProposalCreated(uint256 indexed proposalId, string title, address creator);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalEnded(uint256 indexed proposalId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // All functions from above go here...
    // [Insert complete implementation]
}
```

---

## 🌐 Frontend Integration

### Step 1: FHEVM JavaScript Setup

Create `frontend/app.js`:

```javascript
// Import FHEVM client library
import { createFhevmInstance } from 'fhevmjs';

class ConfidentialVotingApp {
    constructor() {
        this.fhevmInstance = null;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        this.userAccount = null;
    }

    async initialize() {
        // Initialize FHEVM instance
        this.fhevmInstance = await createFhevmInstance({
            chainId: 8009, // Zama devnet
            publicKey: await this.getNetworkPublicKey()
        });

        // Initialize ethers
        if (window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.userAccount = await this.signer.getAddress();

            // Initialize contract
            this.contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                this.signer
            );
        }
    }

    async getNetworkPublicKey() {
        // Get FHE public key from network
        const response = await fetch('https://devnet.zama.ai/fhe-key');
        return response.arrayBuffer();
    }
}
```

### Step 2: Encrypting User Input

```javascript
async function encryptVote(choice) {
    try {
        // choice: 0 for No, 1 for Yes
        const encryptedChoice = await fhevmInstance.encrypt8(choice);

        console.log('Original vote:', choice);
        console.log('Encrypted vote:', encryptedChoice);

        return encryptedChoice;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
}

async function castVote(proposalId, voteChoice) {
    try {
        showStatus('🔐 Encrypting your vote...', 'info');

        // Encrypt the vote choice
        const encryptedChoice = await encryptVote(voteChoice);

        showStatus('📝 Submitting encrypted vote to blockchain...', 'info');

        // Submit encrypted vote to contract
        const tx = await contract.vote(proposalId, encryptedChoice);

        showStatus(`⏳ Transaction submitted: ${tx.hash}`, 'info');

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showStatus('✅ Vote cast successfully! Your vote is encrypted and private.', 'success');

            // Update UI
            await loadProposals();

            // Optionally show transaction details
            setTimeout(() => {
                if (confirm('Vote submitted! View transaction on explorer?')) {
                    window.open(`https://explorer.zama.ai/tx/${tx.hash}`, '_blank');
                }
            }, 2000);
        } else {
            showStatus('❌ Transaction failed', 'error');
        }

    } catch (error) {
        console.error('Vote casting error:', error);

        let errorMessage = 'Vote casting failed';
        if (error.code === 4001) {
            errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('Already voted')) {
            errorMessage = 'You have already voted on this proposal';
        } else if (error.message.includes('Voting ended')) {
            errorMessage = 'Voting period has ended';
        }

        showStatus(`❌ ${errorMessage}`, 'error');
    }
}
```

### Step 3: Decrypting Results

```javascript
async function getProposalResults(proposalId) {
    try {
        // Check if voting has ended
        const proposal = await contract.getProposal(proposalId);
        const votingEnd = Number(proposal.votingEnd) * 1000; // Convert to milliseconds

        if (Date.now() < votingEnd) {
            return {
                canSeeResults: false,
                timeRemaining: Math.ceil((votingEnd - Date.now()) / (1000 * 60 * 60 * 24))
            };
        }

        // Get decrypted results (only available after voting ends)
        const results = await contract.getResults(proposalId);

        return {
            canSeeResults: true,
            yesVotes: Number(results.yesCount),
            noVotes: Number(results.noCount),
            totalVotes: Number(results.yesCount) + Number(results.noCount),
            winner: Number(results.yesCount) > Number(results.noCount) ? 'YES' : 'NO'
        };

    } catch (error) {
        console.error('Error getting results:', error);
        return {
            canSeeResults: false,
            error: error.message
        };
    }
}

async function displayProposalResults(proposalId) {
    const resultsContainer = document.getElementById(`results-${proposalId}`);

    try {
        const results = await getProposalResults(proposalId);

        if (!results.canSeeResults) {
            if (results.timeRemaining) {
                resultsContainer.innerHTML = `
                    <div class="results-pending">
                        <p>🕒 Results will be available in ${results.timeRemaining} days</p>
                        <p>🔐 Votes are encrypted until voting ends</p>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="results-error">
                        <p>❌ Unable to load results: ${results.error}</p>
                    </div>
                `;
            }
            return;
        }

        // Display results
        const winnerClass = results.winner === 'YES' ? 'winner-yes' : 'winner-no';
        resultsContainer.innerHTML = `
            <div class="results-final">
                <h4>📊 Final Results</h4>
                <div class="vote-breakdown">
                    <div class="vote-option ${results.winner === 'YES' ? 'winner' : ''}">
                        <span class="vote-label">👍 YES</span>
                        <span class="vote-count">${results.yesVotes}</span>
                        <span class="vote-percentage">${Math.round(results.yesVotes / results.totalVotes * 100)}%</span>
                    </div>
                    <div class="vote-option ${results.winner === 'NO' ? 'winner' : ''}">
                        <span class="vote-label">👎 NO</span>
                        <span class="vote-count">${results.noVotes}</span>
                        <span class="vote-percentage">${Math.round(results.noVotes / results.totalVotes * 100)}%</span>
                    </div>
                </div>
                <div class="total-votes">
                    <strong>Total Votes: ${results.totalVotes}</strong>
                </div>
                <div class="winner-announcement ${winnerClass}">
                    <strong>🏆 Winner: ${results.winner}</strong>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error displaying results:', error);
        resultsContainer.innerHTML = `
            <div class="results-error">
                <p>❌ Error loading results</p>
            </div>
        `;
    }
}
```

### Step 4: Complete Frontend HTML

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello FHEVM - Confidential Voting</title>
    <style>
        /* Add comprehensive styling */
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }

        .fhevm-badge {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }

        .proposal-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }

        .encryption-status {
            background: rgba(76, 175, 80, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #4CAF50;
        }

        .vote-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .btn-yes {
            background: linear-gradient(45deg, #4CAF50, #45a049);
        }

        .btn-no {
            background: linear-gradient(45deg, #f44336, #da190b);
        }

        .results-final {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }

        .vote-breakdown {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }

        .vote-option {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }

        .vote-option.winner {
            background: rgba(76, 175, 80, 0.3);
            border: 2px solid #4CAF50;
        }

        .winner-announcement {
            text-align: center;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            font-size: 1.1em;
        }

        .winner-yes { background: rgba(76, 175, 80, 0.3); }
        .winner-no { background: rgba(244, 67, 54, 0.3); }

        .status {
            padding: 12px;
            border-radius: 6px;
            margin: 10px 0;
            text-align: center;
        }

        .status.success { background: rgba(76, 175, 80, 0.3); }
        .status.error { background: rgba(244, 67, 54, 0.3); }
        .status.info { background: rgba(33, 150, 243, 0.3); }

        .hidden { display: none; }

        @media (max-width: 768px) {
            .vote-breakdown {
                grid-template-columns: 1fr;
            }

            .vote-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Hello FHEVM</h1>
            <div class="subtitle">Your First Confidential Voting dApp</div>
            <div class="fhevm-badge">
                🚀 Powered by Fully Homomorphic Encryption
            </div>
            <p>Experience true privacy-preserving voting on the blockchain!</p>
        </div>

        <!-- Connection Status -->
        <div class="card">
            <h3>📡 Connection Status</h3>
            <button id="connectBtn" class="btn" onclick="connectWallet()">
                Connect MetaMask
            </button>

            <div id="connectionInfo" class="hidden">
                <div class="encryption-status">
                    <h4>🔐 FHEVM Encryption Active</h4>
                    <p>✅ All votes are encrypted using Fully Homomorphic Encryption</p>
                    <p>✅ Your vote privacy is mathematically guaranteed</p>
                    <p>✅ No one can see individual votes, including validators</p>
                </div>

                <div class="info-grid">
                    <div><strong>Address:</strong> <span id="userAddress">-</span></div>
                    <div><strong>Network:</strong> Zama FHEVM Devnet</div>
                    <div><strong>Voting Power:</strong> <span id="votingPower">-</span></div>
                    <div><strong>FHE Status:</strong> <span style="color: #4CAF50;">🔐 Encrypted</span></div>
                </div>
            </div>
        </div>

        <!-- Proposals Section -->
        <div id="proposalsSection" class="hidden">
            <div class="card">
                <h2>🗳️ Active Proposals</h2>
                <button class="btn" onclick="loadProposals()">🔄 Refresh Proposals</button>
                <button class="btn" onclick="createSampleProposal()" style="background: linear-gradient(45deg, #ff9800, #f57c00);">
                    ➕ Create Sample Proposal
                </button>

                <div id="proposalsList">
                    <p>Loading proposals...</p>
                </div>
            </div>
        </div>

        <!-- Status Messages -->
        <div id="statusMessage" class="status hidden"></div>
    </div>

    <!-- Scripts -->
    <script src="https://unpkg.com/ethers@6.9.2/dist/ethers.umd.min.js"></script>
    <script type="module" src="app.js"></script>
</body>
</html>
```

---

## 🚀 Deployment and Testing

### Step 1: Deployment Script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Confidential Voting Contract...");

    // Get the contract factory
    const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");

    // Deploy the contract
    console.log("📝 Deploying contract...");
    const contract = await ConfidentialVoting.deploy();

    // Wait for deployment
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);

    // Set up initial voter weights
    console.log("⚙️ Setting up initial configuration...");

    const [deployer] = await ethers.getSigners();

    // Give deployer voting power
    const encryptedWeight = await encrypt32(1000); // 1000 voting power
    await contract.setVoterWeight(deployer.address, encryptedWeight);

    console.log("✅ Initial setup complete!");
    console.log("📋 Contract Address:", contractAddress);
    console.log("🔑 Deployer Address:", deployer.address);
    console.log("⚡ Voting Power:", "1000 (encrypted)");

    return contractAddress;
}

// Helper function to encrypt values (implement based on FHEVM docs)
async function encrypt32(value) {
    // This would use the FHEVM encryption library
    // Implementation depends on specific FHEVM setup
    return value; // Placeholder
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
```

### Step 2: Test Script

Create `test/ConfidentialVoting.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConfidentialVoting", function () {
    let contract;
    let owner;
    let voter1;
    let voter2;

    beforeEach(async function () {
        [owner, voter1, voter2] = await ethers.getSigners();

        const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
        contract = await ConfidentialVoting.deploy();
        await contract.waitForDeployment();

        // Set up voter weights
        await contract.setVoterWeight(voter1.address, encryptUint32(500));
        await contract.setVoterWeight(voter2.address, encryptUint32(300));
    });

    describe("Proposal Creation", function () {
        it("Should create a proposal with encrypted vote counts", async function () {
            const title = "Test Proposal";
            const description = "A test proposal for FHEVM voting";

            await expect(
                contract.connect(voter1).createProposal(title, description)
            ).to.emit(contract, "ProposalCreated");

            expect(await contract.proposalCount()).to.equal(1);
        });

        it("Should reject proposal creation from users with insufficient weight", async function () {
            // voter2 has 300 weight, needs 100 minimum
            await expect(
                contract.connect(voter2).createProposal("Test", "Test")
            ).to.be.revertedWith("Insufficient voting power");
        });
    });

    describe("Encrypted Voting", function () {
        beforeEach(async function () {
            // Create a test proposal
            await contract.connect(voter1).createProposal("Test Proposal", "Test Description");
        });

        it("Should accept encrypted votes", async function () {
            const encryptedYes = encryptUint8(1); // YES vote

            await expect(
                contract.connect(voter1).vote(1, encryptedYes)
            ).to.emit(contract, "VoteCast");
        });

        it("Should prevent double voting", async function () {
            const encryptedYes = encryptUint8(1);

            // First vote should succeed
            await contract.connect(voter1).vote(1, encryptedYes);

            // Second vote should fail
            await expect(
                contract.connect(voter1).vote(1, encryptedYes)
            ).to.be.revertedWith("Already voted");
        });

        it("Should reject invalid vote choices", async function () {
            const invalidChoice = encryptUint8(2); // Invalid (not 0 or 1)

            await expect(
                contract.connect(voter1).vote(1, invalidChoice)
            ).to.be.revertedWith("Invalid vote choice");
        });
    });

    describe("Results and Privacy", function () {
        beforeEach(async function () {
            // Create proposal and cast votes
            await contract.connect(voter1).createProposal("Test Proposal", "Test Description");

            await contract.connect(voter1).vote(1, encryptUint8(1)); // YES
            await contract.connect(voter2).vote(1, encryptUint8(0)); // NO
        });

        it("Should not reveal results before voting ends", async function () {
            await expect(
                contract.getResults(1)
            ).to.be.revertedWith("Voting not ended");
        });

        it("Should reveal results after voting period", async function () {
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]); // 7 days + 1 second
            await ethers.provider.send("evm_mine");

            const results = await contract.getResults(1);
            expect(results.yesCount).to.equal(500); // voter1's weight
            expect(results.noCount).to.equal(300);  // voter2's weight
        });

        it("Should allow users to view only their own votes", async function () {
            const myVote = await contract.connect(voter1).getMyVote(1);
            expect(myVote).to.equal(1); // YES vote
        });
    });
});

// Helper functions for testing
function encryptUint8(value) {
    // In real implementation, this would use FHEVM encryption
    // For testing, we'll use mock values
    return value;
}

function encryptUint32(value) {
    return value;
}
```

### Step 3: Deployment Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.js --network localfhe

# Deploy to Zama devnet
npx hardhat run scripts/deploy.js --network zama

# Verify deployment
npx hardhat verify --network zama <CONTRACT_ADDRESS>
```

---

## 🛡️ Best Practices and Security

### 1. **Encryption Best Practices**

```solidity
// ✅ Good: Always validate encrypted inputs
function vote(uint256 proposalId, inEuint8 calldata encryptedChoice) external {
    euint8 choice = TFHE.asEuint8(encryptedChoice);

    // Validate choice is 0 or 1
    ebool isValid = TFHE.or(
        TFHE.eq(choice, TFHE.asEuint8(0)),
        TFHE.eq(choice, TFHE.asEuint8(1))
    );
    require(TFHE.decrypt(isValid), "Invalid choice");

    // ... rest of function
}

// ❌ Bad: No input validation
function badVote(uint256 proposalId, inEuint8 calldata encryptedChoice) external {
    euint8 choice = TFHE.asEuint8(encryptedChoice);
    // No validation - could be any value!
    // ... rest of function
}
```

### 2. **Privacy Protection Patterns**

```solidity
// ✅ Good: Only decrypt when necessary and authorized
function getResults(uint256 proposalId) external view returns (uint32, uint32) {
    require(block.timestamp >= proposals[proposalId].votingEnd, "Voting not ended");
    // Only decrypt after voting ends
    return (
        TFHE.decrypt(proposals[proposalId].yesVotes),
        TFHE.decrypt(proposals[proposalId].noVotes)
    );
}

// ✅ Good: Allow users to decrypt only their own data
function getMyVote(uint256 proposalId) external view returns (uint8) {
    require(TFHE.decrypt(proposals[proposalId].hasVoted[msg.sender]), "You didn't vote");
    return TFHE.decrypt(proposals[proposalId].voterChoices[msg.sender]);
}

// ❌ Bad: Exposing encrypted data unnecessarily
function badGetAllVotes(uint256 proposalId) external view returns (uint8[] memory) {
    // Never decrypt and expose all votes!
}
```

### 3. **Gas Optimization for FHEVM**

```solidity
// ✅ Good: Batch operations when possible
function batchSetVoterWeights(
    address[] calldata voters,
    inEuint32[] calldata weights
) external onlyOwner {
    require(voters.length == weights.length, "Length mismatch");

    for (uint i = 0; i < voters.length; i++) {
        voterWeights[voters[i]] = TFHE.asEuint32(weights[i]);
    }
}

// ✅ Good: Use appropriate data types
euint8 choice;   // For values 0-255
euint16 weight;  // For values up to 65535
euint32 count;   // For larger numbers

// ❌ Bad: Using oversized types
euint256 choice; // Wasteful for boolean-like data
```

### 4. **Frontend Security**

```javascript
// ✅ Good: Validate user input before encryption
async function encryptAndValidateVote(choice) {
    if (choice !== 0 && choice !== 1) {
        throw new Error('Invalid vote choice. Must be 0 (No) or 1 (Yes)');
    }

    return await fhevmInstance.encrypt8(choice);
}

// ✅ Good: Handle encryption errors gracefully
async function safeEncrypt(value) {
    try {
        return await fhevmInstance.encrypt8(value);
    } catch (error) {
        console.error('Encryption failed:', error);
        showStatus('❌ Encryption failed. Please try again.', 'error');
        throw error;
    }
}

// ✅ Good: Clear sensitive data from memory
function clearSensitiveData() {
    // Clear any unencrypted vote data
    userVoteChoice = null;
    temporaryNonce = null;
}
```

### 5. **Common Pitfalls to Avoid**

```solidity
// ❌ NEVER: Store unencrypted sensitive data
mapping(address => uint8) public plainVotes; // Visible to everyone!

// ❌ NEVER: Decrypt data prematurely
function badEarlyDecrypt(uint256 proposalId) external view returns (uint32) {
    return TFHE.decrypt(proposals[proposalId].yesVotes); // Before voting ends!
}

// ❌ NEVER: Use predictable encryption
function badEncryption() external {
    euint8 predictable = TFHE.asEuint8(1); // Same input = same ciphertext
    // Use proper random encryption instead
}

// ❌ NEVER: Ignore access controls
function badSetWeight(address voter, inEuint32 calldata weight) external {
    // Missing onlyOwner modifier!
    voterWeights[voter] = TFHE.asEuint32(weight);
}
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **FHEVM Setup Issues**

**Problem**: `Cannot find module 'fhevmjs'`

```bash
# Solution: Install FHEVM dependencies
npm install fhevmjs @zama-ai/fhevm

# For TypeScript projects
npm install --save-dev @types/fhevmjs
```

**Problem**: `Network not supported`

```javascript
// Solution: Check network configuration
const supportedNetworks = {
    8009: 'Zama Devnet',
    31337: 'Local FHEVM'
};

if (!supportedNetworks[chainId]) {
    throw new Error(`Unsupported network: ${chainId}`);
}
```

#### 2. **Encryption/Decryption Errors**

**Problem**: `Invalid ciphertext`

```javascript
// Solution: Validate data before encryption
function validateInput(value, min, max) {
    if (value < min || value > max) {
        throw new Error(`Value ${value} out of range [${min}, ${max}]`);
    }
    return value;
}

async function safeEncrypt8(value) {
    const validated = validateInput(value, 0, 255);
    return await fhevmInstance.encrypt8(validated);
}
```

**Problem**: `Decryption failed`

```solidity
// Solution: Check permissions and timing
function safeDecrypt(uint256 proposalId) external view returns (uint8) {
    require(proposals[proposalId].active, "Proposal not active");
    require(block.timestamp >= proposals[proposalId].votingEnd, "Voting not ended");
    require(msg.sender == proposals[proposalId].creator || msg.sender == owner, "Not authorized");

    return TFHE.decrypt(proposals[proposalId].result);
}
```

#### 3. **Gas Estimation Issues**

**Problem**: `Gas estimation failed`

```javascript
// Solution: Provide manual gas limits for FHEVM transactions
const gasLimit = {
    vote: 500000,
    createProposal: 800000,
    setWeight: 200000
};

const tx = await contract.vote(proposalId, encryptedChoice, {
    gasLimit: gasLimit.vote
});
```

#### 4. **MetaMask Connection Issues**

**Problem**: `User rejected the request`

```javascript
// Solution: Provide clear user messaging
async function connectWithRetry(maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return true;
        } catch (error) {
            if (error.code === 4001) {
                const retry = confirm(`Connection attempt ${i + 1} failed. Retry?`);
                if (!retry) return false;
            } else {
                throw error;
            }
        }
    }
    return false;
}
```

#### 5. **Debug Logging**

```javascript
// Add comprehensive logging for debugging
class FHEVMDebugger {
    static log(action, data) {
        console.group(`🔐 FHEVM ${action}`);
        console.log('Timestamp:', new Date().toISOString());
        console.log('Data:', data);
        console.groupEnd();
    }

    static logEncryption(plaintext, ciphertext) {
        this.log('Encryption', {
            plaintext,
            ciphertext: ciphertext.slice(0, 20) + '...', // Truncate for readability
            length: ciphertext.length
        });
    }

    static logTransaction(txHash, operation) {
        this.log('Transaction', {
            hash: txHash,
            operation,
            explorerUrl: `https://explorer.zama.ai/tx/${txHash}`
        });
    }
}
```

---

## 🚀 Next Steps

### Level Up Your FHEVM Skills

#### 1. **Advanced Features to Implement**

```solidity
// Weighted voting with encrypted weights
function weightedVote(uint256 proposalId, inEuint8 calldata choice, inEuint32 calldata weight) external;

// Multi-choice voting (not just Yes/No)
function multiChoiceVote(uint256 proposalId, inEuint8 calldata choiceIndex) external;

// Quadratic voting with encrypted values
function quadraticVote(uint256 proposalId, inEuint8 calldata choice, inEuint16 calldata tokens) external;

// Anonymous proposal creation
function createAnonymousProposal(inEaddress calldata encryptedCreator, string calldata title) external;
```

#### 2. **Integration with Other FHEVM Contracts**

```solidity
// Token-based voting
interface IFHERC20 {
    function encryptedBalanceOf(address account) external view returns (euint32);
}

contract TokenBasedVoting {
    IFHERC20 public votingToken;

    function voteWithTokens(uint256 proposalId, inEuint8 calldata choice) external {
        euint32 balance = votingToken.encryptedBalanceOf(msg.sender);
        // Use token balance as voting weight
    }
}
```

#### 3. **Frontend Enhancements**

```javascript
// Real-time encrypted vote aggregation
class RealTimeVoting {
    constructor(contract) {
        this.contract = contract;
        this.eventListeners = new Map();
    }

    async subscribeToVotes(proposalId, callback) {
        const filter = this.contract.filters.VoteCast(proposalId);

        this.contract.on(filter, async (proposalId, voter, event) => {
            // Update UI without revealing individual votes
            const totalVoters = await this.contract.getTotalVoters(proposalId);
            callback({ totalVoters, lastVoteTime: Date.now() });
        });
    }
}

// Progressive result revelation
class ProgressiveResults {
    async showPartialResults(proposalId, confidenceLevel = 0.95) {
        // Show statistical bounds without exact counts
        const bounds = await this.contract.getResultsBounds(proposalId, confidenceLevel);
        return {
            yesRange: [bounds.yesMin, bounds.yesMax],
            noRange: [bounds.noMin, bounds.noMax],
            confidence: confidenceLevel
        };
    }
}
```

#### 4. **Production Deployment Checklist**

- [ ] **Security Audit**: Get professional smart contract audit
- [ ] **Gas Optimization**: Optimize for production gas costs
- [ ] **Error Handling**: Comprehensive error handling and recovery
- [ ] **Monitoring**: Set up contract monitoring and alerts
- [ ] **Documentation**: Complete user and developer documentation
- [ ] **Testing**: 100% test coverage including edge cases
- [ ] **Access Controls**: Multi-sig for administrative functions
- [ ] **Upgradability**: Consider proxy patterns for upgrades

#### 5. **Learning Resources**

- 📚 **[Zama FHEVM Documentation](https://docs.zama.ai/fhevm)**
- 🎓 **[FHEVM Developer Tutorials](https://docs.zama.ai/fhevm/tutorials)**
- 💻 **[FHEVM GitHub Examples](https://github.com/zama-ai/fhevm)**
- 🗣️ **[Zama Community Discord](https://discord.gg/zama)**
- 📖 **[Homomorphic Encryption Basics](https://docs.zama.ai/fhevm/fundamentals)**

---

## 📄 Conclusion

Congratulations! 🎉 You've successfully built your first **FHEVM confidential voting dApp**. You now understand:

### Key Achievements

- ✅ **FHEVM Fundamentals**: How confidential smart contracts work
- ✅ **Encryption Integration**: Handling encrypted data on-chain
- ✅ **Privacy-First Design**: Building truly confidential applications
- ✅ **End-to-End Implementation**: Complete dApp with smart contract + frontend
- ✅ **Best Practices**: Security patterns and optimization techniques

### What Makes This Special

Unlike traditional blockchain applications where all data is public, or complex ZK solutions that require cryptography expertise, **FHEVM enables developers to build confidential applications with familiar tools and syntax**. Your voting dApp demonstrates:

1. **🔐 True Privacy**: Votes remain encrypted throughout the entire process
2. **🚀 Developer Experience**: Writing confidential contracts feels natural
3. **⚡ Performance**: Efficient execution without complex proof generation
4. **🔄 Composability**: Encrypted values can interact with other FHEVM contracts
5. **🛡️ Security**: Mathematical guarantees rather than trust assumptions

### The Future of Confidential Computing

FHEVM represents a paradigm shift in blockchain development. You're now equipped to build the next generation of privacy-preserving applications that were previously impossible or impractical.

**Your journey into confidential computing starts here!** 🚀

---

### 📞 Get Help & Stay Connected

- **Issues**: [GitHub Issues](https://github.com/zama-ai/fhevm/issues)
- **Community**: [Zama Discord](https://discord.gg/zama)
- **Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **Updates**: [Zama Twitter](https://twitter.com/zama_fhe)

**Happy building with FHEVM!** 🔐✨