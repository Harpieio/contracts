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
  let user;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  
  // These tests all run synchronously: tests will not repeat themselves
  before(async function () {
    NFT = await ethers.getContractFactory("NFT");
    Flashbot = await ethers.getContractFactory("Flashbot");
    Vault = await ethers.getContractFactory("Vault");
    [user, owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    vaultContract = await Vault.deploy();
    nftContract = await NFT.deploy();
    flashbotContract = await Flashbot.deploy(vaultContract.address);
    
    await nftContract.mint(user.address)
  });
  
  describe("Token: Deployment", () => {
    it("Should have a single mint under user address", async () => {
      const userBalance = await nftContract.balanceOf(user.address);
      expect(userBalance).to.equal(1);
    })
    
    it("User address should approve Flashbot address", async () => {
      await nftContract.setApprovalForAll(flashbotContract.address, true);
      expect(await nftContract.isApprovedForAll(user.address, flashbotContract.address)).to.equal(true);
    })
  })

  describe("Flashbot: Ownership", () => {
    it("Ownership should switch from default to `owner` address", async () => {
      expect(await flashbotContract.owner()).to.equal(user.address);
      await flashbotContract.transferOwnership(owner.address)
      expect(await flashbotContract.owner()).to.equal(owner.address);
    })
  })
  
  describe("Flashbot: NFT Transfers", () => {
    it("Owner should transfer tokenId 1 to vault contract", async () => {
      expect(await nftContract.ownerOf(1)).to.equal(user.address);
      await flashbotContract.connect(owner).transferNFT(nftContract.address, user.address, 1);
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
      await flashbotContract.connect(addr1).depositGasOnBehalfOf(user.address, overrides);
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