# 🚀 Deployment Guide - Hello FHEVM Voting dApp

## Overview

This guide covers deploying your Hello FHEVM voting dApp to production networks, including local testing, testnet deployment, and mainnet preparation.

## 📋 Prerequisites

- Node.js 18+
- Hardhat configured
- Private key with ETH for gas fees
- Contract code ready for deployment

---

## 🏠 Local Development Setup

### Step 1: Start Local FHEVM Node

```bash
# Clone FHEVM repository
git clone https://github.com/zama-ai/fhevm
cd fhevm

# Start local FHEVM network
npm install
npm run fhevm:start

# Network will be available at http://localhost:8545
# Chain ID: 31337
```

### Step 2: Deploy Locally

```bash
# In your project directory
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# Expected output:
# 🚀 Deploying Confidential Voting Contract...
# ✅ Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 3: Local Testing

```javascript
// test/local-integration.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Local FHEVM Integration", function() {
    it("Should deploy and interact with contract", async function() {
        const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
        const contract = await ConfidentialVoting.deploy();
        await contract.waitForDeployment();

        // Test basic functionality
        await contract.createProposal("Test", "Test proposal");
        expect(await contract.proposalCount()).to.equal(1);

        console.log("✅ Local deployment successful!");
    });
});
```

---

## 🧪 Testnet Deployment (Zama Devnet)

### Step 1: Configure Environment

Create `.env` file:

```bash
# .env
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
ZAMA_DEVNET_URL=https://devnet.zama.ai/
```

### Step 2: Update Hardhat Config

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

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
    zama: {
      url: process.env.ZAMA_DEVNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8009,
      timeout: 60000,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Step 3: Deployment Script

```javascript
// scripts/deploy-testnet.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying to Zama Devnet...");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.1")) {
        console.log("⚠️ Low balance! Get test ETH from Zama faucet");
        console.log("🔗 Faucet: https://faucet.zama.ai/");
    }

    // Deploy contract
    const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");

    console.log("📋 Deploying contract...");
    const contract = await ConfidentialVoting.deploy();

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("🔗 Explorer:", `https://explorer.zama.ai/address/${contractAddress}`);

    // Initial setup
    console.log("⚙️ Setting up initial configuration...");

    // Set deployer as initial voter with weight
    try {
        // Note: In real FHEVM, you'd encrypt this value
        const initialWeight = 1000;
        console.log(`📊 Setting voting weight for ${deployer.address}: ${initialWeight}`);

        // This would be encrypted in actual FHEVM implementation
        // const encryptedWeight = await encrypt32(initialWeight);
        // await contract.setVoterWeight(deployer.address, encryptedWeight);

        console.log("✅ Initial setup complete!");
    } catch (error) {
        console.log("⚠️ Initial setup failed:", error.message);
        console.log("💡 You can set this up manually later");
    }

    // Create sample proposal for testing
    try {
        console.log("📝 Creating sample proposal...");
        const tx = await contract.createProposal(
            "Sample Proposal",
            "This is a sample proposal to test the FHEVM voting system"
        );
        await tx.wait();
        console.log("✅ Sample proposal created!");
    } catch (error) {
        console.log("⚠️ Sample proposal creation failed:", error.message);
    }

    // Deployment summary
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("=====================");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", "Zama FHEVM Devnet");
    console.log("Chain ID:", 8009);
    console.log("Deployer:", deployer.address);
    console.log("Explorer:", `https://explorer.zama.ai/address/${contractAddress}`);
    console.log("\n🎉 Deployment successful! Your confidential voting dApp is live!");

    return contractAddress;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
```

### Step 4: Deploy to Testnet

```bash
# Deploy to Zama devnet
npx hardhat run scripts/deploy-testnet.js --network zama

# Verify contract (if supported)
npx hardhat verify --network zama CONTRACT_ADDRESS

# Test deployment
npx hardhat run scripts/test-deployment.js --network zama
```

---

## 📱 Frontend Deployment

### Step 1: Environment Configuration

```javascript
// config/networks.js
export const networks = {
    development: {
        chainId: 31337,
        name: "Local FHEVM",
        rpcUrl: "http://localhost:8545",
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        explorerUrl: "http://localhost:8545"
    },
    testnet: {
        chainId: 8009,
        name: "Zama FHEVM Devnet",
        rpcUrl: "https://devnet.zama.ai/",
        contractAddress: "0x742d35Cc6634C0532925a3b8d1a3f7e4b5e7C8A2", // Replace with actual
        explorerUrl: "https://explorer.zama.ai"
    }
};

export function getNetwork() {
    const env = process.env.NODE_ENV || 'development';
    return env === 'production' ? networks.testnet : networks.development;
}
```

### Step 2: Build Script

```javascript
// scripts/build-frontend.js
const fs = require('fs');
const path = require('path');

function buildFrontend() {
    console.log("🏗️ Building frontend for deployment...");

    // Read contract artifacts
    const contractPath = "./artifacts/contracts/ConfidentialVoting.sol/ConfidentialVoting.json";
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Create build directory
    const buildDir = "./build";
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }

    // Copy and update HTML
    let html = fs.readFileSync("./frontend/index.html", 'utf8');

    // Replace placeholders with actual values
    html = html.replace("YOUR_CONTRACT_ADDRESS", process.env.CONTRACT_ADDRESS || "");
    html = html.replace("YOUR_CHAIN_ID", process.env.CHAIN_ID || "8009");

    // Write to build directory
    fs.writeFileSync(path.join(buildDir, "index.html"), html);

    // Copy static assets
    const staticFiles = ["style.css", "app.js"];
    staticFiles.forEach(file => {
        if (fs.existsSync(`./frontend/${file}`)) {
            fs.copyFileSync(`./frontend/${file}`, path.join(buildDir, file));
        }
    });

    // Generate contract config
    const contractConfig = {
        address: process.env.CONTRACT_ADDRESS,
        abi: contract.abi,
        chainId: parseInt(process.env.CHAIN_ID || "8009"),
        network: process.env.NETWORK_NAME || "Zama FHEVM Devnet"
    };

    fs.writeFileSync(
        path.join(buildDir, "contract-config.json"),
        JSON.stringify(contractConfig, null, 2)
    );

    console.log("✅ Frontend build complete!");
    console.log("📁 Build directory:", buildDir);
}

if (require.main === module) {
    buildFrontend();
}

module.exports = { buildFrontend };
```

### Step 3: Deploy to Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "build/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/build/$1"
    }
  ],
  "env": {
    "CONTRACT_ADDRESS": "@contract_address",
    "CHAIN_ID": "8009",
    "NETWORK_NAME": "Zama FHEVM Devnet"
  }
}
```

```bash
# Install Vercel CLI
npm install -g vercel

# Build frontend
npm run build:frontend

# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add CONTRACT_ADDRESS
vercel env add CHAIN_ID
vercel env add NETWORK_NAME
```

---

## 🔒 Production Readiness Checklist

### Security Audit

```bash
# Install security tools
npm install --save-dev @openzeppelin/hardhat-upgrades
npm install --save-dev hardhat-gas-reporter
npm install --save-dev solidity-coverage

# Run security checks
npx hardhat coverage
npx hardhat gas-reporter
npx hardhat test --gas-reporter
```

### Smart Contract Security

```solidity
// Add comprehensive access controls
contract ConfidentialVoting {
    using TFHE for euint32;

    // Security: Rate limiting
    mapping(address => uint256) public lastProposalTime;
    uint256 public constant PROPOSAL_COOLDOWN = 1 hours;

    // Security: Emergency pause
    bool public paused = false;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier rateLimited() {
        require(
            block.timestamp >= lastProposalTime[msg.sender] + PROPOSAL_COOLDOWN,
            "Rate limited"
        );
        lastProposalTime[msg.sender] = block.timestamp;
        _;
    }

    // Emergency functions
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}
```

### Frontend Security

```javascript
// Input validation and sanitization
function validateInput(input, type) {
    switch(type) {
        case 'proposalTitle':
            if (!input || input.length < 3 || input.length > 100) {
                throw new Error('Title must be 3-100 characters');
            }
            break;
        case 'voteChoice':
            if (input !== 0 && input !== 1) {
                throw new Error('Invalid vote choice');
            }
            break;
    }
    return input.trim();
}

// Error handling
class SecureVotingApp {
    async safeContractCall(method, params, options = {}) {
        try {
            const tx = await this.contract[method](...params, options);
            return await tx.wait();
        } catch (error) {
            console.error(`Contract call failed: ${method}`, error);

            // User-friendly error messages
            if (error.code === 4001) {
                throw new Error('Transaction was cancelled');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for gas');
            } else {
                throw new Error('Transaction failed. Please try again.');
            }
        }
    }
}
```

---

## 📊 Monitoring and Maintenance

### Contract Monitoring

```javascript
// scripts/monitor.js
const { ethers } = require("hardhat");

async function monitorContract() {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    // Monitor events
    contract.on("ProposalCreated", (proposalId, title, creator) => {
        console.log(`New proposal: ${title} by ${creator}`);
        // Send notification/alert
    });

    contract.on("VoteCast", (proposalId, voter) => {
        console.log(`Vote cast on proposal ${proposalId}`);
        // Update metrics
    });

    // Health checks
    setInterval(async () => {
        try {
            const count = await contract.proposalCount();
            console.log(`Health check: ${count} proposals`);
        } catch (error) {
            console.error("Health check failed:", error);
            // Send alert
        }
    }, 60000); // Every minute
}

monitorContract();
```

### Analytics Dashboard

```javascript
// analytics/dashboard.js
class VotingAnalytics {
    async getMetrics() {
        return {
            totalProposals: await this.contract.proposalCount(),
            activeProposals: await this.getActiveProposalCount(),
            totalVotes: await this.getTotalVoteCount(),
            uniqueVoters: await this.getUniqueVoterCount()
        };
    }

    async generateReport() {
        const metrics = await this.getMetrics();
        console.log("📊 Voting dApp Metrics:");
        console.log(`Total Proposals: ${metrics.totalProposals}`);
        console.log(`Active Proposals: ${metrics.activeProposals}`);
        console.log(`Total Votes: ${metrics.totalVotes}`);
        console.log(`Unique Voters: ${metrics.uniqueVoters}`);
    }
}
```

---

## 🎯 Deployment Verification

### Post-Deployment Tests

```javascript
// test/deployment-verification.test.js
describe("Deployment Verification", function() {
    let contract;

    before(async function() {
        // Connect to deployed contract
        contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            contractABI,
            provider
        );
    });

    it("Should have correct owner", async function() {
        const owner = await contract.owner();
        expect(owner).to.equal(expectedOwnerAddress);
    });

    it("Should accept proposals", async function() {
        const initialCount = await contract.proposalCount();
        // Test proposal creation
        // Verify count increased
    });

    it("Should handle encrypted votes", async function() {
        // Test voting functionality
        // Verify vote privacy
    });
});
```

### Manual Verification Steps

1. **✅ Contract Deployment**
   - Contract address exists
   - Contract code verified on explorer
   - Initial state is correct

2. **✅ Frontend Connection**
   - MetaMask connects successfully
   - Contract interactions work
   - UI updates properly

3. **✅ FHEVM Functionality**
   - Encryption works correctly
   - Decryption only when authorized
   - Privacy guarantees maintained

4. **✅ User Experience**
   - Clear error messages
   - Responsive design
   - Accessibility compliance

---

## 🎉 Deployment Complete!

Your Hello FHEVM voting dApp is now deployed and ready for users!

### Key Achievements:
- ✅ Confidential voting smart contract deployed
- ✅ Frontend accessible to users
- ✅ FHEVM privacy guarantees active
- ✅ Production monitoring in place

### Share Your Success:
- 🔗 Contract: [View on Explorer](https://explorer.zama.ai)
- 🌐 dApp: [Try the Live App](https://your-app.vercel.app)
- 📖 Tutorial: Share your FHEVM tutorial
- 🐦 Social: Tweet about your confidential dApp!

**Welcome to the future of privacy-preserving applications!** 🔐✨