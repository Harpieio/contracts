// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber } = require("ethers");
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
      expect(userBalance).to.equal(1);
    })
    
    it("User address should approve Flashbot address", async () => {
      await nftContract.setApprovalForAll(flashbotContract.address, true);
      expect(await nftContract.isApprovedForAll(user.address, flashbotContract.address)).to.equal(true);
    })
  })

  describe("Vault: Logging", () => {
    it("Should successfully log an incoming NFT", async () => {
      // Use deep equality for arrays
      expect(await vaultContract.getERC721Balance(user.address, nftContract.address)).to.deep.equal([]);
      await vaultContract.logIncomingERC721(user.address, nftContract.address, 1);
      expect(await vaultContract.getERC721Balance(user.address, nftContract.address)).to.deep.equal([new BigNumber.from(1)]);
    })
  })

});