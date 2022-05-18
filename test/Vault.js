// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { waffle, ethers } = require("hardhat");

describe("Flashbot contract", function () {
  
  let NFT1;
  let NFT2;
  let Flashbot;
  let Vault;
  let nftContract1;
  let nftContract2;
  let tokenContract1;
  let tokenContract2;
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
    NFT1 = await ethers.getContractFactory("NFT");
    NFT2 = await ethers.getContractFactory("NFT");
    Token1 = await ethers.getContractFactory("Fungible");
    Token2 = await ethers.getContractFactory("Fungible");
    Flashbot = await ethers.getContractFactory("Flashbot");
    Vault = await ethers.getContractFactory("Vault");
    [user, owner, addr1, addr2, recipientAddr, ...addrs] = await ethers.getSigners();

    vaultContract = await Vault.deploy();
    nftContract1 = await NFT1.deploy();
    nftContract2 = await NFT2.deploy();
    tokenContract1 = await Token1.deploy();
    tokenContract2 = await Token2.deploy();
    flashbotContract = await Flashbot.deploy(vaultContract.address);
    
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
  });
  
  describe("Tokens: Deployment", () => {
    it("User address should approve Flashbot address for NFTs", async () => {
      await nftContract1.setApprovalForAll(flashbotContract.address, true);
      expect(await nftContract1.isApprovedForAll(user.address, flashbotContract.address)).to.equal(true);
      await nftContract2.setApprovalForAll(flashbotContract.address, true);
      expect(await nftContract2.isApprovedForAll(user.address, flashbotContract.address)).to.equal(true);
    })
    it("User should have 1000 tokens of each", async () => {
      expect(await tokenContract1.balanceOf(user.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await tokenContract2.balanceOf(user.address)).to.equal(ethers.utils.parseEther("1000"));
    })
    it("User address should approve Flashbot address for ERC20s", async () => {
      await tokenContract1.approve(flashbotContract.address, ethers.utils.parseEther("500"));
      await tokenContract2.approve(flashbotContract.address, ethers.utils.parseEther("9999999"));
      expect(await tokenContract1.allowance(user.address, flashbotContract.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await tokenContract2.allowance(user.address, flashbotContract.address)).to.equal(ethers.utils.parseEther("9999999"));
    })
  })

  describe("Vault: Logging NFTs", () => {
    it("Should successfully log an incoming NFT", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(false);
      await flashbotContract.transferERC721(user.address, nftContract1.address, 1);
      expect(await nftContract1.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log another NFT address", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(false);
      await flashbotContract.transferERC721(user.address, nftContract2.address, 1);
      expect(await nftContract2.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(true);
      // Previous log should be true as well
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log multiple tokenIds inside a single NFT", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(false);
      await flashbotContract.transferERC721(user.address, nftContract1.address, 2);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(true);

      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(false);
      await flashbotContract.transferERC721(user.address, nftContract1.address, 3);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(true);
    })
  })

  describe("Vault: Logging ERC20s", async () => {
    it("Should successfully log an incoming ERC20", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("0"));
      await flashbotContract.transferERC20(user.address, tokenContract1.address, ethers.utils.parseEther("500"));
      // expect(await tokenContract1.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("500"));
    })

    it("Should successfully log multiple incoming ERC20s", async () => {
      
    })
  })
});