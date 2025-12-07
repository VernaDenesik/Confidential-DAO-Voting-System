# 🚀 Quick Start Guide - Hello FHEVM Voting dApp

## ⚡ Get Started in 5 Minutes

This quick start guide gets you up and running with the Hello FHEVM voting dApp in minutes.

### 📋 Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Basic familiarity with Web3 development

### 🛠️ Step 1: Environment Setup

```bash
# Clone or create project directory
mkdir hello-fhevm-voting
cd hello-fhevm-voting

# Initialize project
npm init -y

# Install FHEVM dependencies
npm install fhevmjs @zama-ai/fhevm ethers hardhat
```

### 🔧 Step 2: Configure Hardhat

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.24",
  networks: {
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 8009,
    }
  }
};
```

### 📝 Step 3: Smart Contract

Create `contracts/ConfidentialVoting.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@zama-ai/fhevm/contracts/TFHE.sol";

contract ConfidentialVoting {
    struct Proposal {
        string title;
        string description;
        euint32 yesVotes;
        euint32 noVotes;
        uint256 votingEnd;
        bool active;
        mapping(address => ebool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function createProposal(string memory title, string memory description) external {
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.title = title;
        p.description = description;
        p.yesVotes = TFHE.asEuint32(0);
        p.noVotes = TFHE.asEuint32(0);
        p.votingEnd = block.timestamp + 7 days;
        p.active = true;
    }

    function vote(uint256 proposalId, inEuint8 calldata encryptedChoice) external {
        require(proposalId <= proposalCount, "Invalid proposal");

        Proposal storage p = proposals[proposalId];
        require(p.active && block.timestamp < p.votingEnd, "Voting ended");
        require(!TFHE.decrypt(p.hasVoted[msg.sender]), "Already voted");

        euint8 choice = TFHE.asEuint8(encryptedChoice);
        p.hasVoted[msg.sender] = TFHE.asEbool(true);

        // Add vote: if choice == 1, add to yes, else add to no
        ebool isYes = TFHE.eq(choice, TFHE.asEuint8(1));
        p.yesVotes = TFHE.add(p.yesVotes, TFHE.cmux(isYes, TFHE.asEuint32(1), TFHE.asEuint32(0)));
        p.noVotes = TFHE.add(p.noVotes, TFHE.cmux(isYes, TFHE.asEuint32(0), TFHE.asEuint32(1)));
    }

    function getResults(uint256 proposalId) external view returns (uint32, uint32) {
        require(block.timestamp >= proposals[proposalId].votingEnd, "Voting not ended");
        return (TFHE.decrypt(proposals[proposalId].yesVotes), TFHE.decrypt(proposals[proposalId].noVotes));
    }
}
```

### 🌐 Step 4: Frontend

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hello FHEVM Voting</title>
    <script src="https://unpkg.com/ethers@6.9.2/dist/ethers.umd.min.js"></script>
</head>
<body>
    <h1>🔐 Hello FHEVM Voting</h1>

    <div id="app">
        <button onclick="connectWallet()">Connect MetaMask</button>

        <div id="connected" style="display:none;">
            <h2>Create Proposal</h2>
            <input id="title" placeholder="Proposal title">
            <textarea id="description" placeholder="Description"></textarea>
            <button onclick="createProposal()">Create</button>

            <h2>Vote</h2>
            <input id="proposalId" type="number" placeholder="Proposal ID">
            <button onclick="vote(1)">Vote YES</button>
            <button onclick="vote(0)">Vote NO</button>

            <div id="status"></div>
        </div>
    </div>

    <script type="module">
        import { createFhevmInstance } from 'https://unpkg.com/fhevmjs/web/index.js';

        let contract, signer, fhevm;
        const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

        window.connectWallet = async () => {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                signer = await provider.getSigner();

                // Initialize FHEVM
                fhevm = await createFhevmInstance({ chainId: 8009 });

                // Contract ABI (simplified)
                const abi = [
                    "function createProposal(string memory title, string memory description) external",
                    "function vote(uint256 proposalId, bytes calldata encryptedChoice) external",
                    "function getResults(uint256 proposalId) external view returns (uint32, uint32)"
                ];

                contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

                document.getElementById('connected').style.display = 'block';
                showStatus('✅ Connected!');
            } catch (error) {
                showStatus('❌ Connection failed: ' + error.message);
            }
        };

        window.createProposal = async () => {
            try {
                const title = document.getElementById('title').value;
                const description = document.getElementById('description').value;

                showStatus('🔄 Creating proposal...');
                const tx = await contract.createProposal(title, description);
                await tx.wait();

                showStatus('✅ Proposal created!');
            } catch (error) {
                showStatus('❌ Failed: ' + error.message);
            }
        };

        window.vote = async (choice) => {
            try {
                const proposalId = document.getElementById('proposalId').value;

                showStatus('🔐 Encrypting vote...');
                const encryptedChoice = await fhevm.encrypt8(choice);

                showStatus('🗳️ Casting vote...');
                const tx = await contract.vote(proposalId, encryptedChoice);
                await tx.wait();

                showStatus(`✅ Vote cast: ${choice ? 'YES' : 'NO'}`);
            } catch (error) {
                showStatus('❌ Vote failed: ' + error.message);
            }
        };

        function showStatus(message) {
            document.getElementById('status').innerHTML = message;
        }
    </script>
</body>
</html>
```

### 🚀 Step 5: Deploy & Test

```bash
# Compile contract
npx hardhat compile

# Deploy to Zama devnet
npx hardhat run scripts/deploy.js --network zama

# Update CONTRACT_ADDRESS in index.html
# Open index.html in browser
# Connect MetaMask to Zama devnet
# Start voting with full privacy!
```

### 🎯 What You Built

- ✅ **Confidential Voting**: Votes encrypted with FHEVM
- ✅ **Privacy-Preserving**: No one can see individual votes
- ✅ **Real-time**: Instant encrypted vote aggregation
- ✅ **Secure**: Mathematical privacy guarantees

### 🔧 Network Configuration

Add Zama devnet to MetaMask:
- **Network Name**: Zama FHEVM Devnet
- **RPC URL**: https://devnet.zama.ai/
- **Chain ID**: 8009
- **Currency**: ETH
- **Explorer**: https://explorer.zama.ai/

### 🎉 Next Steps

1. Create sample proposals
2. Cast encrypted votes
3. View results after voting ends
4. Explore the full tutorial: `HELLO_FHEVM_TUTORIAL.md`

**You're now building with confidential smart contracts!** 🔐✨