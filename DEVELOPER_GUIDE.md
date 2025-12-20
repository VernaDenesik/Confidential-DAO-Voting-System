# Developer Guide - FHEVM Secure Voting Examples

A comprehensive guide for developers implementing or extending FHEVM voting examples.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [FHEVM Patterns](#fhevm-patterns)
4. [Creating Examples](#creating-examples)
5. [Testing Strategies](#testing-strategies)
6. [Documentation](#documentation)
7. [Common Issues](#common-issues)
8. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 7
- Git
- Basic Solidity and TypeScript knowledge
- Understanding of homomorphic encryption concepts

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/zama-ai/fhevm-secure-voting.git
cd fhevm-secure-voting

# Install dependencies
npm install

# Setup base template
cd base-template
npm install
cd ..
```

### Verify Installation

```bash
# Generate a test example
npm run create-example fhevm-voting ./test-voting

# Navigate and test
cd test-voting
npm run compile
npm test
cd ..
```

## Architecture Overview

### Project Structure

```
fhevm-secure-voting/
├── base-template/          # Hardhat template (reusable)
│   ├── contracts/          # Solidity smart contracts
│   ├── test/              # TypeScript test suites
│   ├── deploy/            # Deployment scripts
│   ├── hardhat.config.ts  # Build configuration
│   └── package.json       # Dependencies
│
├── scripts/               # Automation tools
│   ├── create-fhevm-example.ts
│   ├── generate-docs.ts
│   └── README.md
│
├── examples/              # Generated documentation
├── README.md             # Main documentation
└── DEVELOPER_GUIDE.md    # This file
```

### Design Decisions

1. **Single Base Template**: One Hardhat template cloned for all examples
2. **Standalone Repositories**: Each example generates a complete, independent repository
3. **Automation Scripts**: TypeScript CLI tools for reproducible generation
4. **Type-Safe Tests**: Full TypeScript testing instead of JavaScript
5. **Auto-Generated Docs**: Documentation extracted from code comments

## FHEVM Patterns

### Pattern 1: Encrypted Value Creation

**Purpose**: Initialize encrypted values in smart contracts

```solidity
// Create encrypted 32-bit unsigned integer with value 0
euint32 encryptedVotes = FHE.asEuint32(0);

// Create encrypted value from external input
euint32 encryptedInput = FHE.fromExternal(externalValue, inputProof);
```

**When to Use**:
- Initializing vote tallies
- Creating encrypted placeholders
- Accepting encrypted user inputs

**Important Notes**:
- Always provide input proofs for external values
- Verify binding to correct contract and user
- Initialize all encrypted values before use

### Pattern 2: Encrypted Arithmetic

**Purpose**: Perform operations on encrypted values

```solidity
// Addition (accumulating votes)
euint32 totalVotes = FHE.add(yesVotes, newVote);

// Subtraction
euint32 remaining = FHE.sub(total, used);

// Equality comparison
ebool isZero = FHE.eq(value, FHE.asEuint32(0));

// If-then-else (conditional logic)
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

**When to Use**:
- Accumulating encrypted vote counts
- Checking encrypted conditions
- Computing encrypted results

**Important Notes**:
- Operations preserve encryption
- Results are still encrypted
- No plaintext data leakage

### Pattern 3: Permission Management

**Purpose**: Control access to encrypted values

```solidity
// Grant contract access (required for further operations)
FHE.allowThis(encryptedValue);

// Grant user access (required for user decryption)
FHE.allow(encryptedValue, msg.sender);

// Both permissions needed for full functionality
function tallyVote(euint32 vote) external {
    totalVotes = FHE.add(totalVotes, vote);
    FHE.allowThis(totalVotes);      // ✅ Required
    FHE.allow(totalVotes, msg.sender); // ✅ Required
}
```

**Critical Pattern**: Always use both!

```solidity
// ❌ WRONG - Missing FHE.allowThis()
function brokenTally(euint32 vote) external {
    totalVotes = FHE.add(totalVotes, vote);
    FHE.allow(totalVotes, msg.sender); // Incomplete!
}

// ✅ CORRECT - Both permissions granted
function correctTally(euint32 vote) external {
    totalVotes = FHE.add(totalVotes, vote);
    FHE.allowThis(totalVotes);        // Contract access
    FHE.allow(totalVotes, msg.sender); // User access
}
```

### Pattern 4: Commit-Reveal Voting

**Purpose**: Implement privacy-preserving voting

```solidity
// Phase 1: Commit (vote hash submitted)
mapping(uint256 => mapping(address => bytes32)) commitments;

function commitVote(uint256 proposalId, bytes32 voteHash) external {
    commitments[proposalId][msg.sender] = voteHash;
}

// Phase 2: Reveal (actual vote with verification)
function revealVote(uint256 proposalId, bool support, uint256 nonce) external {
    bytes32 expectedHash = keccak256(abi.encodePacked(support, nonce, msg.sender));
    require(expectedHash == commitments[proposalId][msg.sender], "Invalid proof");

    // Tally encrypted vote
    if (support) {
        yesVotes = FHE.add(yesVotes, FHE.asEuint32(weight));
    } else {
        noVotes = FHE.add(noVotes, FHE.asEuint32(weight));
    }
}
```

**Why Commit-Reveal?**:
- Prevents vote selling (buyer can't verify delivery)
- Prevents coercion (voter can claim false commitment)
- Protects against strategic voting (no early results)

### Pattern 5: Input Proof Verification

**Purpose**: Ensure inputs are correctly encrypted

```typescript
// In tests/frontend code:
const fhevm = await FHEVMInstance.getInstance();
const encryptedInput = await fhevm.createEncryptedInput(
    contractAddress,
    userAddress  // ← Binding to specific user
).add32(voteChoice).encrypt();

// Pass both encrypted value and proof
await votingContract.castVote(
    encryptedInput.handles[0],  // Encrypted value
    encryptedInput.inputProof   // Proof of correct binding
);
```

**Key Points**:
- Proofs attest correct encryption binding
- Binding is to `[contract, user]` pair
- Mismatched binding causes verification failure
- Always include proof in contract calls

## Creating Examples

### Step 1: Design Your Example

Before implementing, define:

1. **What FHEVM Concept?** (e.g., encrypted arithmetic, permission management)
2. **Use Case**: What real-world problem does it solve?
3. **Key Functions**: Which contract functions demonstrate the concept?
4. **Test Cases**: What success and failure scenarios?

### Step 2: Implement Contract

Create contract in `base-template/contracts/`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Example Contract
 * @notice Demonstrates specific FHEVM pattern
 *
 * ## Key Concepts:
 * - Concept 1 explanation
 * - Concept 2 explanation
 * - Security considerations
 */
contract ExampleContract is ZamaEthereumConfig {
    // ✅ Complete NatSpec documentation
    euint32 private encryptedState;

    function updateState(externalEuint32 input, bytes calldata proof) external {
        // Detailed comments explaining FHEVM patterns
        euint32 encryptedInput = FHE.fromExternal(input, proof);

        encryptedState = FHE.add(encryptedState, encryptedInput);

        // Both permissions required!
        FHE.allowThis(encryptedState);
        FHE.allow(encryptedState, msg.sender);
    }
}
```

### Step 3: Write Comprehensive Tests

Create test in `base-template/test/`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { ExampleContract } from "../types";

/**
 * @title Example Contract Tests
 * @notice Tests demonstrating FHEVM patterns
 *
 * ## Test Categories:
 * - ✅ Success cases
 * - ❌ Error handling
 * - Encrypted operations verification
 * - Permission management
 */
describe("ExampleContract", () => {
    let contract: ExampleContract;
    let owner: any;
    let user: any;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("ExampleContract");
        contract = await Factory.deploy();
        await contract.waitForDeployment();
    });

    describe("Core Functionality", () => {
        it("✅ Should perform encrypted operation", async () => {
            // Test setup
            // Execute operation
            // Verify results
            expect(result).to.equal(expected);
        });

        it("❌ Should reject invalid input", async () => {
            // Test error handling
            await expect(contract.invalidOperation()).to.be.revertedWith("Error message");
        });
    });

    // Include edge cases, permission tests, etc.
});
```

### Step 4: Add to Configuration

Update `scripts/create-fhevm-example.ts`:

```typescript
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
    // ... existing examples ...
    'your-example': {
        contract: 'base-template/contracts/YourContract.sol',
        test: 'base-template/test/YourContract.ts',
        description: 'Clear description of what your example demonstrates'
    }
};
```

Update `scripts/generate-docs.ts`:

```typescript
const DOCS_CONFIG: Record<string, DocConfig> = {
    // ... existing docs ...
    'your-example': {
        name: 'Example Title',
        description: 'Example description',
        contractFile: 'base-template/contracts/YourContract.sol',
        testFile: 'base-template/test/YourContract.ts',
        category: 'Category Name'
    }
};
```

### Step 5: Generate Standalone Repository

```bash
# Generate standalone example
npm run create-example your-example ./generated-example

# Navigate and test
cd generated-example
npm install
npm run compile
npm test
```

### Step 6: Verify and Iterate

- ✅ Tests pass
- ✅ Code compiles without warnings
- ✅ Linting passes
- ✅ Documentation is clear
- ✅ Examples are instructive

## Testing Strategies

### Test Structure

```typescript
describe("Feature Group", () => {
    // Setup runs before each test
    beforeEach(async () => {
        // Deploy contracts
        // Initialize state
        // Set up test data
    });

    describe("Subfeature", () => {
        it("✅ Should succeed in normal case", async () => {
            // Test correct usage
        });

        it("❌ Should fail with invalid input", async () => {
            // Test error handling
        });

        it("Should handle edge case", async () => {
            // Test boundary conditions
        });
    });
});
```

### Test Patterns for FHEVM

**Testing Encrypted Operations**:
```typescript
// Setup encrypted input
const encryptedValue = await createEncryptedInput(contract, user, 42);

// Call contract function
const tx = await contract.processEncrypted(encryptedValue.handles[0], encryptedValue.inputProof);

// Verify operation completed
await expect(tx).to.not.be.reverted;
```

**Testing Permission Management**:
```typescript
// Verify permissions are required
it("❌ Should fail without FHE.allow permissions", async () => {
    // This should fail if permissions not properly set
    await expect(contract.accessEncryptedValue()).to.be.reverted;
});
```

**Testing Commit-Reveal**:
```typescript
// Verify hash commitment
const voteHash = ethers.solidityPackedKeccak256(
    ["bool", "uint256", "address"],
    [support, nonce, voter.address]
);

// Verify hash matches on reveal
const expectedHash = await contract.generateHash(support, nonce);
expect(voteHash).to.equal(expectedHash);
```

### Coverage Goals

Aim for:
- ✅ 90%+ line coverage
- ✅ All success paths
- ✅ All error paths
- ✅ Edge cases
- ✅ Permission scenarios
- ✅ Encrypted operations

Run coverage:
```bash
npm run coverage
```

## Documentation

### Code Comments

Use NatSpec format for contracts:

```solidity
/**
 * @title Contract Title
 * @notice Brief description
 * @dev Longer explanation of implementation
 */
contract MyContract {
    /**
     * @notice What this function does
     * @param param1 Description of parameter
     * @return Description of return value
     */
    function myFunction(uint256 param1) external returns (bool) {
        // Implementation
    }
}
```

### Test Documentation

Use clear test descriptions with markers:

```typescript
it("✅ Should complete encryption successfully", async () => {
    // Specific test for success case
});

it("❌ Should reject without input proof", async () => {
    // Specific test for error case
});
```

### Generating Documentation

```bash
# Generate for single example
npm run generate-docs fhevm-voting

# Generate for all examples
npm run generate-docs --all
```

Generated documentation includes:
- Key concepts
- Code patterns
- Testing strategies
- Security notes
- Best practices

## Common Issues

### Issue 1: Missing FHE.allowThis()

**Symptom**: Operations on encrypted values fail
**Cause**: Forgetting to grant contract permission
**Solution**:
```solidity
// ✅ Always use both:
FHE.allowThis(encryptedValue);        // Contract access
FHE.allow(encryptedValue, msg.sender); // User access
```

### Issue 2: Input Proof Verification

**Symptom**: `fromExternal` fails
**Cause**: Proof doesn't match input binding
**Solution**:
```typescript
// Ensure binding matches contract and user
const encrypted = await fhevm.createEncryptedInput(
    contractAddress,  // ← Must match
    userAddress       // ← Must match
).add32(value).encrypt();
```

### Issue 3: Commit-Reveal Hash Mismatch

**Symptom**: Vote verification fails
**Cause**: Different hash calculation on reveal
**Solution**:
```solidity
// Use identical hash calculation
bytes32 commitHash = keccak256(abi.encodePacked(support, nonce, msg.sender));
// ... later ...
require(commitHash == savedHash, "Hash mismatch");
```

### Issue 4: Gas Optimization

**Symptom**: Tests run slowly
**Cause**: Unoptimized encrypted operations
**Solution**:
- Batch operations when possible
- Minimize encrypted value allocations
- Use appropriate data types (euint8 vs euint32)

## Best Practices

### Solidity

1. **Always Validate Inputs**
   ```solidity
   require(msg.sender != address(0), "Invalid sender");
   require(proposalId > 0, "Invalid proposal");
   ```

2. **Use Consistent State Management**
   ```solidity
   enum ProposalStatus { Active, Closed, Executed }
   mapping(uint => ProposalStatus) status;
   ```

3. **Document FHEVM Specifics**
   ```solidity
   // ✅ DO: Explain FHEVM requirements
   /// @dev Both FHE.allowThis() and FHE.allow() required
   function update(euint32 value) external {
       encrypted = FHE.add(encrypted, value);
       FHE.allowThis(encrypted);
       FHE.allow(encrypted, msg.sender);
   }
   ```

4. **Emit Events for Transparency**
   ```solidity
   event VoteCommitted(uint indexed proposalId, address indexed voter);
   event VoteTallied(uint indexed proposalId, uint weight);
   ```

### TypeScript Tests

1. **Clear Test Names**
   ```typescript
   it("✅ Should add encrypted values correctly", async () => {});
   it("❌ Should reject without proper permissions", async () => {});
   ```

2. **Setup and Teardown**
   ```typescript
   beforeEach(async () => {
       // Common setup
   });

   afterEach(async () => {
       // Common cleanup if needed
   });
   ```

3. **Descriptive Assertions**
   ```typescript
   expect(result).to.equal(expected);
   expect(tx).to.not.be.reverted;
   expect(receipt?.logs.length).to.be.greaterThan(0);
   ```

4. **Helper Functions**
   ```typescript
   async function createVoteHash(
       support: boolean,
       nonce: number,
       voter: string
   ): Promise<string> {
       return ethers.solidityPackedKeccak256(
           ["bool", "uint256", "address"],
           [support, nonce, voter]
       );
   }
   ```

### General

1. **Reproducibility**: Same inputs → Same outputs
2. **Testing**: All paths tested and documented
3. **Documentation**: Clear comments explaining FHEVM patterns
4. **Security**: Validate all inputs, manage permissions carefully
5. **Maintainability**: Clear code structure, good naming

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zama Community](https://www.zama.ai/community)

---

**For Questions**:
- Zama Community Forum: https://www.zama.ai/community
- Discord: https://discord.com/invite/zama
- GitHub Issues: https://github.com/zama-ai/fhevm-secure-voting/issues

**Happy Building!** 🚀
