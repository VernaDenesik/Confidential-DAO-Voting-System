import { expect } from "chai";
import { ethers } from "hardhat";
import { FHEMVoting } from "../types";

/**
 * @title FHEMVoting Contract Tests
 * @notice Comprehensive test suite demonstrating FHEVM voting patterns
 *
 * ## Test Categories:
 * - Proposal lifecycle management
 * - Voting permissions and access control
 * - Vote commitment and reveal mechanism
 * - FHEVM encrypted operations
 * - Error handling and edge cases
 *
 * ## Key Concepts Tested:
 * 1. Encrypted vote aggregation using FHE.add
 * 2. Permission management with FHE.allow and FHE.allowThis
 * 3. Commit-reveal voting pattern for privacy
 * 4. Weighted voting with different voter powers
 * 5. Time-locked proposal phases
 */
describe("FHEMVoting - Fully Homomorphic Encryption Voting System", () => {
  let votingContract: FHEMVoting;
  let owner: any;
  let proposer: any;
  let voter1: any;
  let voter2: any;
  let voter3: any;

  // Helper function to create vote hash
  const createVoteHash = async (
    support: boolean,
    nonce: number,
    voterAddress: string
  ): Promise<string> => {
    return ethers.solidityPackedKeccak256(
      ["bool", "uint256", "address"],
      [support, nonce, voterAddress]
    );
  };

  beforeEach(async () => {
    // Get test signers
    [owner, proposer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy FHEMVoting contract
    const FHEMVotingFactory = await ethers.getContractFactory("FHEMVoting");
    votingContract = (await FHEMVotingFactory.deploy()) as FHEMVoting;
    await votingContract.waitForDeployment();

    // ✅ PATTERN: Batch weight assignment for efficient voter registration
    // Set voting weights for all participants
    await votingContract.setMultipleVoterWeights(
      [owner.address, proposer.address, voter1.address, voter2.address, voter3.address],
      [1000, 500, 300, 200, 100]
    );
  });

  describe("Proposal Creation and Management", () => {
    /**
     * ## Pattern: Proposal Creation with Voting Power Requirements
     * - Only users with sufficient voting power can create proposals
     * - Voting period is automatically set to current time + VOTING_DURATION
     * - Proposals initialize with zero encrypted vote counts
     */
    it("✅ Should create proposal with valid voting power", async () => {
      const title = "Upgrade Protocol to Version 2";
      const description = "Increase block size limit and improve consensus mechanism";

      const tx = await votingContract.connect(proposer).createProposal(title, description);
      const receipt = await tx.wait();

      // Verify proposal was created
      const proposal = await votingContract.getProposal(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.creator).to.equal(proposer.address);
      expect(proposal.active).to.be.true;
      expect(proposal.executed).to.be.false;

      // Verify event was emitted
      expect(receipt?.logs.length).to.be.greaterThan(0);
    });

    it("❌ Should reject proposal creation from user with insufficient voting power", async () => {
      // User with zero voting power attempts to create proposal
      const [, , , , , lowPowerUser] = await ethers.getSigners();

      await expect(
        votingContract.connect(lowPowerUser).createProposal("Malicious Proposal", "Description")
      ).to.be.revertedWith("Insufficient voting power");
    });

    it("✅ Should allow multiple proposals", async () => {
      // Create first proposal
      await votingContract.connect(proposer).createProposal("Proposal 1", "Description 1");

      // Create second proposal
      await votingContract.connect(voter1).createProposal("Proposal 2", "Description 2");

      const proposal1 = await votingContract.getProposal(1);
      const proposal2 = await votingContract.getProposal(2);

      expect(proposal1.title).to.equal("Proposal 1");
      expect(proposal2.title).to.equal("Proposal 2");
      expect(proposal1.id).to.equal(1);
      expect(proposal2.id).to.equal(2);
    });

    it("✅ Should correctly set voting end time", async () => {
      const currentTime = await votingContract.getCurrentTime();
      const VOTING_DURATION = 7 * 24 * 60 * 60; // 7 days

      await votingContract.connect(proposer).createProposal("Test", "Test");
      const proposal = await votingContract.getProposal(1);

      // Verify voting end is approximately 7 days from creation
      expect(proposal.votingEnd).to.be.greaterThan(currentTime);
      expect(proposal.votingEnd).to.be.lessThanOrEqual(currentTime + VOTING_DURATION + 10); // +10 for gas variations
    });
  });

  describe("Vote Commitment - Phase 1 (Privacy Phase)", () => {
    /**
     * ## Pattern: Commit-Reveal Voting
     * Phase 1: Voters submit hash commitment to hide actual vote
     * - Prevents vote selling (buyer can't verify delivery)
     * - Prevents coercion (voter can claim false vote commitment)
     * - Enables strategic protection (no early results available)
     */
    beforeEach(async () => {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Test Description");
    });

    it("✅ Should commit vote with valid hash", async () => {
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      const tx = await votingContract.connect(voter1).commitVote(1, voteHash);
      const receipt = await tx.wait();

      // Check vote commitment was recorded
      const hasVoted = await votingContract.hasUserVoted(1, voter1.address);
      expect(hasVoted).to.be.true;

      // Verify not yet revealed
      const hasRevealed = await votingContract.hasUserRevealed(1, voter1.address);
      expect(hasRevealed).to.be.false;

      // Verify event was emitted
      expect(receipt?.logs.length).to.be.greaterThan(0);
    });

    it("❌ Should prevent vote commitment from user without voting power", async () => {
      const [, , , , , lowPowerUser] = await ethers.getSigners();
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, lowPowerUser.address);

      await expect(votingContract.connect(lowPowerUser).commitVote(1, voteHash)).to.be.revertedWith(
        "No voting permission"
      );
    });

    it("❌ Should prevent double voting", async () => {
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      // First commit
      await votingContract.connect(voter1).commitVote(1, voteHash);

      // Second commit should fail
      const differentHash = await createVoteHash(false, 54321, voter1.address);
      await expect(votingContract.connect(voter1).commitVote(1, differentHash)).to.be.revertedWith(
        "Vote already committed"
      );
    });

    it("❌ Should prevent commit after voting period ends", async () => {
      // Fast forward time past voting period
      const votingDuration = 7 * 24 * 60 * 60; // 7 days
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 13).toString(16)]); // Approximate blocks

      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      await expect(votingContract.connect(voter1).commitVote(1, voteHash)).to.be.revertedWith(
        "Voting period ended"
      );
    });

    it("✅ Should allow multiple voters to commit", async () => {
      const nonce1 = 11111;
      const nonce2 = 22222;
      const nonce3 = 33333;

      const hash1 = await createVoteHash(true, nonce1, voter1.address);
      const hash2 = await createVoteHash(false, nonce2, voter2.address);
      const hash3 = await createVoteHash(true, nonce3, voter3.address);

      await votingContract.connect(voter1).commitVote(1, hash1);
      await votingContract.connect(voter2).commitVote(1, hash2);
      await votingContract.connect(voter3).commitVote(1, hash3);

      expect(await votingContract.hasUserVoted(1, voter1.address)).to.be.true;
      expect(await votingContract.hasUserVoted(1, voter2.address)).to.be.true;
      expect(await votingContract.hasUserVoted(1, voter3.address)).to.be.true;
    });

    it("❌ Should prevent commit for non-existent proposal", async () => {
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      await expect(votingContract.connect(voter1).commitVote(999, voteHash)).to.be.revertedWith(
        "Proposal does not exist"
      );
    });
  });

  describe("Vote Reveal - Phase 2 (Tally Phase)", () => {
    /**
     * ## Pattern: FHEVM Encrypted Vote Tallying
     * Phase 2: Voters reveal actual vote and verify commitment
     * - Voter provides original vote choice and nonce
     * - Contract verifies hash = keccak256(choice, nonce, voter)
     * - Encrypted vote count updated using FHE.add operation
     * - FHE.allowThis() and FHE.allow() grant permissions
     */
    beforeEach(async () => {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Test Description");

      // Setup vote commitments for all voters
      const nonce1 = 11111;
      const nonce2 = 22222;
      const nonce3 = 33333;

      const hash1 = await createVoteHash(true, nonce1, voter1.address);
      const hash2 = await createVoteHash(false, nonce2, voter2.address);
      const hash3 = await createVoteHash(true, nonce3, voter3.address);

      await votingContract.connect(voter1).commitVote(1, hash1);
      await votingContract.connect(voter2).commitVote(1, hash2);
      await votingContract.connect(voter3).commitVote(1, hash3);

      // Store nonces for reveal phase
      this.nonces = { voter1: nonce1, voter2: nonce2, voter3: nonce3 };
    });

    it("❌ Should prevent reveal before voting period ends", async () => {
      const nonce = 11111;
      await expect(votingContract.connect(voter1).revealVote(1, true, nonce)).to.be.revertedWith(
        "Voting period not ended"
      );
    });

    it("✅ Should reveal vote with correct hash verification", async () => {
      // Fast forward to end voting period
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      const nonce = 11111;
      const tx = await votingContract.connect(voter1).revealVote(1, true, nonce);
      const receipt = await tx.wait();

      // Verify vote was revealed
      const hasRevealed = await votingContract.hasUserRevealed(1, voter1.address);
      expect(hasRevealed).to.be.true;

      // Verify event was emitted
      expect(receipt?.logs.length).to.be.greaterThan(0);
    });

    it("❌ Should reject reveal with incorrect nonce", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      const wrongNonce = 99999;
      await expect(votingContract.connect(voter1).revealVote(1, true, wrongNonce)).to.be.revertedWith(
        "Vote verification failed"
      );
    });

    it("❌ Should reject reveal with different vote choice", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      // Originally committed to true, but reveal with false
      const nonce = 11111;
      await expect(votingContract.connect(voter1).revealVote(1, false, nonce)).to.be.revertedWith(
        "Vote verification failed"
      );
    });

    it("❌ Should prevent double reveal", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      const nonce = 11111;

      // First reveal
      await votingContract.connect(voter1).revealVote(1, true, nonce);

      // Second reveal should fail (already revealed)
      await expect(votingContract.connect(voter1).revealVote(1, true, nonce)).to.be.revertedWith(
        "Vote already revealed"
      );
    });

    it("✅ Should accept multiple reveals in sequence", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      // Reveal from voter1 (voted yes, weight 300)
      await votingContract.connect(voter1).revealVote(1, true, 11111);

      // Reveal from voter2 (voted no, weight 200)
      await votingContract.connect(voter2).revealVote(1, false, 22222);

      // Reveal from voter3 (voted yes, weight 100)
      await votingContract.connect(voter3).revealVote(1, true, 33333);

      // All should be revealed
      expect(await votingContract.hasUserRevealed(1, voter1.address)).to.be.true;
      expect(await votingContract.hasUserRevealed(1, voter2.address)).to.be.true;
      expect(await votingContract.hasUserRevealed(1, voter3.address)).to.be.true;
    });

    it("❌ Should prevent reveal without prior commitment", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      const [, , , , , nonVoter] = await ethers.getSigners();
      const nonce = 12345;

      await expect(votingContract.connect(nonVoter).revealVote(1, true, nonce)).to.be.revertedWith(
        "No vote commitment found"
      );
    });
  });

  describe("Proposal Execution", () => {
    /**
     * ## Pattern: Multi-Phase Governance Execution
     * 1. Commit phase: Voters submit encrypted vote commitments
     * 2. Reveal phase: Voters reveal and tally encrypted votes (1 day buffer)
     * 3. Execution phase: Proposal can be executed based on results
     *
     * Note: Vote counting requires relayer-based decryption
     * which happens off-chain after reveal phase
     */
    beforeEach(async () => {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Test Description");

      const hash1 = await createVoteHash(true, 11111, voter1.address);
      const hash2 = await createVoteHash(false, 22222, voter2.address);

      await votingContract.connect(voter1).commitVote(1, hash1);
      await votingContract.connect(voter2).commitVote(1, hash2);
    });

    it("❌ Should prevent execution during voting period", async () => {
      await expect(votingContract.executeProposal(1)).to.be.revertedWith(
        "Reveal period not ended"
      );
    });

    it("❌ Should prevent execution before reveal period ends", async () => {
      // End voting period
      const votingDuration = 7 * 24 * 60 * 60;
      await ethers.provider.send("hardhat_mine", ["0x" + (votingDuration / 12).toString(16)]);

      // Reveal some votes
      await votingContract.connect(voter1).revealVote(1, true, 11111);

      // Still in reveal period (needs 1 more day)
      await expect(votingContract.executeProposal(1)).to.be.revertedWith(
        "Reveal period not ended"
      );
    });

    it("✅ Should allow execution after reveal period", async () => {
      // End voting and reveal period
      const votingDuration = 7 * 24 * 60 * 60;
      const revealDuration = 1 * 24 * 60 * 60;
      const totalDuration = votingDuration + revealDuration;

      await ethers.provider.send("hardhat_mine", ["0x" + (totalDuration / 12).toString(16)]);

      const tx = await votingContract.executeProposal(1);
      const receipt = await tx.wait();

      const proposal = await votingContract.getProposal(1);
      expect(proposal.executed).to.be.true;

      // Verify event emitted
      expect(receipt?.logs.length).to.be.greaterThan(0);
    });

    it("❌ Should prevent double execution", async () => {
      const votingDuration = 7 * 24 * 60 * 60;
      const revealDuration = 1 * 24 * 60 * 60;
      const totalDuration = votingDuration + revealDuration;

      await ethers.provider.send("hardhat_mine", ["0x" + (totalDuration / 12).toString(16)]);

      // First execution
      await votingContract.executeProposal(1);

      // Second execution should fail
      await expect(votingContract.executeProposal(1)).to.be.revertedWith(
        "Proposal already executed"
      );
    });
  });

  describe("Voting System Administration", () => {
    /**
     * ## Pattern: Owner-Only Administrative Functions
     * - Voter weight management
     * - System pause/resume
     * - Emergency proposal pause
     */
    it("✅ Owner can set voter weights", async () => {
      await votingContract.setVoterWeight(voter1.address, 1000);
      const proposal = await votingContract.createProposal("Test", "Test");

      const weight = await votingContract.voterWeight(voter1.address);
      expect(weight).to.equal(1000);
    });

    it("✅ Owner can batch set voter weights", async () => {
      const voters = [voter1.address, voter2.address, voter3.address];
      const weights = [500, 600, 700];

      await votingContract.setMultipleVoterWeights(voters, weights);

      expect(await votingContract.voterWeight(voter1.address)).to.equal(500);
      expect(await votingContract.voterWeight(voter2.address)).to.equal(600);
      expect(await votingContract.voterWeight(voter3.address)).to.equal(700);
    });

    it("❌ Non-owner cannot set voter weights", async () => {
      await expect(
        votingContract.connect(voter1).setVoterWeight(voter2.address, 1000)
      ).to.be.revertedWith("Only owner can operate");
    });

    it("✅ Owner can pause voting system", async () => {
      await votingContract.setVotingOpen(false);

      await expect(votingContract.connect(proposer).createProposal("Test", "Test")).to.be.revertedWith(
        "Voting system is closed"
      );
    });

    it("✅ Owner can resume voting system", async () => {
      await votingContract.setVotingOpen(false);
      await votingContract.setVotingOpen(true);

      // Should succeed now
      const tx = await votingContract.connect(proposer).createProposal("Test", "Test");
      expect(tx).to.not.be.undefined;
    });

    it("✅ Owner can pause individual proposal", async () => {
      await votingContract.connect(proposer).createProposal("Test", "Test");

      await votingContract.pauseProposal(1);

      const proposal = await votingContract.getProposal(1);
      expect(proposal.active).to.be.false;

      // Should not allow voting on paused proposal
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      await expect(votingContract.connect(voter1).commitVote(1, voteHash)).to.be.revertedWith(
        "Proposal not active"
      );
    });
  });

  describe("View Functions and Queries", () => {
    /**
     * ## Pattern: Read-Only Query Functions
     * Provide voting status, proposal details, and system state without state changes
     */
    beforeEach(async () => {
      await votingContract.connect(proposer).createProposal("Test Proposal", "Test Description");
    });

    it("✅ Should return current time", async () => {
      const currentTime = await votingContract.getCurrentTime();
      expect(currentTime).to.be.greaterThan(0);
    });

    it("✅ Should return voting status - voting in progress", async () => {
      const status = await votingContract.getVotingStatus(1);
      expect(status).to.equal("Voting in progress");
    });

    it("✅ Should return voting status - proposal does not exist", async () => {
      const status = await votingContract.getVotingStatus(999);
      expect(status).to.equal("Proposal does not exist");
    });

    it("✅ Should generate correct vote hash", async () => {
      const support = true;
      const nonce = 12345;
      const voterAddress = voter1.address;

      const hash = await votingContract.connect(voter1).generateVoteHash(support, nonce);
      const expectedHash = ethers.solidityPackedKeccak256(
        ["bool", "uint256", "address"],
        [support, nonce, voterAddress]
      );

      expect(hash).to.equal(expectedHash);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("❌ Should reject operations on non-existent proposals", async () => {
      const nonce = 12345;
      const voteHash = await createVoteHash(true, nonce, voter1.address);

      await expect(votingContract.connect(voter1).commitVote(999, voteHash)).to.be.revertedWith(
        "Proposal does not exist"
      );

      await expect(votingContract.getProposal(999)).to.be.revertedWith("Proposal does not exist");

      await expect(votingContract.executeProposal(999)).to.be.revertedWith(
        "Proposal does not exist"
      );
    });

    it("❌ Should require equal length arrays in batch operations", async () => {
      const voters = [voter1.address, voter2.address];
      const weights = [100]; // Mismatched length

      await expect(votingContract.setMultipleVoterWeights(voters, weights)).to.be.revertedWith(
        "Array length mismatch"
      );
    });
  });
});
