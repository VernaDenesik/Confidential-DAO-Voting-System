# FHEVM Secure Voting Examples - Documentation Index

## Introduction

This documentation covers comprehensive FHEVM (Fully Homomorphic Encryption Virtual Machine) examples demonstrating privacy-preserving smart contracts and governance patterns.

Each example is a standalone, deployable Hardhat project that can be generated using the automation tools.

## Table of Contents

### Basic Examples

These examples demonstrate fundamental FHEVM operations:

- [FHE Counter](fhe-counter.md) - Simple encrypted counter with add/subtract operations
- [Encrypt Single Value](encrypt-single-value.md) - Input validation and proof verification patterns

### Advanced Examples

These examples demonstrate complex FHEVM patterns and real-world use cases:

- [FHEVM Voting System](fhevm-voting.md) - Privacy-preserving governance with encrypted vote tallying

## Example Categories

### By Complexity

**Beginner**
- FHE Counter - Start here for basics
- Encrypt Single Value - Learn input proofs

**Intermediate**
- (More examples coming)

**Advanced**
- FHEVM Voting System - Production-ready voting

### By Concept

**Encryption & Decryption**
- Encrypt Single Value - Input encryption
- FHE Counter - Encrypted state management

**Arithmetic Operations**
- FHE Counter - FHE.add and FHE.sub
- FHEVM Voting System - Vote aggregation

**Governance Patterns**
- FHEVM Voting System - Commit-reveal voting

**Access Control**
- FHEVM Voting System - Permission management
- All examples - FHE.allow patterns

## Quick Start Guide

### Generate and Run an Example

```bash
# Clone repository
cd fhevm-secure-voting

# Install dependencies
npm install

# Generate a specific example
npm run create-example fhe-counter ./my-example

# Navigate to generated project
cd my-example

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

### Generate All Documentation

```bash
npm run generate-docs -- --all
```

## Core FHEVM Patterns

Every example demonstrates these critical patterns:

### Pattern 1: Encrypted State Storage

```solidity
euint32 private encryptedValue;
```

### Pattern 2: FHE Arithmetic

```solidity
euint32 result = FHE.add(a, b);
```

### Pattern 3: Permission Management (CRITICAL!)

```solidity
FHE.allowThis(encryptedValue);        // Contract permission
FHE.allow(encryptedValue, msg.sender); // User permission
```

### Pattern 4: Input Verification

```solidity
euint32 value = FHE.fromExternal(input, proof);
```

## Learning Path

### Step 1: Understand Basic Operations

Start with **FHE Counter** to learn:
- Encrypted state variables
- FHE arithmetic operations
- Permission management
- Event emissions

### Step 2: Master Input Handling

Study **Encrypt Single Value** to understand:
- Encrypted input acceptance
- Proof verification
- Common validation errors
- Anti-patterns to avoid

### Step 3: Build Real Applications

Explore **FHEVM Voting System** for:
- Multi-phase governance
- Weighted voting
- Commit-reveal privacy
- Production-ready patterns

## Common Pitfalls (and How to Avoid Them)

### ❌ WRONG: Forgetting FHE.allowThis()

```solidity
_count = FHE.add(_count, value);
FHE.allow(_count, msg.sender); // Missing FHE.allowThis()!
```

### ✅ CORRECT: Both Permissions

```solidity
_count = FHE.add(_count, value);
FHE.allowThis(_count);        // Contract can use
FHE.allow(_count, msg.sender); // User can decrypt
```

### ❌ WRONG: Mismatched Input Binding

```typescript
const input = await fhevm
    .createEncryptedInput(otherContract, user) // Wrong contract!
    .add32(42)
    .encrypt();

await myContract.storeValue(input.handles[0], input.inputProof); // FAILS!
```

### ✅ CORRECT: Proper Binding

```typescript
const input = await fhevm
    .createEncryptedInput(myContractAddress, userAddress) // Correct!
    .add32(42)
    .encrypt();

await myContract.storeValue(input.handles[0], input.inputProof); // Works!
```

## Supported Operations

### FHE Arithmetic

- `FHE.add(a, b)` - Encrypted addition
- `FHE.sub(a, b)` - Encrypted subtraction
- `FHE.mul(a, b)` - Encrypted multiplication
- `FHE.div(a, b)` - Encrypted division

### FHE Comparisons

- `FHE.eq(a, b)` - Encrypted equality
- `FHE.ne(a, b)` - Encrypted inequality
- `FHE.lt(a, b)` - Encrypted less than
- `FHE.lte(a, b)` - Encrypted less than or equal
- `FHE.gt(a, b)` - Encrypted greater than
- `FHE.gte(a, b)` - Encrypted greater than or equal

### FHE Logic

- `FHE.select(cond, a, b)` - Encrypted conditional (if-then-else)
- `FHE.and(a, b)` - Encrypted AND
- `FHE.or(a, b)` - Encrypted OR
- `FHE.xor(a, b)` - Encrypted XOR
- `FHE.not(a)` - Encrypted NOT

### Permission Management

- `FHE.allowThis(value)` - Grant contract permission
- `FHE.allow(value, user)` - Grant user permission

### Encryption & Decryption

- `FHE.asEuint32(plaintext)` - Encrypt plaintext literal
- `FHE.fromExternal(handle, proof)` - Verify and convert external input
- `FHE.decrypt(value)` - Decrypt to plaintext (only in relayer context)

## Testing Your Examples

All examples include comprehensive test suites:

```bash
cd my-example
npm test
```

Test coverage includes:
- ✅ Success cases
- ❌ Error handling
- Edge cases
- Permission verification
- Event emissions

## Deployment

### Local Testing

```bash
npm run chain  # Start Hardhat node
npm run deploy:localhost
```

### Sepolia Testnet

1. Create `.env`:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

2. Deploy:
```bash
npm run deploy:sepolia
```

## Security Notes

### Privacy Guarantees

- ✅ Values encrypted throughout contract execution
- ✅ Only authorized users can decrypt
- ✅ No intermediate plaintext leakage
- ✅ Confidentiality preserved on blockchain

### Common Vulnerabilities

- ❌ Using inputs encrypted for different contracts
- ❌ Forgetting permission grants
- ❌ Missing input proof verification
- ❌ Assuming encrypted values are plaintext-accessible

## Resources

### FHEVM Documentation

- [Official FHEVM Docs](https://docs.zama.ai/fhevm)
- [FHEVM GitHub Repository](https://github.com/zama-ai/fhevm)
- [API Reference](https://docs.zama.ai/fhevm/api)

### Community

- [Zama Discord](https://discord.com/invite/zama)
- [Community Forum](https://www.zama.ai/community)
- [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

### Learning Resources

- [FHEVM Blog Posts](https://www.zama.ai/blog)
- [Examples Repository](https://github.com/zama-ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)

## Troubleshooting

### "Module not found" Error

```bash
npm install
npm run compile
```

### "Contract revert" in Tests

Check:
- Input binding matches contract and user
- Input proof is valid
- Permissions are properly granted
- All FHE operations complete successfully

### "Permission denied" on Decryption

Ensure:
- `FHE.allow(value, user)` was called
- User attempting decryption has the permission
- FHEVM relayer is configured correctly

## Contributing

To add new examples:

1. Create contract in `contracts/category/`
2. Create tests in `test/category/`
3. Update automation scripts
4. Document with comprehensive comments
5. Test with generation tools

## License

BSD-3-Clause-Clear License

All examples are provided under the same license as the Zama FHEVM project.

## Citation

If you use these examples in your research or project, please cite:

```
Zama FHEVM Secure Voting Examples
https://github.com/zama-ai/fhevm-secure-voting
```

## Support

For questions or issues:

- Open a GitHub issue
- Post in Zama Community Forum
- Ask in Discord #fhevm channel

---

**Built for the Zama FHEVM Bounty Program**

*Advancing privacy-preserving blockchain development*

Last updated: December 2025
