const { getContractAddress } = require("@ethersproject/address");
const { waffle, ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    let Flashbot = await ethers.getContractFactory("Flashbot");
    let Vault = await ethers.getContractFactory("Vault");
    // Determine upcoming contract addresses
    const txCount = await deployer.getTransactionCount();
    const flashbotAddress = getContractAddress({
      from: deployer.address,
      nonce: txCount
    })
    const vaultAddress = getContractAddress({
      from: deployer.address,
      nonce: txCount + 1
    })

    let flashbotContract = await Flashbot.deploy(vaultAddress, "0xeE5437fBc370aBf64BB8E855824B01485C497F49");
    let vaultContract = await Vault.deploy(flashbotAddress, "0x54CBE75825d6f937004e37dc863258C4f4AdDc58", "0x9ae1fE63a9150608DfBb644fdf144595244619C3");
  
    console.log("Flashbot address:", flashbotContract.address);
    console.log("Vault address:", vaultContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });