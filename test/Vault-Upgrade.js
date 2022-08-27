// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber, providers } = require("ethers");
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
  })
  describe("Vault: Registration", async () => {
    const getExp = async (offset) => {
        const provider = waffle.provider;
        const blockNum = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNum);
        const exp = block.timestamp + offset;
        return exp
    }
    
    it("Should successfully allow a user to set a recipientAddress", async () => {
        await vaultContract.setupRecipientAddress(addr1.address);
        expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(addr1.address);
      })
  
    it("Should revert when a user uses setupRecipientAddress a second time", async () => {
        await expect(vaultContract.setupRecipientAddress(addr2.address)).to.be.reverted;
    })

    it("Should successfully allow a user to change a recipientAddress", async () => {
      const exp = await getExp(15*60);
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address', 'uint256'], [user.address, recipientAddr.address, exp]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);
      await vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address, exp)

      expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(recipientAddr.address);
    })

    it("Should revert when exp <= block.timestamp", async () => {
      const exp = await getExp(-1);
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address', 'uint256'], [user.address, recipientAddr.address, exp]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);
      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address, exp)).to.be.reverted;
    })

    it("Should revert when reusing an exp", async () => {
      const exp = await getExp(15*60);
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address', 'uint256'], [user.address, recipientAddr.address, exp]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);
      await vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address, exp)

      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address, exp)).to.be.reverted;
    })
    
  })
})