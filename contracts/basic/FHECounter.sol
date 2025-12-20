// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Counter - Basic Example
 * @notice A simple encrypted counter demonstrating fundamental FHEVM operations
 * @dev This is the most basic FHEVM example, showing how to:
 *      - Initialize encrypted state
 *      - Accept encrypted inputs with proofs
 *      - Perform encrypted arithmetic (add/sub)
 *      - Manage permissions properly
 *
 * ## Key Concepts Demonstrated:
 * 1. **Encrypted State Storage**: euint32 private state variable
 * 2. **Input Proofs**: Verification of encrypted inputs from users
 * 3. **FHE Arithmetic**: FHE.add and FHE.sub on encrypted values
 * 4. **Permission Management**: FHE.allowThis and FHE.allow patterns
 *
 * ## Learning Objectives:
 * - Understand FHEVM encrypted types (euint32, euint64, etc.)
 * - Learn proper permission granting workflow
 * - See how encrypted operations preserve privacy
 * - Understand input proof requirements
 */
contract FHECounter is ZamaEthereumConfig {
    /// @notice The encrypted counter value
    /// @dev Stored as euint32, supports values 0 to 2^32-1
    euint32 private _count;

    /// @notice Event emitted when counter is incremented
    event Incremented(address indexed user);

    /// @notice Event emitted when counter is decremented
    event Decremented(address indexed user);

    /**
     * @notice Returns the encrypted count value
     * @return The current encrypted counter as euint32
     * @dev This returns the encrypted handle, not the plaintext value.
     *      To get plaintext, the caller must use the FHEVM relayer to decrypt.
     *
     * ## Security Note:
     * The encrypted value is only decryptable by addresses that have been
     * granted permission via FHE.allow(). Without permission, the value
     * remains confidential.
     */
    function getCount() external view returns (euint32) {
        return _count;
    }

    /**
     * @notice Increments the counter by an encrypted value
     * @param inputEuint32 External encrypted input (handle)
     * @param inputProof Zero-knowledge proof attesting correct encryption
     *
     * ## How It Works:
     * 1. User encrypts a value locally (e.g., "5")
     * 2. Encryption binds to [contract address, user address]
     * 3. User generates ZK proof of correct binding
     * 4. Contract verifies proof via FHE.fromExternal()
     * 5. Encrypted addition: _count = FHE.add(_count, input)
     * 6. Permissions granted to both contract and user
     *
     * ## FHEVM Pattern: FHE.fromExternal
     * ```solidity
     * euint32 encryptedInput = FHE.fromExternal(inputEuint32, inputProof);
     * ```
     * This verifies:
     * - Input is properly encrypted
     * - Encryption binding matches contract and caller
     * - Proof is valid
     *
     * ## FHEVM Pattern: FHE.add
     * ```solidity
     * _count = FHE.add(_count, encryptedInput);
     * ```
     * Performs homomorphic addition:
     * - Both operands remain encrypted
     * - Result is encrypted
     * - No plaintext data exposed
     *
     * ## FHEVM Pattern: Permission Granting (CRITICAL!)
     * ```solidity
     * FHE.allowThis(_count);        // Contract can use this value
     * FHE.allow(_count, msg.sender); // User can decrypt this value
     * ```
     * **BOTH are required!**
     * - Missing FHE.allowThis() → Contract cannot use value in future operations
     * - Missing FHE.allow() → User cannot decrypt the value
     *
     * @dev This example omits overflow/underflow checks for simplicity.
     *      In production, implement proper range validation.
     */
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        // Step 1: Verify and convert external encrypted input
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Step 2: Perform encrypted addition
        _count = FHE.add(_count, encryptedEuint32);

        // Step 3: Grant permissions (BOTH required!)
        FHE.allowThis(_count);        // Contract permission
        FHE.allow(_count, msg.sender); // User permission

        emit Incremented(msg.sender);
    }

    /**
     * @notice Decrements the counter by an encrypted value
     * @param inputEuint32 External encrypted input (handle)
     * @param inputProof Zero-knowledge proof attesting correct encryption
     *
     * ## FHEVM Pattern: FHE.sub
     * ```solidity
     * _count = FHE.sub(_count, encryptedInput);
     * ```
     * Performs homomorphic subtraction:
     * - Both operands remain encrypted throughout
     * - Result is encrypted
     * - No intermediate plaintext values
     *
     * ## Important Security Note:
     * This example does NOT check for underflow. In a production contract,
     * you would use FHE comparison operations to ensure _count >= input:
     * ```solidity
     * ebool isValid = FHE.gte(_count, encryptedInput);
     * require(FHE.decrypt(isValid), "Underflow detected");
     * ```
     *
     * @dev Simplified version omitting underflow protection for clarity
     */
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        // Step 1: Verify and convert external encrypted input
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Step 2: Perform encrypted subtraction
        _count = FHE.sub(_count, encryptedEuint32);

        // Step 3: Grant permissions (BOTH required!)
        FHE.allowThis(_count);        // Contract permission
        FHE.allow(_count, msg.sender); // User permission

        emit Decremented(msg.sender);
    }

    /**
     * @notice Resets the counter to zero (for testing purposes)
     * @dev In production, this might be restricted to admin/owner
     *
     * ## FHEVM Pattern: FHE.asEuint32
     * ```solidity
     * _count = FHE.asEuint32(0);
     * ```
     * Creates a new encrypted value from a plaintext literal:
     * - Input is plaintext (0)
     * - Output is encrypted
     * - Useful for initialization
     */
    function reset() external {
        _count = FHE.asEuint32(0);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}
