const hre = require("hardhat");

async function main() {
  console.log("Deploying SecureDAO Voting contract...");

  const SecureDAOVoting = await hre.ethers.getContractFactory("SecureDAOVoting");
  const daoVoting = await SecureDAOVoting.deploy();

  await daoVoting.waitForDeployment();
  const contractAddress = await daoVoting.getAddress();

  console.log("SecureDAO Voting contract deployed to:", contractAddress);

  // Set some initial voter weights for testing
  const [deployer, addr1, addr2] = await hre.ethers.getSigners();
  
  console.log("Setting voter weights...");
  await daoVoting.setVoterWeight(deployer.address, 1000);
  await daoVoting.setVoterWeight(addr1.address, 500);
  await daoVoting.setVoterWeight(addr2.address, 300);

  console.log("Deployment completed!");
  console.log("Deployer address:", deployer.address);
  console.log("Contract address:", contractAddress);
  console.log("Expected address: 0x08C09eC71Fe5CF02ce7E9bcfCBC406e052EA0248");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });