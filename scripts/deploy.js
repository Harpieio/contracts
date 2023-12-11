const { getContractAddress } = require("@ethersproject/address");
const { waffle, ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    let Transfer = await ethers.getContractFactory("Transfer");
    let Vault = await ethers.getContractFactory("Vault");
    // Determine upcoming contract addresses
    const txCount = await deployer.getTransactionCount();
    const transferAddress = getContractAddress({
      from: deployer.address,
      nonce: txCount
    })
    const vaultAddress = getContractAddress({
      from: deployer.address,
      nonce: txCount + 1
    })

    let transferContract = await Transfer.deploy(vaultAddress, "0x482C1f60C20244458846E5Ca19Bee60b811221C4");
    let vaultContract = await Vault.deploy(transferAddress, "0x0F68b96058346da4e8e2403a3A0F971897f98916", "0xADaaFb953E755967F100FfC6A8AF8B5Cb9E68FC8", "0xB0125C7d8bc586d8dCd2aDA7EDB98Dc8fe86fdd5");
  
    console.log("Transfer address:", transferContract.address);
    console.log("Vault address:", vaultContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });