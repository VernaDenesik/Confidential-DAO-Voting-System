const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureDAOVoting", function () {
  let daoVoting;
  let owner, voter1, voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();

    const SecureDAOVoting = await ethers.getContractFactory("SecureDAOVoting");
    daoVoting = await SecureDAOVoting.deploy();
    await daoVoting.waitForDeployment();

    // 设置投票权重
    await daoVoting.setVoterWeight(owner.address, 1000);
    await daoVoting.setVoterWeight(voter1.address, 500);
    await daoVoting.setVoterWeight(voter2.address, 300);
  });

  describe("Proposal Creation", function () {
    it("should be able to create proposal", async function () {
      await daoVoting.createProposal("Test Proposal", "This is a test proposal description");
      
      const proposal = await daoVoting.getProposal(1);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.description).to.equal("This is a test proposal description");
      expect(proposal.creator).to.equal(owner.address);
    });

    it("users with insufficient voting weight cannot create proposals", async function () {
      const [, , , lowWeightUser] = await ethers.getSigners();
      await expect(
        daoVoting.connect(lowWeightUser).createProposal("Test", "Description")
      ).to.be.revertedWith("Insufficient voting power");
    });
  });

  describe("Secret Voting", function () {
    beforeEach(async function () {
      await daoVoting.createProposal("Test Proposal", "Test Description");
    });

    it("should be able to submit vote commitment", async function () {
      const support = true;
      const nonce = 12345;
      const voteHash = await daoVoting.generateVoteHash(support, nonce);

      await daoVoting.connect(voter1).commitVote(1, voteHash);
      
      const hasVoted = await daoVoting.hasUserVoted(1, voter1.address);
      expect(hasVoted).to.be.true;
    });

    it("should not allow duplicate voting", async function () {
      const support = true;
      const nonce = 12345;
      const voteHash = await daoVoting.generateVoteHash(support, nonce);

      await daoVoting.connect(voter1).commitVote(1, voteHash);
      
      await expect(
        daoVoting.connect(voter1).commitVote(1, voteHash)
      ).to.be.revertedWith("Already voted");
    });
  });

  describe("Batch Weight Setting", function () {
    it("should be able to set multiple voter weights", async function () {
      const voters = [voter1.address, voter2.address];
      const weights = [800, 600];

      await daoVoting.setMultipleVoterWeights(voters, weights);

      expect(await daoVoting.voterWeight(voter1.address)).to.equal(800);
      expect(await daoVoting.voterWeight(voter2.address)).to.equal(600);
    });
  });

  describe("Voting Status", function () {
    beforeEach(async function () {
      await daoVoting.createProposal("Test Proposal", "Test Description");
    });

    it("should correctly display voting status", async function () {
      const status = await daoVoting.getVotingStatus(1);
      expect(status).to.equal("Voting in progress");
    });

    it("non-existent proposal should return correct status", async function () {
      const status = await daoVoting.getVotingStatus(999);
      expect(status).to.equal("Proposal does not exist");
    });
  });
});