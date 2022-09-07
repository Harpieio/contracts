// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { waffle, ethers } = require("hardhat");
const { getContractAddress } = require("@ethersproject/address");
const NULLADDRESS = "0x0000000000000000000000000000000000000000";
const EXACTPAYABLE = { value: 100 };
const OVERFLOWPAYABLE = { value: 101 };
const UNDERFLOWPAYABLE = { value: 99 };
const ZERO = { value: 0 };

describe("Transfer contract", function () {
  let NFT1;
  let NFT2;
  let Transfer;
  let Vault;
  let nftContract1;
  let nftContract2;
  let tokenContract1;
  let tokenContract2;
  let tokenContract3;
  let tokenContract4;
  let tokenContract5;
  let tokenContract6;
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
    Token3 = await ethers.getContractFactory("Fungible");
    Token4 = await ethers.getContractFactory("Fungible");
    Token5 = await ethers.getContractFactory("Fungible");
    Token6 = await ethers.getContractFactory("Fungible");
    Transfer = await ethers.getContractFactory("Transfer");
    Vault = await ethers.getContractFactory("Vault");
    [user, serverSigner, transferSignerSetter, transferSigner, feeController, feeController2, addr1, addr2, recipientAddr, ...addrs] = await ethers.getSigners();

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

    transferContract = await Transfer.deploy(vaultAddress, transferSignerSetter.address);
    vaultContract = await Vault.deploy(transferAddress, serverSigner.address, feeController.address);
    nftContract1 = await NFT1.deploy();
    nftContract2 = await NFT2.deploy();
    tokenContract1 = await Token1.deploy();
    tokenContract2 = await Token2.deploy();
    tokenContract3 = await Token3.deploy();
    tokenContract4 = await Token4.deploy();
    tokenContract5 = await Token5.deploy();
    tokenContract6 = await Token6.deploy();

    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract1.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract2.mint(user.address);
    await nftContract2.mint(user.address);
  });

  describe("Deployment", async () => {
    it("User address should approve Transfer address for NFTs", async () => {
      await nftContract1.setApprovalForAll(transferContract.address, true);
      expect(await nftContract1.isApprovedForAll(user.address, transferContract.address)).to.equal(true);
      await nftContract2.setApprovalForAll(transferContract.address, true);
      expect(await nftContract2.isApprovedForAll(user.address, transferContract.address)).to.equal(true);
    })
    it("User address should approve Transfer address for ERC20s", async () => {
      await tokenContract1.approve(transferContract.address, ethers.utils.parseEther("9999999"));
      await tokenContract2.approve(transferContract.address, ethers.utils.parseEther("9999999"));
      await tokenContract3.approve(transferContract.address, ethers.utils.parseEther("9999999"));
      await tokenContract4.approve(transferContract.address, ethers.utils.parseEther("9999999"));
    })
    it("Initialize transferSigner", async () => {
      await transferContract.connect(transferSignerSetter).setTransferEOA(transferSigner.address, true);
    })
  })

  describe("Vault: Logging NFTs (batch)", () => {
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
    
    it("Should log multiple incoming NFTs (batch)", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 5)).to.equal(false);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 6)).to.equal(false);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 7)).to.equal(false);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 8)).to.equal(false);

      await transferContract.connect(transferSigner).batchTransferERC721(
        [
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 5, erc721Fee: 10 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 6, erc721Fee: 20 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 7, erc721Fee: 30 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 8, erc721Fee: 40 },
        ]
      )

      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 5)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 6)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 7)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 8)).to.equal(true);
    })

    it("Should not revert even if some balances == 0 (batch)", async () => {
      await transferContract.connect(transferSigner).batchTransferERC721(
        [
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 3, erc721Fee: 10 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 4, erc721Fee: 20 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 5, erc721Fee: 20 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 5, erc721Fee: 40 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 6, erc721Fee: 40 },
          { ownerAddress: user.address, erc721Address: nftContract1.address, erc721Id: 7, erc721Fee: 50 },
        ]
      )

      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 4)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 5)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 6)).to.equal(true);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 7)).to.equal(true);
    })
  })

  describe("Vault: Logging ERC20s", async () => {
    it("Should successfully log an incoming ERC20", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("0"));
      await transferContract.connect(transferSigner).transferERC20(user.address, tokenContract1.address, 100);
      expect(await tokenContract1.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("1000"));
    })

    it("Should not log if the transfer fails", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("0"));
      await expect(transferContract.connect(transferSigner).transferERC20(user.address, transferContract, 100)).to.be.reverted;
      expect(await tokenContract2.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("0"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("0"));
    })


    it("Should log multiple incoming ERC20s (batch)", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract3.address)).to.equal(ethers.utils.parseEther("0"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract4.address)).to.equal(ethers.utils.parseEther("0"));

      await transferContract.connect(transferSigner).batchTransferERC20(
        [
          { ownerAddress: user.address, erc20Address: tokenContract3.address, erc20Fee: 30 },
          { ownerAddress: user.address, erc20Address: tokenContract4.address, erc20Fee: 40 },
        ]
      )

      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract3.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract4.address)).to.equal(ethers.utils.parseEther("1000"));
    })

    it("Should log multiple incoming ERC20s even if some balances == 0 (batch)", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("0"));

      await transferContract.connect(transferSigner).batchTransferERC20(
        [
          { ownerAddress: user.address, erc20Address: tokenContract1.address, erc20Fee: 10 },
          { ownerAddress: user.address, erc20Address: tokenContract2.address, erc20Fee: 20 },
          { ownerAddress: user.address, erc20Address: tokenContract3.address, erc20Fee: 30 },
          { ownerAddress: user.address, erc20Address: tokenContract4.address, erc20Fee: 40 },
        ]
      )

      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("1000"));
    })
  })
});