// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Encrypt Single Value - Input Encryption Example
 * @notice Demonstrates how to accept and validate encrypted inputs from users
 * @dev This example focuses on the encryption input mechanism and common pitfalls
 *
 * ## Key Concepts:
 * 1. **External Encrypted Inputs**: How users send encrypted data to contracts
 * 2. **Input Proofs**: Zero-knowledge proofs that validate encryption binding
 * 3. **Encryption Binding**: Values are bound to [contract, user] pairs
 * 4. **Common Pitfalls**: What can go wrong with encrypted inputs
 *
 * ## Learning Path:
 * This is typically the second example after FHECounter, focusing specifically
 * on the input encryption mechanism which is critical for all FHEVM applications.
 */
contract EncryptSingleValue is ZamaEthereumConfig {
    /// @notice Mapping of user addresses to their encrypted values
    mapping(address => euint32) private userValues;

    /// @notice Event emitted when a user stores an encrypted value
    event ValueStored(address indexed user);

    /// @notice Event emitted when a user updates their encrypted value
    event ValueUpdated(address indexed user);

    /**
     * @notice Store an encrypted value for the caller
     * @param encryptedInput The encrypted input handle from the user
     * @param inputProof Zero-knowledge proof of correct encryption binding
     *
     * ## How Encryption Input Works:
     *
     * ### Client Side (TypeScript with fhevm.js):
     * ```typescript
     * // 1. Initialize FHEVM instance
     * const fhevm = await FHEVMInstance.getInstance();
     *
     * // 2. Create encrypted input bound to contract and user
     * const encryptedInput = await fhevm
     *     .createEncryptedInput(contractAddress, userAddress)
     *     .add32(42)  // The plaintext value to encrypt
     *     .encrypt();
     *
     * // 3. Send to contract with proof
     * await contract.storeValue(
     *     encryptedInput.handles[0],  // Encrypted value handle
     *     encryptedInput.inputProof   // ZK proof
     * );
     * ```
     *
     * ### Contract Side (This Function):
     * ```solidity
     * // 4. Verify and convert external input
     * euint32 value = FHE.fromExternal(encryptedInput, inputProof);
     *
     * // 5. Store and grant permissions
     * userValues[msg.sender] = value;
     * FHE.allowThis(value);
     * FHE.allow(value, msg.sender);
     * ```
     *
     * ## What FHE.fromExternal Does:
     * - ✅ Verifies the input is properly encrypted
     * - ✅ Checks encryption is bound to THIS contract address
     * - ✅ Checks encryption is bound to msg.sender
     * - ✅ Validates the zero-knowledge proof
     * - ❌ REVERTS if any check fails
     *
     * ## Why Binding Matters:
     * Encryption binding to [contract, user] prevents:
     * - Using encrypted inputs meant for other contracts
     * - One user submitting another user's encrypted inputs
     * - Replay attacks across different contexts
     *
     * @dev In production, consider adding existence checks or update logic
     */
    function storeValue(
        externalEuint32 encryptedInput,
        bytes calldata inputProof
    ) external {
        // Verify and convert external encrypted input
        euint32 value = FHE.fromExternal(encryptedInput, inputProof);

        // Store for the user
        userValues[msg.sender] = value;

        // Grant permissions
        FHE.allowThis(value);        // Contract can use this value
        FHE.allow(value, msg.sender); // User can decrypt this value

        emit ValueStored(msg.sender);
    }

    /**
     * @notice Update the caller's encrypted value by adding to it
     * @param encryptedInput Additional encrypted value to add
     * @param inputProof Proof of correct encryption
     *
     * ## Pattern: Updating Encrypted State
     * When modifying existing encrypted values:
     * 1. Load existing encrypted value from storage
     * 2. Verify new encrypted input
     * 3. Perform encrypted operation (add, sub, etc.)
     * 4. Store result
     * 5. Grant permissions to result
     *
     * ## Common Mistake: Forgetting to Re-Grant Permissions
     * After ANY operation that creates a new encrypted value:
     * ```solidity
     * // ❌ WRONG - Missing permission updates
     * userValues[msg.sender] = FHE.add(userValues[msg.sender], value);
     *
     * // ✅ CORRECT - Permissions granted
     * userValues[msg.sender] = FHE.add(userValues[msg.sender], value);
     * FHE.allowThis(userValues[msg.sender]);
     * FHE.allow(userValues[msg.sender], msg.sender);
     * ```
     */
    function updateValue(
        externalEuint32 encryptedInput,
        bytes calldata inputProof
    ) external {
        require(
            FHE.decrypt(FHE.ne(userValues[msg.sender], FHE.asEuint32(0))),
            "No existing value"
        );

        // Verify new input
        euint32 additionalValue = FHE.fromExternal(encryptedInput, inputProof);

        // Add to existing value
        userValues[msg.sender] = FHE.add(userValues[msg.sender], additionalValue);

        // Re-grant permissions (REQUIRED after operation!)
        FHE.allowThis(userValues[msg.sender]);
        FHE.allow(userValues[msg.sender], msg.sender);

        emit ValueUpdated(msg.sender);
    }

    /**
     * @notice Get the caller's encrypted value
     * @return The encrypted value (as handle)
     *
     * ## Pattern: Reading Encrypted Values
     * View functions can return encrypted values:
     * - Returns encrypted handle (not plaintext)
     * - Only users with FHE.allow permission can decrypt
     * - Decryption happens off-chain via relayer
     *
     * ## Client-Side Decryption:
     * ```typescript
     * // Get encrypted handle
     * const encryptedValue = await contract.getValue();
     *
     * // Decrypt via relayer (requires permission)
     * const plaintext = await fhevm.decrypt(encryptedValue);
     * console.log("My value:", plaintext); // "42"
     * ```
     *
     * @dev Returns zero if user has no stored value
     */
    function getValue() external view returns (euint32) {
        return userValues[msg.sender];
    }

    /**
     * @notice Get another user's encrypted value (if they granted permission)
     * @param user Address of the user
     * @return The encrypted value
     *
     * ## Pattern: Accessing Other Users' Encrypted Data
     * By default, each user can only decrypt their own values.
     * This function allows reading encrypted handles, but decryption
     * still requires explicit permission from the value owner.
     *
     * ## Permission Model:
     * ```solidity
     * // User A stores value
     * FHE.allow(value, userA);  // A can decrypt
     *
     * // User B tries to get A's value
     * euint32 handle = contract.getUserValue(userA);
     * // B has the handle but CANNOT decrypt without permission
     *
     * // A must explicitly grant B permission:
     * FHE.allow(value, userB);  // Now B can decrypt too
     * ```
     */
    function getUserValue(address user) external view returns (euint32) {
        return userValues[user];
    }

    /**
     * @notice Compare two encrypted inputs for equality
     * @param input1 First encrypted value
     * @param proof1 Proof for first input
     * @param input2 Second encrypted value
     * @param proof2 Proof for second input
     * @return True if values are equal (encrypted boolean)
     *
     * ## Pattern: Encrypted Comparisons
     * FHEVM supports encrypted comparison operations:
     * - FHE.eq(a, b)  → encrypted equality
     * - FHE.ne(a, b)  → encrypted inequality
     * - FHE.lt(a, b)  → encrypted less than
     * - FHE.lte(a, b) → encrypted less than or equal
     * - FHE.gt(a, b)  → encrypted greater than
     * - FHE.gte(a, b) → encrypted greater than or equal
     *
     * Result is an encrypted boolean (ebool) which can be:
     * - Used in encrypted conditionals (FHE.select)
     * - Decrypted to get plaintext result
     * - Combined with other ebools (FHE.and, FHE.or)
     *
     * ## Example Use Cases:
     * - Age verification without revealing age
     * - Balance checks without revealing balance
     * - Access control based on encrypted credentials
     */
    function compareValues(
        externalEuint32 input1,
        bytes calldata proof1,
        externalEuint32 input2,
        bytes calldata proof2
    ) external view returns (ebool) {
        euint32 value1 = FHE.fromExternal(input1, proof1);
        euint32 value2 = FHE.fromExternal(input2, proof2);

        return FHE.eq(value1, value2);
    }
}

/**
 * ## Anti-Patterns and Common Mistakes
 *
 * ### ❌ WRONG: Mismatched Encryption Binding
 * ```typescript
 * // Client encrypts for contract A
 * const input = await fhevm
 *     .createEncryptedInput(contractA, user)
 *     .add32(42)
 *     .encrypt();
 *
 * // Tries to send to contract B
 * await contractB.storeValue(input.handles[0], input.inputProof);
 * // FAILS: Binding is to contractA, not contractB
 * ```
 *
 * ### ❌ WRONG: Wrong User in Binding
 * ```typescript
 * // User A encrypts
 * const input = await fhevm
 *     .createEncryptedInput(contract, userA)
 *     .add32(42)
 *     .encrypt();
 *
 * // User B tries to send it
 * await contract.connect(userB).storeValue(input.handles[0], input.inputProof);
 * // FAILS: Binding is to userA, but msg.sender is userB
 * ```
 *
 * ### ❌ WRONG: Missing Input Proof
 * ```typescript
 * await contract.storeValue(encryptedHandle, "0x"); // Empty proof
 * // FAILS: Proof verification fails
 * ```
 *
 * ### ❌ WRONG: Forgetting Permissions After Operation
 * ```solidity
 * function badUpdate(externalEuint32 input, bytes calldata proof) external {
 *     euint32 value = FHE.fromExternal(input, proof);
 *     userValues[msg.sender] = FHE.add(userValues[msg.sender], value);
 *     // MISSING: FHE.allowThis and FHE.allow
 *     // Future operations will FAIL
 * }
 * ```
 *
 * ### ✅ CORRECT: Proper Input Flow
 * ```typescript
 * // 1. Correct binding
 * const input = await fhevm
 *     .createEncryptedInput(CONTRACT_ADDRESS, await signer.getAddress())
 *     .add32(42)
 *     .encrypt();
 *
 * // 2. Correct sender
 * await contract.connect(signer).storeValue(
 *     input.handles[0],
 *     input.inputProof
 * );
 *
 * // 3. Contract grants permissions correctly
 * // (handled in contract)
 * ```
 *
 * ## Summary
 *
 * Key takeaways for encrypted inputs:
 * 1. Always bind encryption to [contract, user]
 * 2. Always include input proof
 * 3. Verify with FHE.fromExternal
 * 4. Grant permissions after every operation
 * 5. Test with correct binding parameters
 */
