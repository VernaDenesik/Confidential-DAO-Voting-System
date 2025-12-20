# FHEVM Voting System - Advanced Governance Example

Privacy-preserving voting system with encrypted vote tallying, weighted voting, and multi-phase governance.

## Overview

This is an advanced FHEVM example demonstrating:
- Production-ready voting implementation
- Encrypted vote aggregation
- Commit-reveal privacy mechanism
- Weighted voting power
- Multi-phase proposal lifecycle
- Complex permission management

Perfect for understanding how to build real-world privacy-preserving applications.

## Key Features

### 1. Encrypted Vote Tallying

Votes are tallied while remaining encrypted:

```solidity
euint32 encryptedYesCount;
euint32 encryptedNoCount;

// Add vote while encrypted
if (support) {
    proposal.encryptedYesCount = FHE.add(
        proposal.encryptedYesCount,
        encryptedWeight
    );
}
```

### 2. Commit-Reveal Privacy Mechanism

Two-phase voting prevents manipulation:

**Phase 1: Commit**
- Voter submits hash of (choice, nonce, voter)
- Choice remains hidden

**Phase 2: Reveal**
- Voter proves hash with original choice and nonce
- Vote is tallied
- Only then is choice revealed

Benefits:
- ✅ Prevents vote selling (buyer can't verify delivery)
- ✅ Prevents coercion (voter can claim false commitment)
- ✅ Protects against strategic voting (no early results)

### 3. Weighted Voting Power

Different voting power for different participants:

```solidity
mapping(address => uint256) public voterWeight;

// In reveal:
uint256 weight = voterWeight[msg.sender];
if (support) {
    proposal.encryptedYesCount = FHE.add(
        proposal.encryptedYesCount,
        FHE.asEuint32(uint32(weight))
    );
}
```

### 4. Multi-Phase Governance

Complete proposal lifecycle:

```
Creation → Voting → Reveal → Execution
(7 days)   (within voting  (1 day    (after reveal
           period)          buffer)   period)
```

## Proposal Lifecycle

### Phase 1: Proposal Creation

```solidity
function createProposal(
    string title,
    string description
) external
```

Requirements:
- Caller must have voting power ≥ MIN_VOTING_POWER
- Voting must be open
- Creates proposal with voting_end = now + 7 days

### Phase 2: Voting (Commit-Reveal)

#### Commit (During voting period)

```solidity
function commitVote(
    uint256 proposalId,
    bytes32 voteHash
) external
```

Voter submits: `keccak256(support, nonce, voter)`

Key requirements:
- Voter must have voting power > 0
- Proposal must be active
- Current time < voting_end
- Voter hasn't already voted

#### Reveal (After voting period)

```solidity
function revealVote(
    uint256 proposalId,
    bool support,
    uint256 nonce
) external
```

Process:
1. Verify voting period has ended
2. Calculate expected hash: `keccak256(support, nonce, msg.sender)`
3. Verify against commitment
4. Create encrypted weight: `FHE.asEuint32(voterWeight[msg.sender])`
5. Add to encrypted counter (FHE.add)
6. Grant permissions

### Phase 3: Execution

```solidity
function executeProposal(uint256 proposalId) external
```

Requirements:
- Reveal period must have ended (voting_end + 1 day)
- Proposal hasn't been executed
- Proposal is active

After execution, results can be decrypted via relayer.

## FHEVM Patterns Demonstrated

### Pattern: Encrypted Vote Aggregation

```solidity
euint32 encryptedYesCount = FHE.asEuint32(0);

// Add vote while encrypted
encryptedYesCount = FHE.add(
    encryptedYesCount,
    encryptedWeight
);

// Grant permissions
FHE.allowThis(encryptedYesCount);
FHE.allow(encryptedYesCount, msg.sender);
```

Key insight: Votes accumulate while staying encrypted!

### Pattern: Commit-Reveal Voting

**Commit phase**:
```solidity
bytes32 voteHash = keccak256(abi.encodePacked(support, nonce, msg.sender));
commitments[proposalId][msg.sender] = voteHash;
```

**Reveal phase**:
```solidity
bytes32 expectedHash = keccak256(abi.encodePacked(support, nonce, msg.sender));
require(expectedHash == commitments[proposalId][msg.sender], "Invalid proof");

// Now tally encrypted vote
```

### Pattern: Permission Management in Complex Flows

```solidity
// After encrypted operation
proposal.encryptedYesCount = FHE.add(
    proposal.encryptedYesCount,
    encryptedWeight
);

// CRITICAL: Re-grant permissions
FHE.allowThis(proposal.encryptedYesCount);      // Contract uses it later
FHE.allow(proposal.encryptedYesCount, msg.sender); // User decrypts later
```

### Pattern: Access Control

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
}

modifier votingIsOpen() {
    require(votingOpen, "Voting closed");
    _;
}

function setVoterWeight(address voter, uint256 weight) external onlyOwner {
    voterWeight[voter] = weight;
}

function createProposal(...) external votingIsOpen {
    require(voterWeight[msg.sender] >= MIN_VOTING_POWER, "Insufficient power");
    // ...
}
```

## Smart Contract Functions

### Proposal Management

**createProposal(title, description)**
- Create new governance proposal
- Requires: voting power ≥ MIN_VOTING_POWER
- Sets: voting_end = now + 7 days

**executeProposal(proposalId)**
- Execute proposal after reveal period
- Requires: now ≥ voting_end + 1 day
- Sets: executed = true

**pauseProposal(proposalId)**
- Emergency pause (owner only)
- Prevents voting on paused proposal

### Voter Management

**setVoterWeight(voter, weight)**
- Set voting power for single voter
- Owner only

**setMultipleVoterWeights(voters, weights)**
- Set weights for multiple voters in batch
- Owner only

### Voting Operations

**commitVote(proposalId, voteHash)**
- Commit encrypted vote
- Requires: voting power > 0
- Prevents: double voting, voting after deadline

**revealVote(proposalId, support, nonce)**
- Reveal and tally vote
- Verifies: hash = keccak256(support, nonce, msg.sender)
- Tallies: encrypted weight to yes/no counter

### Query Functions

**getProposal(proposalId)**
- Returns proposal details
- Note: encrypted vote counts not readable here

**hasUserVoted(proposalId, user)**
- Check if user has committed a vote

**hasUserRevealed(proposalId, user)**
- Check if user has revealed their vote

**getVotingStatus(proposalId)**
- Returns status: "Voting in progress", "Reveal phase", etc.

**getCurrentTime()**
- Returns block.timestamp (for testing)

## Testing Strategy

Test coverage includes:

### Proposal Creation (✅ success cases, ❌ error cases)

- ✅ Create proposal with sufficient voting power
- ❌ Create proposal with insufficient power
- ✅ Multiple proposals can be created
- ✅ Voting end time is set correctly

### Voting Commit Phase

- ✅ Commit vote with valid hash
- ❌ Commit without voting power
- ❌ Double voting prevention
- ❌ Commit after voting period ends

### Voting Reveal Phase

- ❌ Reveal before voting period ends
- ✅ Reveal with correct hash verification
- ❌ Reveal with incorrect nonce
- ❌ Reveal with different vote choice
- ❌ Double reveal prevention
- ✅ Multiple sequential reveals

### Execution

- ❌ Execute during voting period
- ❌ Execute before reveal period ends
- ✅ Execute after reveal period
- ❌ Double execution prevention

### Administration

- ✅ Owner can set voter weights
- ✅ Owner can batch set weights
- ❌ Non-owner cannot set weights
- ✅ Owner can pause voting system
- ✅ Owner can pause individual proposal

## Security Patterns

### 1. Vote Privacy

```solidity
// Votes encrypted during accumulation
proposal.encryptedYesCount = FHE.add(
    proposal.encryptedYesCount,
    encryptedWeight
);
```

Result: Only authorized users can see voting power contributed.

### 2. Vote Integrity

```solidity
// Commit-reveal prevents tampering
bytes32 hash = keccak256(abi.encodePacked(support, nonce, msg.sender));
require(hash == savedHash, "Vote verification failed");
```

Result: Voter cannot change their vote after committing.

### 3. Double-Voting Prevention

```solidity
require(!proposal.hasVoted[msg.sender], "Already voted");
proposal.hasVoted[msg.sender] = true;
```

Result: Each voter can only vote once per proposal.

### 4. Time-Lock Enforcement

```solidity
require(block.timestamp < proposal.votingEnd, "Voting has ended");
require(block.timestamp >= proposal.votingEnd + 1 days, "Reveal period not ended");
```

Result: Each phase lasts exactly as long as designed.

### 5. Access Control

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can operate");
    _;
}

function setVoterWeight(address voter, uint256 weight) external onlyOwner {
    voterWeight[voter] = weight;
}
```

Result: Only owner can manage critical parameters.

## Anti-Patterns Demonstrated

The tests also show common mistakes:

### ❌ Forgetting FHE.allowThis()

First operation succeeds:
```solidity
encryptedVotes = FHE.add(encryptedVotes, weight);
FHE.allow(encryptedVotes, msg.sender); // Works
```

Second operation fails:
```solidity
encryptedVotes = FHE.add(encryptedVotes, weight2); // FAILS!
// Reason: No contract permission from first operation
```

### ❌ Viewing Encrypted Values

```solidity
// ❌ This doesn't work:
function getDecryptedCount() external view returns (uint256) {
    return FHE.decrypt(encryptedCount); // FAILS in view function!
}

// ✅ This works:
function getEncryptedCount() external view returns (euint32) {
    return encryptedCount; // Returns handle, user decrypts off-chain
}
```

### ❌ Hash Mismatch

```solidity
// Client:
const hash = keccak256(abi.encodePacked(true, 12345, user));
// Contract hashes:
const hash2 = keccak256(abi.encodePacked(false, 12345, user)); // Different!
```

## Deployment

### Local Testing

```bash
cd base-template
npm install
npm run compile
npm test
```

### Sepolia Testnet

1. Configure `.env`:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Deploy:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

3. Verify:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Decryption Workflow

### On-Chain

Encrypted vote tallying happens on-chain:
```solidity
proposal.encryptedYesCount = FHE.add(
    proposal.encryptedYesCount,
    encryptedWeight
);
```

### Off-Chain (Relayer)

After reveal period, user requests decryption:

```typescript
// Get encrypted value
const encrypted = await contract.getCount();

// Request decryption via FHEVM relayer
const plaintext = await fhevm.decrypt(encrypted);

// Now user can see results
console.log("Yes votes:", plaintext);
```

## Use Cases

### DAO Governance

- Protocol upgrades
- Treasury management
- Parameter tuning
- Community grants

### Organizational Voting

- Board elections
- Strategic planning
- Resource allocation
- Policy changes

### DeFi Applications

- Liquidity mining rewards
- Token listings
- Fee structures
- Risk parameters

## Production Deployment Checklist

Before mainnet:

- [ ] All FHEVM permissions properly managed
- [ ] Time locks set to appropriate values
- [ ] Owner key is hardware wallet
- [ ] Emergency pause tested
- [ ] Voting power distribution verified
- [ ] Full security audit completed
- [ ] Testnet voting cycle completed
- [ ] Decryption relayer configured

## Key Learnings

### 1. Complex Permission Management

Each operation that creates encrypted values needs permission grants:
- FHE.allowThis() for contract use
- FHE.allow() for user decryption

Forgetting either causes failures!

### 2. Time-Locked Phases

Commit-reveal requires strict timing:
- Votes hidden during commit
- Votes revealed after deadline
- Execution only after reveal buffer

This prevents manipulation strategies.

### 3. Encrypted Aggregation

Votes accumulate while encrypted:
- No intermediate plaintext
- Final count decrypted once
- Privacy maintained throughout voting

### 4. Weight-Based Voting

Different voting power reflects governance structure:
- Token-weighted DAOs
- Multi-tier membership
- Delegated voting potential

## Next Steps

After mastering this example:

1. **Deploy on Sepolia** - Test against real FHEVM
2. **Extend with Delegation** - Allow voting via proxies
3. **Add Quadratic Voting** - Square root weighted voting
4. **Multi-Signature** - Require multiple approvals
5. **IPFS Integration** - Store proposals off-chain

## Resources

- [FHEVM Docs](https://docs.zama.ai/fhevm)
- [Security Best Practices](https://docs.zama.ai/fhevm/security)
- [API Reference](https://docs.zama.ai/fhevm/api)
- [Community Forum](https://www.zama.ai/community)
- [GitHub Examples](https://github.com/zama-ai/fhevm)

## License

BSD-3-Clause-Clear License

---

**Built for the Zama FHEVM Bounty Program**

*Privacy-preserving governance for decentralized communities*
