#!/usr/bin/env ts-node

/**
 * generate-docs - CLI tool to generate GitBook documentation from code
 *
 * This script automatically generates markdown documentation from:
 * 1. Contract NatSpec comments
 * 2. Test file documentation
 * 3. Code structure and patterns
 *
 * The generated documentation is GitBook-compatible and includes:
 * - Concept explanations
 * - Code examples
 * - Test patterns
 * - Best practices
 *
 * Usage: npx ts-node scripts/generate-docs.ts [example-name]
 *
 * Examples:
 *   npx ts-node scripts/generate-docs.ts fhevm-voting
 *   npx ts-node scripts/generate-docs.ts --all
 */

import * as fs from "fs";
import * as path from "path";

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

// Documentation configuration
interface DocConfig {
  name: string;
  description: string;
  contractFile: string;
  testFile: string;
  category: string;
}

const DOCS_CONFIG: Record<string, DocConfig> = {
  "fhevm-voting": {
    name: "FHEVM Voting System",
    description: "Privacy-preserving voting using Fully Homomorphic Encryption",
    contractFile: "base-template/contracts/FHEMVoting.sol",
    testFile: "base-template/test/FHEMVoting.ts",
    category: "Advanced Examples",
  },
};

function showHelp(): void {
  log("FHEVM Documentation Generator", Color.Cyan);
  log("==============================\n", Color.Cyan);
  console.log(`Usage: npx ts-node scripts/generate-docs.ts [example-name]

Arguments:
  example-name    Name of the example (optional)

Options:
  --all           Generate documentation for all examples
  --help          Show this help message
  --list          List available examples

Available Examples:`);

  for (const [name, config] of Object.entries(DOCS_CONFIG)) {
    console.log(`  ${name.padEnd(20)} ${config.description}`);
  }

  console.log(`\nExamples:
  npx ts-node scripts/generate-docs.ts fhevm-voting
  npx ts-node scripts/generate-docs.ts --all`);
}

function listExamples(): void {
  log("Available Documentation Examples:", Color.Cyan);
  log("==================================\n", Color.Cyan);

  for (const [name, config] of Object.entries(DOCS_CONFIG)) {
    log(`📚 ${name}`, Color.Green);
    console.log(`   ${config.description}`);
    console.log(`   Category: ${config.category}\n`);
  }
}

function extractNatSpec(content: string): Map<string, string> {
  const natSpecMap = new Map<string, string>();
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes("///")) {
      let docBlock = "";
      let functionName = "";

      // Collect documentation block
      while (i < lines.length && lines[i].includes("///")) {
        docBlock += lines[i].replace(/^\s*\/\/\/\s?/, "") + "\n";
        i++;
      }

      // Find next function/modifier/contract declaration
      while (i < lines.length) {
        if (
          lines[i].includes("function ") ||
          lines[i].includes("modifier ") ||
          lines[i].includes("contract ")
        ) {
          const match = lines[i].match(/(?:function|modifier|contract)\s+(\w+)/);
          if (match) {
            functionName = match[1];
            natSpecMap.set(functionName, docBlock);
          }
          break;
        }
        i++;
      }
    }
    i++;
  }

  return natSpecMap;
}

function extractTestPatterns(content: string): string[] {
  const patterns: string[] = [];
  const testRegex = /it\("(.+?)",/g;
  let match;

  while ((match = testRegex.exec(content)) !== null) {
    patterns.push(match[1]);
  }

  return patterns;
}

function generateDocumentation(exampleName: string, config: DocConfig): string {
  let doc = `# ${config.name}\n\n`;
  doc += `${config.description}\n\n`;

  // Overview section
  doc += `## Overview\n\n`;
  doc += `This example demonstrates secure voting using FHEVM encryption.\n\n`;

  // Key Concepts
  doc += `## Key Concepts\n\n`;
  doc += `### 1. Fully Homomorphic Encryption (FHEVM)\n`;
  doc += `- Encrypt data on-chain\n`;
  doc += `- Perform computations on encrypted values\n`;
  doc += `- Decrypt results only by authorized parties\n\n`;

  doc += `### 2. Commit-Reveal Voting\n`;
  doc += `- **Commit Phase**: Voters submit vote commitments (hashes)\n`;
  doc += `- **Reveal Phase**: Voters reveal actual votes with verification\n`;
  doc += `- Prevents vote selling and coercion\n\n`;

  doc += `### 3. Weighted Voting\n`;
  doc += `- Different voting power for different participants\n`;
  doc += `- Governance token integration\n`;
  doc += `- Batch weight assignment\n\n`;

  // Smart Contract Section
  if (fs.existsSync(config.contractFile)) {
    doc += `## Smart Contract\n\n`;

    const contractContent = fs.readFileSync(config.contractFile, "utf-8");
    const natSpecMap = extractNatSpec(contractContent);

    doc += `### Key Functions\n\n`;

    const functionNames = ["createProposal", "commitVote", "revealVote", "executeProposal"];
    for (const funcName of functionNames) {
      if (natSpecMap.has(funcName)) {
        doc += `#### ${funcName}\n`;
        doc += `${natSpecMap.get(funcName)}\n\n`;
      }
    }

    // Show main contract structure
    doc += `### Data Structures\n\n`;
    doc += "The contract manages:\n";
    doc += "- **Proposals**: Voting items with voting windows\n";
    doc += "- **Vote Commitments**: Hash-based vote privacy\n";
    doc += "- **Voter Weights**: Weighted voting power system\n\n";
  }

  // Testing Section
  if (fs.existsSync(config.testFile)) {
    doc += `## Testing\n\n`;

    const testContent = fs.readFileSync(config.testFile, "utf-8");
    const testPatterns = extractTestPatterns(testContent);

    doc += `The test suite includes ${testPatterns.length} comprehensive tests covering:\n\n`;

    // Group tests by category
    const successTests = testPatterns.filter((p) => p.includes("✅"));
    const failureTests = testPatterns.filter((p) => p.includes("❌"));

    if (successTests.length > 0) {
      doc += `### Success Cases (✅)\n`;
      for (const test of successTests.slice(0, 5)) {
        doc += `- ${test}\n`;
      }
      doc += `\n`;
    }

    if (failureTests.length > 0) {
      doc += `### Error Handling (❌)\n`;
      for (const test of failureTests.slice(0, 5)) {
        doc += `- ${test}\n`;
      }
      doc += `\n`;
    }

    doc += `### Running Tests\n\n`;
    doc += "```bash\n";
    doc += "npm test\n";
    doc += "```\n\n";

    doc += "With coverage report:\n\n";
    doc += "```bash\n";
    doc += "npm run coverage\n";
    doc += "```\n\n";
  }

  // FHEVM Patterns Section
  doc += `## FHEVM Patterns Demonstrated\n\n`;
  doc += `### 1. Encrypted Value Operations\n`;
  doc += "```solidity\n";
  doc += "// Create encrypted value\n";
  doc += "euint32 encryptedVotes = FHE.asEuint32(0);\n";
  doc += "\n";
  doc += "// Add encrypted values\n";
  doc += "encryptedVotes = FHE.add(encryptedVotes, encryptedWeight);\n";
  doc += "\n";
  doc += "// Grant permissions\n";
  doc += "FHE.allowThis(encryptedVotes);\n";
  doc += "FHE.allow(encryptedVotes, msg.sender);\n";
  doc += "```\n\n";

  doc += `### 2. Access Control with FHE\n`;
  doc += "- **FHE.allowThis()**: Contract can access encrypted value\n";
  doc += "- **FHE.allow()**: User can decrypt their own values\n";
  doc += "- Prevents unauthorized access to encrypted data\n\n";

  doc += `### 3. Encrypted Arithmetic\n`;
  doc += "- FHE.add for vote accumulation\n";
  doc += "- FHE.sub for subtraction operations\n";
  doc += "- FHE.eq for equality comparisons\n\n`;

  // Security Section
  doc += `## Security Considerations\n\n`;
  doc += `### Vote Privacy\n`;
  doc += `- Votes are encrypted during commit phase\n`;
  doc += `- Only participants can decrypt their own votes\n`;
  doc += `- Double-spending (double voting) prevented\n\n`;

  doc += `### Cryptographic Security\n`;
  doc += `- Keccak-256 hashing for vote commitments\n`;
  doc += `- Nonce prevents vote prediction\n`;
  doc += `- Hash verification prevents tampering\n\n`;

  doc += `### Smart Contract Security\n`;
  doc += `- Access control for administrative functions\n`;
  doc += `- State validation throughout voting phases\n`;
  doc += `- Emergency proposal pause functionality\n\n`;

  // Best Practices
  doc += `## Best Practices\n\n`;
  doc += `### For Developers\n`;
  doc += `1. Always use both FHE.allowThis() and FHE.allow()\n`;
  doc += `2. Verify vote commitments before tallying\n`;
  doc += `3. Use cryptographically secure random nonces\n`;
  doc += `4. Test encrypted operations thoroughly\n\n`;

  doc += `### For Users\n`;
  doc += `1. Save your nonce immediately after committing\n`;
  doc += `2. Don't reuse nonces across different votes\n`;
  doc += `3. Verify contract address before voting\n`;
  doc += `4. Keep private keys secure\n\n`;

  // Quick Start
  doc += `## Quick Start\n\n`;
  doc += "```bash\n";
  doc += "# Install dependencies\n";
  doc += "npm install\n";
  doc += "\n";
  doc += "# Compile contracts\n";
  doc += "npm run compile\n";
  doc += "\n";
  doc += "# Run tests\n";
  doc += "npm test\n";
  doc += "\n";
  doc += "# Deploy locally\n";
  doc += "npx hardhat run scripts/deploy.ts --network localhost\n";
  doc += "```\n\n";

  // Resources
  doc += `## Resources\n\n`;
  doc += `- [FHEVM Documentation](https://docs.zama.ai/fhevm)\n`;
  doc += `- [FHEVM GitHub Repository](https://github.com/zama-ai/fhevm)\n`;
  doc += `- [Zama Community](https://www.zama.ai/community)\n`;
  doc += `- [Discord Server](https://discord.com/invite/zama)\n\n`;

  // License
  doc += `## License\n\n`;
  doc += `BSD-3-Clause-Clear License\n\n`;

  doc += `---\n\n`;
  doc += `**Built for the Zama FHEVM Bounty Program**\n\n`;
  doc += `*Advancing privacy-preserving blockchain governance with Fully Homomorphic Encryption*\n`;

  return doc;
}

function generateSummary(examples: string[]): string {
  let summary = `# FHEVM Voting Examples Documentation\n\n`;
  summary += `## Introduction\n\n`;
  summary += `This documentation covers FHEVM voting examples demonstrating privacy-preserving governance.\n\n`;
  summary += `## Table of Contents\n\n`;

  for (const example of examples) {
    const config = DOCS_CONFIG[example];
    if (config) {
      summary += `- [${config.name}](${example}.md)\n`;
    }
  }

  summary += `\n## Quick Links\n\n`;
  summary += `- [FHEVM Documentation](https://docs.zama.ai/fhevm)\n`;
  summary += `- [GitHub Repository](https://github.com/zama-ai/fhevm-secure-voting)\n`;
  summary += `- [Zama Community](https://www.zama.ai/community)\n`;

  return summary;
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

try {
  // Create examples directory
  const examplesDir = "examples";
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
  }

  let exampleNames: string[] = [];

  if (args.includes("--all")) {
    info("Generating documentation for all examples...");
    exampleNames = Object.keys(DOCS_CONFIG);
  } else if (args.length > 0) {
    const exampleName = args[0];
    if (!DOCS_CONFIG[exampleName]) {
      error(`Unknown example: ${exampleName}`);
    }
    exampleNames = [exampleName];
  } else {
    error("No example specified. Use --help for usage information.");
  }

  // Generate documentation for each example
  for (const exampleName of exampleNames) {
    const config = DOCS_CONFIG[exampleName];
    info(`Generating documentation for: ${exampleName}`);

    const documentation = generateDocumentation(exampleName, config);
    const docFilePath = path.join(examplesDir, `${exampleName}.md`);

    fs.writeFileSync(docFilePath, documentation);
    success(`Documentation generated: ${docFilePath}`);
  }

  // Generate SUMMARY.md for GitBook
  if (args.includes("--all") || exampleNames.length > 1) {
    const summary = generateSummary(exampleNames);
    const summaryPath = path.join(examplesDir, "SUMMARY.md");
    fs.writeFileSync(summaryPath, summary);
    success(`Summary generated: ${summaryPath}`);
  }

  success(`Documentation generation complete!`);
  info(`View documentation in: ${examplesDir}/`);
} catch (err) {
  error(`Documentation generation failed: ${err}`);
}
