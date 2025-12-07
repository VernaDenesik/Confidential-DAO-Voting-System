// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DAO Secret Voting Contract - Preventing Vote Manipulation
contract SecureDAOVoting {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        uint256 votingEnd;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVoters;
        bool executed;
        bool active;
        mapping(address => bool) hasVoted;
        mapping(address => bytes32) voteHashes; // Store vote hashes
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public voterWeight; // Voting weight
    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_VOTING_POWER = 100; // Minimum voting power

    address public owner;
    bool public votingOpen;

    event ProposalCreated(uint256 indexed proposalId, string title, address creator);
    event VoteCommitted(uint256 indexed proposalId, address voter);
    event VoteRevealed(uint256 indexed proposalId, address voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

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

    /// @notice Set voter weight
    function setVoterWeight(address voter, uint256 weight) external onlyOwner {
        voterWeight[voter] = weight;
    }

    /// @notice Set multiple voter weights in batch
    function setMultipleVoterWeights(address[] memory voters, uint256[] memory weights) external onlyOwner {
        require(voters.length == weights.length, "Array length mismatch");
        for (uint i = 0; i < voters.length; i++) {
            voterWeight[voters[i]] = weights[i];
        }
    }

    /// @notice Create a new proposal
    function createProposal(string memory title, string memory description) external votingIsOpen {
        require(voterWeight[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.creator = msg.sender;
        newProposal.createdAt = block.timestamp;
        newProposal.votingEnd = block.timestamp + VOTING_DURATION;
        newProposal.active = true;

        emit ProposalCreated(proposalCount, title, msg.sender);
    }

    /// @notice Submit secret vote (commit phase)
    function commitVote(uint256 proposalId, bytes32 voteHash) external votingIsOpen {
        require(voterWeight[msg.sender] > 0, "No voting permission");
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.active, "Proposal not active");
        require(block.timestamp < proposal.votingEnd, "Voting has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.voteHashes[msg.sender] = voteHash;
        proposal.hasVoted[msg.sender] = true;
        proposal.totalVoters++;

        emit VoteCommitted(proposalId, msg.sender);
    }

    /// @notice Reveal vote (reveal phase)
    function revealVote(uint256 proposalId, bool support, uint256 nonce) external {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.votingEnd, "Voting not ended yet");
        require(proposal.hasVoted[msg.sender], "Did not participate in voting");

        // Verify hash
        bytes32 hash = keccak256(abi.encodePacked(support, nonce, msg.sender));
        require(hash == proposal.voteHashes[msg.sender], "Vote verification failed");

        // Clear hash to prevent duplicate reveals
        proposal.voteHashes[msg.sender] = bytes32(0);

        // Count votes by weight
        uint256 weight = voterWeight[msg.sender];
        if (support) {
            proposal.yesVotes += weight;
        } else {
            proposal.noVotes += weight;
        }

        emit VoteRevealed(proposalId, msg.sender, support);
    }

    /// @notice Execute proposal
    function executeProposal(uint256 proposalId) external {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.votingEnd + 1 days, "Reveal period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.active, "Proposal not active");

        proposal.executed = true;
        bool passed = proposal.yesVotes > proposal.noVotes;

        emit ProposalExecuted(proposalId, passed);
    }

    /// @notice Generate vote hash
    function generateVoteHash(bool support, uint256 nonce) external view returns (bytes32) {
        return keccak256(abi.encodePacked(support, nonce, msg.sender));
    }

    /// @notice Get proposal information
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address creator,
        uint256 createdAt,
        uint256 votingEnd,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVoters,
        bool executed,
        bool active
    ) {
        require(proposalId <= proposalCount && proposalId > 0, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.creator,
            proposal.createdAt,
            proposal.votingEnd,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVoters,
            proposal.executed,
            proposal.active
        );
    }

    /// @notice Check if user has voted
    function hasUserVoted(uint256 proposalId, address user) external view returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }

    /// @notice Get current block time
    function getCurrentTime() external view returns (uint256) {
        return block.timestamp;
    }

    /// @notice Get voting status
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

    /// @notice Open/close voting system
    function setVotingOpen(bool _open) external onlyOwner {
        votingOpen = _open;
    }

    /// @notice Emergency pause proposal
    function pauseProposal(uint256 proposalId) external onlyOwner {
        proposals[proposalId].active = false;
    }
}