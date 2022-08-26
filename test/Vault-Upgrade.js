// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { waffle, ethers } = require("hardhat");
const { getContractAddress } = require("@ethersproject/address");
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const EXACT_PAYABLE = {value: 100};
const OVERFLOW_PAYABLE = {value: 101};
const UNDERFLOW_PAYABLE = {value: 99};
const ZERO = {value: 0};

describe("Transfer contract", function () {
  let NFT1;
  let NFT2;
  let Transfer;
  let Vault;
  let nftContract1;
  let nftContract2;
  let tokenContract1;
  let tokenContract2;
  let transferContract;
  let vaultContract;
  let user;
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
    Transfer = await ethers.getContractFactory("Transfer");
    Vault = await ethers.getContractFactory("Vault");
    [user, serverSigner, transferSigner, feeController, feeController2, addr1, addr2, recipientAddr, ...addrs] = await ethers.getSigners();

    // Determine upcoming contract addresses
    const txCount = await user.getTransactionCount();
    const transferAddress = getContractAddress({
      from: user.address,
      nonce: txCount
    })

    const vaultAddress = getContractAddress({
      from: user.address,
      nonce: txCount + 1
    })

    transferContract = await Transfer.deploy(vaultAddress, transferSigner.address);
    vaultContract = await Vault.deploy(transferAddress, serverSigner.address, feeController.address);
    nftContract1 = await NFT1.deploy();
    nftContract2 = await NFT2.deploy();
    tokenContract1 = await Token1.deploy();
    tokenContract2 = await Token2.deploy();
    
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
  });
  
  describe("Deployment", async () => {
    it("User address should approve Transfer address for NFTs", async () => {
      await nftContract1.setApprovalForAll(transferContract.address, true);
      expect(await nftContract1.isApprovedForAll(user.address, transferContract.address)).to.equal(true);
      await nftContract2.setApprovalForAll(transferContract.address, true);
      expect(await nftContract2.isApprovedForAll(user.address, transferContract.address)).to.equal(true);
    })

    it("User should have 1000 tokens of each", async () => {
      expect(await tokenContract1.balanceOf(user.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await tokenContract2.balanceOf(user.address)).to.equal(ethers.utils.parseEther("1000"));
    })

    it("User address should approve Transfer address for ERC20s", async () => {
      await tokenContract1.approve(transferContract.address, ethers.utils.parseEther("9999999"));
      await tokenContract2.approve(transferContract.address, ethers.utils.parseEther("9999999"));
      expect(await tokenContract1.allowance(user.address, transferContract.address)).to.equal(ethers.utils.parseEther("9999999"));
      expect(await tokenContract2.allowance(user.address, transferContract.address)).to.equal(ethers.utils.parseEther("9999999"));
    })
  })

  describe("Vault: Logging NFTs", () => {
    it("Should successfully log an incoming NFT", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(false);
      await transferContract.connect(transferSigner).transferERC721(user.address, nftContract1.address, 1, 100);
      expect(await nftContract1.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log another NFT address", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(false);
      await transferContract.connect(transferSigner).transferERC721(user.address, nftContract2.address, 1, 100);
      expect(await nftContract2.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(true);
      // Previous log should be true as well
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log multiple tokenIds inside a single NFT", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(false);
      await transferContract.connect(transferSigner).transferERC721(user.address, nftContract1.address, 2, 100);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(true);

      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(false);
      await transferContract.connect(transferSigner).transferERC721(user.address, nftContract1.address, 3, 100);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(true);
    })
  })

  describe("Vault: Logging ERC20s", async () => {
    it("Should successfully log an incoming ERC20", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("0"));
      await transferContract.connect(transferSigner).transferERC20(user.address, tokenContract1.address, 100);
      expect(await tokenContract1.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("1000"));
    })
  })

  describe("Vault: Registration", async () => {

  })

  describe("Vault: Withdrawing ERC721s", async () => {

  })

  describe("Vault: Reducing, withdrawing, and changing feeController", async () => {

  })
});