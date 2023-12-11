const { getContractAddress } = require("@ethersproject/address");
const { waffle, ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    let PermitToken = await ethers.getContractFactory("PermitToken");
    let permitContract = await PermitToken.deploy(ethers.utils.parseEther("1000000000000"));

    const mintFor = "0xB7312e0232bFe9FdF41726b3DF896edC6F442614";
    await permitContract.mint(mintFor, ethers.utils.parseEther("100000000"));

    console.log("Token address:", permitContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });