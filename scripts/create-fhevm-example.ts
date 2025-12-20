#!/usr/bin/env ts-node

/**
 * create-fhevm-example - CLI tool to generate standalone FHEVM voting example repositories
 *
 * This script creates a complete, ready-to-use Hardhat project for a single FHEVM voting example.
 * It:
 * 1. Clones the base template
 * 2. Copies contract and test files
 * 3. Updates configuration and package.json
 * 4. Generates documentation
 * 5. Creates deployment scripts
 *
 * Usage: npx ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
 *
 * Examples:
 *   npx ts-node scripts/create-fhevm-example.ts fhevm-voting ./my-voting-example
 *   npx ts-node scripts/create-fhevm-example.ts secure-voting-advanced ./examples/voting
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Color codes for terminal output
enum Color {
  Reset = "\x1b[0m",
  Green = "\x1b[32m",
  Blue = "\x1b[34m",
  Yellow = "\x1b[33m",
  Red = "\x1b[31m",
  Cyan = "\x1b[36m",
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

function warning(message: string): void {
  log(`⚠️  ${message}`, Color.Yellow);
}

// Example configuration
interface ExampleConfig {
  contract: string;
  test: string;
  description: string;
}

// Map of available examples
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "fhe-counter": {
    contract: "contracts/basic/FHECounter.sol",
    test: "test/basic/FHECounter.ts",
    description:
      "Basic encrypted counter demonstrating FHE operations, permissions, and arithmetic",
  },
  "encrypt-single-value": {
    contract: "contracts/basic/EncryptSingleValue.sol",
    test: "test/basic/EncryptSingleValue.ts",
    description:
      "Demonstrates encrypted input validation, proof verification, and common pitfalls",
  },
  "fhevm-voting": {
    contract: "base-template/contracts/FHEMVoting.sol",
    test: "base-template/test/FHEMVoting.ts",
    description:
      "Advanced voting system with commit-reveal, weighted votes, and multi-phase governance",
  },
};

function showHelp(): void {
  log("FHEVM Voting Example Generator", Color.Cyan);
  log("================================\n", Color.Cyan);
  console.log(`Usage: npx ts-node scripts/create-fhevm-example.ts <example> [output-dir]

Arguments:
  example      Name of the example to generate
  output-dir   Output directory (default: ./examples/<example>)

Available Examples:`);

  for (const [name, config] of Object.entries(EXAMPLES_MAP)) {
    console.log(`  ${name.padEnd(25)} ${config.description}`);
  }

  console.log(`\nExamples:
  npx ts-node scripts/create-fhevm-example.ts fhevm-voting ./my-voting
  npx ts-node scripts/create-fhevm-example.ts fhevm-voting

Options:
  --help                 Show this help message
  --list                 List available examples`);
}

function listExamples(): void {
  log("Available FHEVM Voting Examples:", Color.Cyan);
  log("=================================\n", Color.Cyan);

  for (const [name, config] of Object.entries(EXAMPLES_MAP)) {
    log(`📦 ${name}`, Color.Green);
    console.log(`   ${config.description}`);
    console.log(`   Contract: ${config.contract}`);
    console.log(`   Test: ${config.test}\n`);
  }
}

function copyFileSync(src: string, dest: string): void {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src: string, dest: string, exclude: string[] = []): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    // Skip excluded files
    if (exclude.includes(file)) continue;

    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function generateREADME(example: string, config: ExampleConfig, outputDir: string): void {
  const readmeContent = `# FHEVM Voting - ${example}

${config.description}

## Overview

This is a standalone FHEVM example repository demonstrating secure voting using Fully Homomorphic Encryption.

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7

### Installation

\`\`\`bash
npm install
\`\`\`

### Compile Contracts

\`\`\`bash
npm run compile
\`\`\`

### Run Tests

\`\`\`bash
npm test
\`\`\`

### Test with Gas Report

\`\`\`bash
REPORT_GAS=true npm test
\`\`\`

### Generate Coverage Report

\`\`\`bash
npm run coverage
\`\`\`

## Project Structure

\`\`\`
├── contracts/
│   └── FHEMVoting.sol      # Main voting contract
├── test/
│   └── FHEMVoting.ts       # Comprehensive test suite
├── deploy/                  # Deployment scripts
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Dependencies
└── README.md               # This file
\`\`\`

## Key Concepts

### Voting Flow

1. **Proposal Creation**: Anyone with sufficient voting power can create proposals
2. **Commit Phase**: Voters submit encrypted vote commitments using nonces
3. **Reveal Phase**: Voters reveal actual votes with verification
4. **Execution Phase**: Proposal can be executed after reveal period

### FHEVM Patterns Demonstrated

- **Encrypted Aggregation**: FHE.add for accumulating encrypted votes
- **Permission Management**: FHE.allowThis() and FHE.allow() for access control
- **Commit-Reveal Voting**: Privacy-preserving voting mechanism
- **Weighted Voting**: Different voting power for different participants

### Security Features

- Hash verification prevents vote tampering
- Double-vote prevention through state tracking
- Time-locked phases for coordinated voting
- Weighted voting power system

## Testing

The test suite includes:

✅ Proposal creation with voting power validation
✅ Vote commitment hash generation
✅ Commit phase timing enforcement
✅ Reveal phase verification
✅ Vote tallying with encrypted aggregation
✅ Double voting prevention
✅ Proposal execution logic
✅ Access control mechanisms
✅ Edge cases and error conditions

Run tests with:

\`\`\`bash
npm test
\`\`\`

## Smart Contract

### Contract: FHEMVoting

The main contract implements secure voting using FHEVM encryption.

**Key Functions:**

- \`createProposal(string title, string description)\` - Create new proposal
- \`commitVote(uint256 proposalId, bytes32 voteHash)\` - Commit encrypted vote
- \`revealVote(uint256 proposalId, bool support, uint256 nonce)\` - Reveal and tally vote
- \`executeProposal(uint256 proposalId)\` - Execute proposal after reveal

**Voter Management:**

- \`setVoterWeight(address voter, uint256 weight)\` - Set individual voting weight
- \`setMultipleVoterWeights(address[] voters, uint256[] weights)\` - Batch set weights

## Learning Resources

### FHEVM Concepts

1. **Fully Homomorphic Encryption**: Encrypt data, compute on it, decrypt results
2. **Commit-Reveal Pattern**: Two-phase voting for privacy and integrity
3. **Encrypted Arithmetic**: FHE.add for accumulating encrypted votes
4. **Permission System**: FHE.allow controls decryption access

### Further Reading

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [Zama Community](https://www.zama.ai/community)

## Deployment

### Local Testing

\`\`\`bash
npx hardhat node
\`\`\`

### Deploy to Sepolia Testnet

1. Create \`.env\` file with:
\`\`\`env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
\`\`\`

2. Deploy:
\`\`\`bash
npx hardhat run scripts/deploy.ts --network sepolia
\`\`\`

3. Verify:
\`\`\`bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
\`\`\`

## Development

### Code Style

Code follows these conventions:
- Solidity: NatSpec documentation on all functions
- Tests: Clear test names describing behavior
- TypeScript: Strict mode enabled, full type safety

### Linting

\`\`\`bash
npm run lint
npm run prettier:write
\`\`\`

### Building

\`\`\`bash
npm run build:ts
\`\`\`

## License

BSD-3-Clause-Clear License

## Support

For questions and support:
- [Zama Community Forum](https://www.zama.ai/community)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)
- [Discord](https://discord.com/invite/zama)

---

**Built for the Zama FHEVM Bounty Program**

*Advancing privacy-preserving blockchain governance with Fully Homomorphic Encryption*
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), readmeContent);
}

function generateDeploymentScript(outputDir: string): void {
  const deployScript = `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FHEMVoting contract with account:", deployer.address);

  const FHEMVoting = await ethers.getContractFactory("FHEMVoting");
  const voting = await FHEMVoting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("FHEMVoting deployed to:", address);

  // Setup voter weights
  const voters = [deployer.address];
  const weights = [1000]; // Owner has 1000 voting power

  await voting.setMultipleVoterWeights(voters, weights);
  console.log("Voter weights configured");

  // Display deployment info
  console.log("\\nDeployment Summary:");
  console.log("====================");
  console.log("Contract Address:", address);
  console.log("Deployer:", deployer.address);
  console.log("Initial Voting Status: Active");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;

  const deployDir = path.join(outputDir, "scripts");
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  fs.writeFileSync(path.join(deployDir, "deploy.ts"), deployScript);
}

function createExample(exampleName: string, outputDir?: string): void {
  // Validate example name
  if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}`);
  }

  // Set output directory
  const finalOutputDir = outputDir || path.join("examples", exampleName);
  const absoluteOutputDir = path.resolve(finalOutputDir);

  info(`Creating FHEVM voting example: ${exampleName}`);
  info(`Output directory: ${absoluteOutputDir}`);

  // Check if output directory already exists
  if (fs.existsSync(absoluteOutputDir)) {
    warning(`Output directory already exists: ${absoluteOutputDir}`);
    warning("Files will be overwritten");
  }

  try {
    // Create output directory
    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
    }

    info("Copying base template...");

    // Copy base template files, excluding node_modules and specific directories
    const baseTemplateDir = path.resolve("base-template");
    if (!fs.existsSync(baseTemplateDir)) {
      error(`Base template not found at ${baseTemplateDir}`);
    }

    copyDir(baseTemplateDir, absoluteOutputDir, [
      "node_modules",
      ".git",
      "fhevmTemp",
      "artifacts",
      "cache",
      "coverage",
      "dist",
    ]);

    success("Base template copied");

    info("Generating example-specific files...");

    // Generate README
    generateREADME(exampleName, EXAMPLES_MAP[exampleName], absoluteOutputDir);
    success("README.md generated");

    // Generate deployment script
    generateDeploymentScript(absoluteOutputDir);
    success("Deployment script generated");

    // Create .gitignore
    const gitignore = `node_modules/
.env
.env.local
dist/
artifacts/
cache/
coverage/
types/
fhevmTemp/
.DS_Store
*.log
`;
    fs.writeFileSync(path.join(absoluteOutputDir, ".gitignore"), gitignore);

    // Create .env.example if it doesn't exist
    if (!fs.existsSync(path.join(absoluteOutputDir, ".env.example"))) {
      const envExample = `SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_api_key
REPORT_GAS=false
`;
      fs.writeFileSync(path.join(absoluteOutputDir, ".env.example"), envExample);
    }

    success(`Example project created successfully!`);
    success(`Location: ${absoluteOutputDir}`);

    log("\nNext steps:", Color.Cyan);
    console.log(`1. cd ${finalOutputDir}`);
    console.log(`2. npm install`);
    console.log(`3. npm run compile`);
    console.log(`4. npm test`);

    info("For more details, see README.md in the generated directory");
  } catch (err) {
    error(`Failed to create example: ${err}`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  showHelp();
  process.exit(0);
}

if (args.includes("--list") || args.includes("-l")) {
  listExamples();
  process.exit(0);
}

if (args.length === 0) {
  error("No example specified. Use --help for usage information.");
}

const exampleName = args[0];
const outputDir = args[1];

createExample(exampleName, outputDir);
