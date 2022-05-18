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
  let recipientAddr;
  let addrs;
  
  // These tests all run synchronously: tests will not repeat themselves
  before(async function () {
    NFT = await ethers.getContractFactory("NFT");
    Flashbot = await ethers.getContractFactory("Flashbot");
    Vault = await ethers.getContractFactory("Vault");
    [user, owner, addr1, addr2, recipientAddr, ...addrs] = await ethers.getSigners();

    vaultContract = await Vault.deploy();
    nftContract = await NFT.deploy();
    flashbotContract = await Flashbot.deploy(vaultContract.address);
    
    await nftContract.mint(user.address)
  });
  
  describe("Token: Deployment", () => {
    it("Should have a single mint under user address", async () => {
      const userBalance = await nftContract.balanceOf(user.address);
      // Below line does nothing but is a benchmark for safeTransferFrom gas
      await nftContract["safeTransferFrom(address,address,uint256)"](user.address, user.address, 1);
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
      await flashbotContract.connect(owner).transferERC721(user.address, nftContract.address, 1);
      expect(await nftContract.ownerOf(1)).to.equal(vaultContract.address);
    })
  })
  
});