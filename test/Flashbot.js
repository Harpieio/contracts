// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { waffle, ethers } = require("hardhat");

describe("Flashbot contract", function () {
  
  let NFT;
  let Flashbot;
  let Vault;
  let nftContract;
  let flashbotContract;
  let vaultContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  
  // These tests all run synchronously: tests will not repeat themselves
  before(async function () {
    NFT = await ethers.getContractFactory("NFT");
    Flashbot = await ethers.getContractFactory("Flashbot");
    Vault = await ethers.getContractFactory("Vault");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    vaultContract = await Vault.deploy();
    nftContract = await NFT.deploy();
    flashbotContract = await Flashbot.deploy(vaultContract.address);
    
    await nftContract.mint(owner.address)
  });
  
  describe("Token: Deployment", () => {
    it("Should have a single mint under owner address", async () => {
      const ownerBalance = await nftContract.balanceOf(owner.address);
      
      expect(ownerBalance).to.equal(1);
    })
    
    it("Owner address should approve Flashbot address", async () => {
      await nftContract.setApprovalForAll(flashbotContract.address, true);
      expect(await nftContract.isApprovedForAll(owner.address, flashbotContract.address)).to.equal(true);
    })
  })
  
  describe("Flashbot: NFT Transfers", () => {
    it("Flashbot should transfer tokenId 1 to vault contract", async () => {
      expect(await nftContract.ownerOf(1)).to.equal(owner.address);
      await flashbotContract.transferNFT(nftContract.address, owner.address, 1);
      expect(await nftContract.ownerOf(1)).to.equal(vaultContract.address);
    })
  })
  
  describe("Flashbot: Gas", () => {
    const provider = waffle.provider;
    let overrides = {value: ethers.utils.parseEther("1.0")};

    it("User should be able to transfer ETH into the bot", async () => {
      await flashbotContract.depositGas(overrides);
      expect(await provider.getBalance(flashbotContract.address)).to.equal(ethers.utils.parseEther("1.0"));
      expect(await flashbotContract.getGasBalance()).to.equal(ethers.utils.parseEther("1.0"));
    })

    it("Another user should be able to transfer ETH on behalf of another", async () => {
      await flashbotContract.connect(addr1).depositGasOnBehalfOf(owner.address, overrides);
      expect(await provider.getBalance(flashbotContract.address)).to.equal(ethers.utils.parseEther("2.0"));
      expect(await flashbotContract.getGasBalance()).to.equal(ethers.utils.parseEther("2.0"));
    })

    it("User shouldn't be able to withdraw more than their allowance", async () => {
      await expect(flashbotContract.withdrawGas(ethers.utils.parseEther("2.01"))).to.be.reverted;
      expect(await provider.getBalance(flashbotContract.address)).to.equal(ethers.utils.parseEther("2.00"));
      expect(await flashbotContract.getGasBalance()).to.equal(ethers.utils.parseEther("2.00"));
    })

    it("User should be able to withdraw ETH from the bot", async () => {
      await flashbotContract.withdrawGas(ethers.utils.parseEther("0.6"));
      expect(await provider.getBalance(flashbotContract.address)).to.equal(ethers.utils.parseEther("1.4"));
      expect(await flashbotContract.getGasBalance()).to.equal(ethers.utils.parseEther("1.4"));
      // Remaining balance will be 0.4 ETH
    })
  })
});