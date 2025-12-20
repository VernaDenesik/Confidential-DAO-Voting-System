# FHE Counter - Basic FHEVM Example

Simple encrypted counter demonstrating fundamental FHEVM operations.

## Overview

This example demonstrates the most basic FHEVM patterns:
- Encrypted state variables
- FHE arithmetic operations (add/subtract)
- Permission management
- Input validation

Perfect starting point for learning FHEVM development.

## Key Concepts Demonstrated

### 1. Encrypted State Storage

```solidity
euint32 private _count;
```

State is stored as `euint32` (encrypted 32-bit unsigned integer).

### 2. FHE Arithmetic Operations

```solidity
_count = FHE.add(_count, encryptedValue);  // FHE.add
_count = FHE.sub(_count, encryptedValue);  // FHE.sub
```

Operations preserve encryption:
- Both operands encrypted
- Result stays encrypted
- No plaintext exposure

### 3. Permission Management (CRITICAL!)

```solidity
FHE.allowThis(encryptedValue);        // Contract permission
FHE.allow(encryptedValue, msg.sender); // User permission
```

Both permissions required:
- `FHE.allowThis()` - Contract can use value in future operations
- `FHE.allow()` - User can decrypt value via relayer

## Core Functions

### getCount()

Returns the encrypted counter value.

```solidity
function getCount() external view returns (euint32)
```

**Returns**: Encrypted counter as handle (not plaintext)

**Note**: Only users with `FHE.allow` permission can decrypt.

### increment()

Increments counter by encrypted value.

```solidity
function increment(
    externalEuint32 inputEuint32,
    bytes calldata inputProof
) external
```

**Parameters**:
- `inputEuint32`: Encrypted input handle
- `inputProof`: Zero-knowledge proof

**Pattern**:
1. Verify input with `FHE.fromExternal()`
2. Add to counter with `FHE.add()`
3. Grant both permissions

### decrement()

Decrements counter by encrypted value.

```solidity
function decrement(
    externalEuint32 inputEuint32,
    bytes calldata inputProof
) external
```

**Pattern**: Same as increment, uses `FHE.sub()` instead.

### reset()

Resets counter to zero.

```solidity
function reset() external
```

Uses `FHE.asEuint32(0)` to create encrypted zero value.

## FHEVM Patterns

### Pattern: FHE.fromExternal

Verifies and converts external encrypted input:

```solidity
euint32 encrypted = FHE.fromExternal(inputHandle, inputProof);
```

What it does:
- ✅ Verifies input is properly encrypted
- ✅ Checks binding to contract address
- ✅ Checks binding to msg.sender
- ✅ Validates zero-knowledge proof
- ❌ REVERTS if any check fails

### Pattern: FHE.add

Homomorphic addition:

```solidity
euint32 sum = FHE.add(a, b);
```

Key properties:
- Both operands encrypted throughout
- Result is encrypted
- No plaintext intermediate values
- Arithmetic properties preserved (a + b = b + a)

### Pattern: FHE.sub

Homomorphic subtraction:

```solidity
euint32 difference = FHE.sub(a, b);
```

**Warning**: This example does NOT check for underflow!

Production code should use:
```solidity
ebool isValid = FHE.gte(a, b);
require(FHE.decrypt(isValid), "Underflow");
```

### Pattern: FHE.asEuint32

Create encrypted value from plaintext:

```solidity
euint32 encrypted = FHE.asEuint32(42);
```

Uses:
- Initialization
- Reset operations
- Known encrypted values

### Pattern: Permission Granting

After EVERY operation creating new encrypted value:

```solidity
result = FHE.add(a, b);
FHE.allowThis(result);        // REQUIRED!
FHE.allow(result, msg.sender); // REQUIRED!
```

## Common Mistakes

### ❌ WRONG: Missing FHE.allowThis()

```solidity
_count = FHE.add(_count, input);
FHE.allow(_count, msg.sender); // Missing FHE.allowThis()!
// Next operation FAILS: no contract permission
```

### ❌ WRONG: Missing FHE.allow()

```solidity
_count = FHE.add(_count, input);
FHE.allowThis(_count); // Missing FHE.allow()!
// User cannot decrypt later
```

### ✅ CORRECT: Both Permissions

```solidity
_count = FHE.add(_count, input);
FHE.allowThis(_count);        // ✅
FHE.allow(_count, msg.sender); // ✅
```

## Testing

Comprehensive test suite covers:

- ✅ Contract deployment
- ✅ Increment operations
- ✅ Decrement operations
- ✅ Reset functionality
- ✅ Permission granting
- ✅ Multiple sequential operations
- ✅ Event emissions
- ✅ Edge cases

Run tests:

```bash
npm test
```

## Generate Standalone Repository

```bash
npm run create-example fhe-counter ./my-counter
cd my-counter
npm install
npm run compile
npm test
```

## Security Notes

### Privacy

- ✅ Counter remains encrypted
- ✅ Operations preserve encryption
- ✅ Only authorized users can decrypt
- ✅ No plaintext exposure

### Limitations

This example intentionally omits:
- Overflow/underflow checking
- Owner-only controls
- Rate limiting
- Input validation

Production code should include these.

## Next Steps

After understanding FHE Counter:

1. **Learn Input Validation** → Study EncryptSingleValue example
2. **Explore Comparisons** → Learn FHE.eq, FHE.lt, etc.
3. **Build Real Apps** → Study FHEVM Voting System

## Key Takeaways

1. **Encrypted Types**: Use euint32, euint64, etc.
2. **FHE Operations**: FHE.add, FHE.sub preserve encryption
3. **Permissions**: ALWAYS use both FHE.allowThis() and FHE.allow()
4. **Privacy**: All intermediate values stay encrypted
5. **Testing**: Test encrypted operations thoroughly

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [API Reference](https://docs.zama.ai/fhevm/api)
- [Hardhat Guide](https://hardhat.org/docs)
- [Community Forum](https://www.zama.ai/community)

## License

BSD-3-Clause-Clear License

---

**Built for the Zama FHEVM Bounty Program**

*Your first step into privacy-preserving smart contracts*
