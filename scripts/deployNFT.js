const { getContractAddress } = require("@ethersproject/address");
const { waffle, ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    let NFT = await ethers.getContractFactory("NFT");
    let nftContract = await NFT.deploy();

    const mintFor = "0xB7312e0232bFe9FdF41726b3DF896edC6F442614";
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    await nftContract.mint(mintFor);
    console.log("NFT address:", nftContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });