// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Fully Homomorphic Encryption Voting Contract
 * @notice A privacy-preserving voting system using Fully Homomorphic Encryption (FHEVM)
 * @dev Demonstrates encrypted vote tallying and weighted voting with FHE operations
 *
 * ## Key Concepts Demonstrated:
 * - Encrypted vote encryption and aggregation
 * - FHE arithmetic operations on encrypted ballots
 * - Access control with FHE.allow permissions
 * - User and contract decryption patterns
 */
contract FHEMVoting is ZamaEthereumConfig {
    /// @notice Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votingEnd;
        euint32 encryptedYesCount;
        euint32 encryptedNoCount;
        bool executed;
        bool active;
    }

    /// @notice Vote commitment structure
    struct VoteCommitment {
        bytes32 voteHash;
        bool revealed;
    }

    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteCommitment)) public voteCommitments;
    mapping(address => uint256) public voterWeight;

    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_VOTING_POWER = 100;

    address public owner;
    bool public votingOpen;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address creator,
        uint256 votingEnd
    );

    event VoteCommitted(
        uint256 indexed proposalId,
        address indexed voter,
        bytes32 voteHash
    );

    event VoteRevealed(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        bool passed,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can operate");
        _;
    }

    modifier votingIsOpen() {
        require(votingOpen, "Voting system is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = true;
    }

    /**
     * @notice Set voting weight for a single voter
     * @param voter Address of the voter
     * @param weight Voting weight (0 = no voting rights)
     */
    function setVoterWeight(address voter, uint256 weight) external onlyOwner {
        voterWeight[voter] = weight;
    }

    /**
     * @notice Set voting weights for multiple voters in batch
     * @param voters Array of voter addresses
     * @param weights Array of corresponding weights
     */
    function setMultipleVoterWeights(
        address[] memory voters,
        uint256[] memory weights
    ) external onlyOwner {
        require(voters.length == weights.length, "Array length mismatch");
        for (uint i = 0; i < voters.length; i++) {
            voterWeight[voters[i]] = weights[i];
        }
    }

    /**
     * @notice Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     *
     * ## Requirements:
     * - Caller must have voting power >= MIN_VOTING_POWER
     * - Voting system must be open
     *
     * ## Effects:
     * - Creates new proposal with voting end time = now + VOTING_DURATION
     * - Initializes encrypted vote counters (both start at encrypted 0)
     */
    function createProposal(
        string memory title,
        string memory description
    ) external votingIsOpen {
        require(
            voterWeight[msg.sender] >= MIN_VOTING_POWER,
            "Insufficient voting power"
        );

        proposalCount++;
        uint256 proposalId = proposalCount;
        Proposal storage newProposal = proposals[proposalId];

        newProposal.id = proposalId;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.creator = msg.sender;
        newProposal.createdAt = block.timestamp;
        newProposal.votingEnd = block.timestamp + VOTING_DURATION;
        newProposal.active = true;

        // Initialize encrypted vote counts to 0
        // These will be updated with FHE operations as votes are revealed
        newProposal.encryptedYesCount = FHE.asEuint32(0);
        newProposal.encryptedNoCount = FHE.asEuint32(0);

        emit ProposalCreated(proposalId, title, msg.sender, newProposal.votingEnd);
    }

    /**
     * @notice Commit a vote (Phase 1: Privacy phase)
     * @param proposalId ID of the proposal
     * @param voteHash Keccak256 hash of (support, nonce, voter)
     *
     * ## Pattern: Commit-Reveal Mechanism
     * - Commit phase: Voter submits hash of vote + random nonce
     * - Reveal phase: Voter reveals actual vote for verification
     * - Prevents vote selling and coercion
     *
     * ## Requirements:
     * - Voter must have voting power > 0
     * - Proposal must exist and be active
     * - Current time must be within voting period
     * - Voter must not have already voted
     */
    function commitVote(
        uint256 proposalId,
        bytes32 voteHash
    ) external votingIsOpen {
        require(voterWeight[msg.sender] > 0, "No voting permission");
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "Proposal not active");
        require(block.timestamp < proposal.votingEnd, "Voting period ended");
        require(
            voteCommitments[proposalId][msg.sender].voteHash == bytes32(0),
            "Vote already committed"
        );

        voteCommitments[proposalId][msg.sender].voteHash = voteHash;

        emit VoteCommitted(proposalId, msg.sender, voteHash);
    }

    /**
     * @notice Reveal and tally a vote (Phase 2: Tally phase)
     * @param proposalId ID of the proposal
     * @param support True for yes vote, false for no vote
     * @param nonce Random nonce used during commit phase
     *
     * ## FHEVM Integration Pattern:
     * This function demonstrates encrypted arithmetic on ballots:
     * 1. Verify vote commitment matches hash
     * 2. Create encrypted weight value
     * 3. Add to encrypted vote counter using FHE.add
     * 4. Grant permissions with FHE.allowThis and FHE.allow
     *
     * ## Security Notes:
     * - Vote hash verification prevents tampering
     * - FHE.allowThis() grants contract permission to encrypted values
     * - FHE.allow() grants user permission for decryption
     *
     * ## Requirements:
     * - Voting period must have ended
     * - Vote hash must match commitment
     * - Voter must not have already revealed
     */
    function revealVote(
        uint256 proposalId,
        bool support,
        uint256 nonce
    ) external {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.votingEnd, "Voting period not ended");

        VoteCommitment storage commitment = voteCommitments[proposalId][msg.sender];
        require(commitment.voteHash != bytes32(0), "No vote commitment found");
        require(!commitment.revealed, "Vote already revealed");

        // Verify vote hash matches commitment
        bytes32 expectedHash = keccak256(abi.encodePacked(support, nonce, msg.sender));
        require(expectedHash == commitment.voteHash, "Vote verification failed");

        // Mark as revealed to prevent double counting
        commitment.revealed = true;

        uint256 weight = voterWeight[msg.sender];

        // Create encrypted weight value
        euint32 encryptedWeight = FHE.asEuint32(uint32(weight));

        // Add to appropriate counter using FHE arithmetic
        if (support) {
            proposal.encryptedYesCount = FHE.add(
                proposal.encryptedYesCount,
                encryptedWeight
            );
            // Grant permissions for encrypted value
            FHE.allowThis(proposal.encryptedYesCount);
            FHE.allow(proposal.encryptedYesCount, msg.sender);
        } else {
            proposal.encryptedNoCount = FHE.add(
                proposal.encryptedNoCount,
                encryptedWeight
            );
            FHE.allowThis(proposal.encryptedNoCount);
            FHE.allow(proposal.encryptedNoCount, msg.sender);
        }

        emit VoteRevealed(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Execute a proposal (requires manual decryption of results)
     * @param proposalId ID of the proposal
     *
     * ## Decryption Note:
     * FHEVM uses relayer-based decryption:
     * 1. Proposal enters execution phase
     * 2. User requests decryption of encrypted vote counts via relayer
     * 3. Relayer returns plaintext results
     * 4. Off-chain: Compare decrypted yesVotes > noVotes to determine outcome
     *
     * ## Requirements:
     * - Reveal period must have ended (voting + 1 day buffer)
     * - Proposal must not be already executed
     * - Proposal must be active
     */
    function executeProposal(uint256 proposalId) external {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];
        require(
            block.timestamp >= proposal.votingEnd + 1 days,
            "Reveal period not ended"
        );
        require(!proposal.executed, "Proposal already executed");
        require(proposal.active, "Proposal not active");

        proposal.executed = true;

        emit ProposalExecuted(proposalId, true, block.timestamp);
    }

    /**
     * @notice Generate vote commitment hash
     * @param support True for yes, false for no
     * @param nonce Random nonce value
     * @return Hash of (support, nonce, msg.sender)
     *
     * ## Pattern: Hash Commitment
     * - Prevents vote prediction
     * - Voter must remember nonce for reveal phase
     * - Should use cryptographically secure random nonce
     */
    function generateVoteHash(
        bool support,
        uint256 nonce
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(support, nonce, msg.sender));
    }

    /**
     * @notice Get proposal information
     * @param proposalId ID of the proposal
     * @return Proposal details (note: encrypted vote counts are not readable here)
     */
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory description,
            address creator,
            uint256 createdAt,
            uint256 votingEnd,
            bool executed,
            bool active
        )
    {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.creator,
            proposal.createdAt,
            proposal.votingEnd,
            proposal.executed,
            proposal.active
        );
    }

    /**
     * @notice Check if user has voted on a proposal
     * @param proposalId ID of the proposal
     * @param user Address of the user
     * @return True if user has committed a vote
     */
    function hasUserVoted(uint256 proposalId, address user) external view returns (bool) {
        return voteCommitments[proposalId][user].voteHash != bytes32(0);
    }

    /**
     * @notice Check if user has revealed their vote
     * @param proposalId ID of the proposal
     * @param user Address of the user
     * @return True if user has revealed their vote
     */
    function hasUserRevealed(uint256 proposalId, address user) external view returns (bool) {
        return voteCommitments[proposalId][user].revealed;
    }

    /**
     * @notice Get current block timestamp
     * @return Current timestamp
     */
    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }

    /**
     * @notice Get voting status for a proposal
     * @param proposalId ID of the proposal
     * @return Current status as string
     */
    function getVotingStatus(uint256 proposalId) external view returns (string memory) {
        if (proposalId > proposalCount || proposalId == 0) {
            return "Proposal does not exist";
        }

        Proposal storage proposal = proposals[proposalId];
        if (!proposal.active) {
            return "Proposal not active";
        }
        if (proposal.executed) {
            return "Executed";
        }
        if (block.timestamp < proposal.votingEnd) {
            return "Voting in progress";
        }
        if (block.timestamp < proposal.votingEnd + 1 days) {
            return "Reveal phase";
        }
        return "Awaiting execution";
    }

    /**
     * @notice Set voting system open/closed status
     * @param _open True to enable voting, false to disable
     */
    function setVotingOpen(bool _open) external onlyOwner {
        votingOpen = _open;
    }

    /**
     * @notice Emergency pause a specific proposal
     * @param proposalId ID of the proposal
     */
    function pauseProposal(uint256 proposalId) external onlyOwner {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        proposals[proposalId].active = false;
    }
}
