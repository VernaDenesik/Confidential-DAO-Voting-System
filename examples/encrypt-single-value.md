# Encrypt Single Value - Input Encryption Example

Demonstrates encrypted input handling, proof verification, and common pitfalls.

## Overview

This example focuses specifically on the encryption input mechanism critical for all FHEVM applications.

Learn:
- How users send encrypted data to contracts
- Input proof verification
- Encryption binding to [contract, user]
- Common validation errors
- Anti-patterns to avoid

## How Encrypted Inputs Work

### Client-Side (TypeScript with fhevm.js)

```typescript
// 1. Initialize FHEVM
const fhevm = await FHEVMInstance.getInstance();

// 2. Create encrypted input bound to contract and user
const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, userAddress)
    .add32(42)  // The value to encrypt
    .encrypt();

// 3. Send to contract
await contract.storeValue(
    encryptedInput.handles[0],  // Encrypted value
    encryptedInput.inputProof   // ZK proof
);
```

### Contract-Side (Solidity)

```solidity
function storeValue(
    externalEuint32 input,
    bytes calldata proof
) external {
    // 4. Verify and convert input
    euint32 value = FHE.fromExternal(input, proof);

    // 5. Store and grant permissions
    userValues[msg.sender] = value;
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
}
```

## What FHE.fromExternal Does

Verifies encrypted input is valid:

```solidity
euint32 value = FHE.fromExternal(externalValue, inputProof);
```

Checks:
- ✅ Input is properly encrypted
- ✅ Encryption bound to THIS contract address
- ✅ Encryption bound to msg.sender (caller)
- ✅ Zero-knowledge proof is valid
- ❌ REVERTS if any check fails

## Why Binding Matters

Encryption binding to `[contract, user]` prevents:

1. **Cross-Contract Reuse**: Can't use inputs meant for other contracts
2. **User Spoofing**: Can't submit another user's encrypted inputs
3. **Replay Attacks**: Can't reuse inputs in different contexts

Example:

```typescript
// User A encrypts for contract X
const input = await fhevm
    .createEncryptedInput(contractX, userA)
    .add32(42)
    .encrypt();

// ❌ FAILS: Can't use with contract Y
await contractY.storeValue(input.handles[0], input.inputProof);
// Reason: Binding is to contractX, not contractY
```

## Core Functions

### storeValue()

Store encrypted value for caller.

```solidity
function storeValue(
    externalEuint32 encryptedInput,
    bytes calldata inputProof
) external
```

**Flow**:
1. Verify input: `FHE.fromExternal()`
2. Store in mapping
3. Grant permissions

### updateValue()

Update existing encrypted value by adding.

```solidity
function updateValue(
    externalEuint32 encryptedInput,
    bytes calldata inputProof
) external
```

**Pattern**:
1. Verify new input
2. Load existing value
3. Perform FHE.add()
4. **Re-grant permissions** (critical!)

### getValue()

Get caller's encrypted value.

```solidity
function getValue() external view returns (euint32)
```

Returns encrypted handle. Only user with permission can decrypt.

### getUserValue()

Get another user's encrypted value.

```solidity
function getUserValue(address user) external view returns (euint32)
```

Returns handle but user cannot decrypt without permission.

### compareValues()

Compare two encrypted inputs for equality.

```solidity
function compareValues(
    externalEuint32 input1, bytes calldata proof1,
    externalEuint32 input2, bytes calldata proof2
) external view returns (ebool)
```

Demonstrates encrypted comparisons (FHE.eq).

## FHEVM Patterns

### Pattern: FHE.fromExternal

Verify external encrypted input:

```solidity
euint32 value = FHE.fromExternal(handle, proof);
```

This is the ONLY way to accept encrypted inputs from users!

### Pattern: Input Proof Verification

Proofs are Zero-Knowledge proofs that:
- Attest correct encryption
- Include binding information
- Prevent tampering
- Are verified automatically by FHE.fromExternal

### Pattern: Accessing Other Users' Data

Reading others' encrypted values:

```solidity
euint32 handle = userValues[otherUser];
```

Permissions model:
- **Read**: Anyone can get encrypted handle
- **Decrypt**: Only users with FHE.allow permission

```solidity
FHE.allow(value, userA); // A can decrypt
FHE.allow(value, userB); // B can also decrypt (if A granted permission)
```

### Pattern: Encrypted Comparisons

Compare without decryption:

```solidity
ebool equal = FHE.eq(input1, input2);
ebool notEqual = FHE.ne(input1, input2);
ebool lessThan = FHE.lt(input1, input2);
```

Results are encrypted (ebool), can be:
- Decrypted to get boolean
- Used in FHE.select()
- Combined with FHE.and/FHE.or

## Anti-Patterns and Common Mistakes

### ❌ WRONG: Mismatched Contract Binding

```typescript
// Created for contractX
const input = await fhevm
    .createEncryptedInput(contractX.address, user)
    .add32(42)
    .encrypt();

// Used with contractY
await contractY.storeValue(input.handles[0], input.inputProof);
// FAILS: Binding mismatch
```

### ❌ WRONG: Mismatched User Binding

```typescript
// Created by userA
const input = await fhevm
    .createEncryptedInput(contract, userA.address)
    .add32(42)
    .encrypt();

// Submitted by userB
await contract.connect(userB).storeValue(input.handles[0], input.inputProof);
// FAILS: msg.sender is userB, but binding is userA
```

### ❌ WRONG: Missing Input Proof

```typescript
await contract.storeValue(encryptedHandle, "0x"); // Empty proof!
// FAILS: Proof verification fails
```

### ❌ WRONG: Forgetting Re-Grant After Operation

```solidity
function badUpdate(externalEuint32 input, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(input, proof);
    userValues[msg.sender] = FHE.add(userValues[msg.sender], value);
    // MISSING: FHE.allowThis and FHE.allow!
    // Future operations FAIL
}
```

### ✅ CORRECT: Proper Input Flow

```typescript
// 1. Correct binding
const input = await fhevm
    .createEncryptedInput(contractAddress, signer.address)
    .add32(42)
    .encrypt();

// 2. Correct sender
await contract.connect(signer).storeValue(
    input.handles[0],
    input.inputProof
);

// 3. Contract grants permissions
// (see contract implementation)
```

## Testing

Tests cover:

- ✅ Storing encrypted values
- ✅ Updating encrypted state
- ✅ Reading encrypted values
- ✅ Permission management
- ✅ Encrypted comparisons
- ✅ Error cases with invalid proofs
- ✅ Binding mismatch detection
- ❌ Common anti-patterns

Run:

```bash
npm test
```

## Generate Standalone Repository

```bash
npm run create-example encrypt-single-value ./my-encrypt
cd my-encrypt
npm install
npm run compile
npm test
```

## Security Considerations

### Privacy

- ✅ Values remain encrypted on-chain
- ✅ Only authorized users can decrypt
- ✅ Binding prevents value reuse
- ✅ No plaintext exposure

### Input Validation

Always verify:
1. Input is properly encrypted
2. Proof is valid
3. Binding matches expectations
4. No tampering occurred

FHE.fromExternal handles all this automatically!

## Common Issues

### "Proof verification failed"

**Cause**: Invalid or missing proof

**Solution**: Ensure input.inputProof is included correctly

### "Unauthorized" or "Permission denied"

**Cause**: Missing FHE.allow permission

**Solution**: Check FHE.allow() was called by contract

### Decryption fails silently

**Cause**: Wrong user trying to decrypt

**Solution**: Verify FHE.allow was granted to correct user

## Production Checklist

Before deploying:

- [ ] All inputs verified with FHE.fromExternal()
- [ ] Both FHE.allowThis() and FHE.allow() called
- [ ] Permissions re-granted after operations
- [ ] Input validation and sanitization
- [ ] Error handling for invalid inputs
- [ ] Comprehensive test coverage
- [ ] Security audit completed

## Key Takeaways

1. **Always bind correctly**: `[contract, user]` pair matters
2. **Always include proof**: Zero-knowledge proof required
3. **Always grant permissions**: Both FHE.allowThis() and FHE.allow()
4. **Verify with FHE.fromExternal()**: The safe way to accept inputs
5. **Test thoroughly**: Input handling is critical

## Learning Path

After this example:

1. **Compare with FHE Counter** - See operation after input
2. **Study Voting System** - Complex input handling at scale
3. **Explore Advanced Patterns** - Conditional logic, selections

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Input Handling Guide](https://docs.zama.ai/fhevm/writing-contracts)
- [Security Best Practices](https://docs.zama.ai/fhevm/security)
- [Community Examples](https://github.com/zama-ai/fhevm)

## License

BSD-3-Clause-Clear License

---

**Built for the Zama FHEVM Bounty Program**

*Master encrypted inputs for secure smart contracts*
