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
    [user, serverSigner, flashbotSigner, feeController, feeController2, addr1, addr2, recipientAddr, ...addrs] = await ethers.getSigners();

    // Determine upcoming contract addresses
    const txCount = await user.getTransactionCount();
    const flashbotAddress = getContractAddress({
      from: user.address,
      nonce: txCount
    })

    const vaultAddress = getContractAddress({
      from: user.address,
      nonce: txCount + 1
    })

    flashbotContract = await Flashbot.deploy(vaultAddress, flashbotSigner.address);
    vaultContract = await Vault.deploy(flashbotAddress, serverSigner.address, feeController.address);
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
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract1.address, 1, 100);
      expect(await nftContract1.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log another NFT address", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(false);
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract2.address, 1, 100);
      expect(await nftContract2.ownerOf(1)).to.equal(vaultContract.address);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract2.address, 1)).to.equal(true);
      // Previous log should be true as well
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 1)).to.equal(true);
    })

    it("Should successfully log multiple tokenIds inside a single NFT", async () => {
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(false);
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract1.address, 2, 100);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 2)).to.equal(true);

      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(false);
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract1.address, 3, 100);
      expect(await vaultContract.canWithdrawERC721(user.address, nftContract1.address, 3)).to.equal(true);
    })
  })

  describe("Vault: Logging ERC20s", async () => {
    it("Should successfully log an incoming ERC20", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("0"));
      await flashbotContract.connect(flashbotSigner).transferERC20(user.address, tokenContract1.address, ethers.utils.parseEther("500"), 100);
      expect(await tokenContract1.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("500"));
    })

    it("Should successfully log multiple incoming ERC20s", async () => {
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("0"));
      await flashbotContract.connect(flashbotSigner).transferERC20(user.address, tokenContract2.address, ethers.utils.parseEther("1000"), 100);
      expect(await tokenContract2.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(ethers.utils.parseEther("1000"));

      // Previous should hold true as well
      expect(await tokenContract1.balanceOf(vaultContract.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(ethers.utils.parseEther("500"));
    })
  })

  describe("Vault: Registration", async () => {
    it("Should revert ERC721s without allowance", async () => {
      expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(NULL_ADDRESS);
      await expect(vaultContract.withdrawERC721(user.address, nftContract1.address, 1, EXACT_PAYABLE)).to.be.reverted;
    })

    it("Should revert ERC20s without allowance", async () => {
      expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(NULL_ADDRESS);
      await expect(vaultContract.withdrawERC20(user.address, tokenContract1.address, ethers.utils.parseEther("500"), EXACT_PAYABLE)).to.be.reverted;
    })

    it("Should successfully allow a user to set a recipientAddress", async () => {
      await vaultContract.setupRecipientAddress(addr1.address);
      expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(addr1.address);
    })

    it("Should revert when a user uses setupRecipientAddress a second time", async () => {
      await expect(vaultContract.setupRecipientAddress(addr2.address)).to.be.reverted;
    })

    it("Should successfully allow a user to change a recipientAddress", async () => {
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address'], [user.address, recipientAddr.address]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);
      await vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address)

      expect(await vaultContract.viewRecipientAddress(user.address)).to.equal(recipientAddr.address);
    })

    it("Should revert when a changeRecipientAddress is called without a signature from serverSigner", async () => {
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address'], [user.address, recipientAddr.address]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await flashbotSigner.signMessage(messageHashBinary);

      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address)).to.be.reverted;
    })

    it("Should revert when a changeRecipientAddress is called with incorrect user address", async () => {
      const messageHash = ethers.utils.solidityKeccak256(['address', 'address'], [addr1.address, recipientAddr.address]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);

      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address)).to.be.reverted;
    })

    it("Should revert when a changeRecipientAddress is called with invalid newRecipient address", async () => {
      const messageHash = ethers.utils.solidityKeccak256(['address', 'string'], [addr1.address, "0x0238710237192837"]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);

      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address)).to.be.reverted;
    })

    it("Should revert when a changeRecipientAddress is called with a nonsensical signature", async () => {
      const messageHash = ethers.utils.solidityKeccak256(['string'], ["0x02387102371928asdfsdfss37"]);
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await serverSigner.signMessage(messageHashBinary);

      await expect(vaultContract.changeRecipientAddress(messageHashBinary, signature, recipientAddr.address)).to.be.reverted;
    })
  })

  describe("Vault: Withdrawing ERC721s", async () => {
    it("Should throw when a user puts in a payable value less than the fee", async () => {
      await expect(vaultContract.connect(recipientAddr).withdrawERC721(user.address, nftContract1.address, 1, UNDERFLOW_PAYABLE)).to.be.reverted;
    })

    it("Should allow a user to withdraw a single NFT after setting recipientAddress", async () => {
      expect(await nftContract1.ownerOf(1)).to.equal(vaultContract.address);
      await vaultContract.connect(recipientAddr).withdrawERC721(user.address, nftContract1.address, 1, EXACT_PAYABLE);
      expect(await nftContract1.ownerOf(1)).to.equal(recipientAddr.address);
    })

    it("Should allow a user to withdraw multiple NFTs after setting recipient address while paying higher than the payable", async () => {
      await vaultContract.connect(recipientAddr).withdrawERC721(user.address, nftContract1.address, 2, OVERFLOW_PAYABLE);
      expect(await nftContract1.ownerOf(2)).to.equal(recipientAddr.address);

      await vaultContract.connect(recipientAddr).withdrawERC721(user.address, nftContract1.address, 3, OVERFLOW_PAYABLE);
      expect(await nftContract1.ownerOf(3)).to.equal(recipientAddr.address);
    })

    it("Should allow a user to withdraw another NFT ID after setting recipient address", async () => {
      await vaultContract.connect(recipientAddr).withdrawERC721(user.address, nftContract2.address, 1, EXACT_PAYABLE);
      expect(await nftContract2.ownerOf(1)).to.equal(recipientAddr.address);
    })
  })

  describe("Vault: Withdrawing ERC20s", async () => {
    // Before execution, the vault has nft1 ids 1,2,3 and nft2 id 1
    it("Should throw when a user puts in a payable value lower than the fee", async () => {
      await expect(vaultContract.connect(recipientAddr).withdrawERC20(user.address, tokenContract1.address, UNDERFLOW_PAYABLE)).to.be.reverted;
    })

    it("Should successfully allow a user to withdraw a single token type after setting recipientAddress", async () => {
      expect(await tokenContract1.balanceOf(recipientAddr.address)).to.equal(ethers.utils.parseEther("0"));
      await vaultContract.connect(recipientAddr).withdrawERC20(user.address, tokenContract1.address, EXACT_PAYABLE);
      expect(await tokenContract1.balanceOf(recipientAddr.address)).to.equal(ethers.utils.parseEther("500"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract1.address)).to.equal(0);
    })

    it("Should successfully allow a user to withdraw the rest of the token types with overflow value", async () => {
      expect(await tokenContract2.balanceOf(recipientAddr.address)).to.equal(ethers.utils.parseEther("0"));
      await vaultContract.connect(recipientAddr).withdrawERC20(user.address, tokenContract2.address, OVERFLOW_PAYABLE);
      expect(await tokenContract2.balanceOf(recipientAddr.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await vaultContract.canWithdrawERC20(user.address, tokenContract2.address)).to.equal(0);
    })
  })

  describe("Vault: Reducing, withdrawing, and changing feeController", async () => {
    it("Initial setup", async () => {
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract1.address, 4, 100);
      await flashbotContract.connect(flashbotSigner).transferERC721(user.address, nftContract2.address, 4, 100);
      await tokenContract1.approve(flashbotContract.address, ethers.utils.parseUnits("500"));
      await flashbotContract.connect(flashbotSigner).transferERC20(user.address, tokenContract1.address, ethers.utils.parseUnits("500"), 100);
    })

    it("Should throw when another account attempts to use admin functions", async () => {
      await expect(vaultContract.connect(addr1).reduceERC20Fee(user.address, nftContract2.address, 100)).to.be.reverted;
      await expect(vaultContract.connect(addr1).reduceERC721Fee(user.address, nftContract2.address, 4, 100)).to.be.reverted;
      await expect(vaultContract.connect(addr1).withdrawPayments(100)).to.be.reverted;
      await expect(vaultContract.connect(addr1).withdrawPayments(100)).to.be.reverted;
    })

    it("Should throw when reducing fee beyond current fee", async () => {
      await expect(vaultContract.connect(feeController).reduceERC20Fee(user.address, tokenContract1.address, 101)).to.be.reverted;
      await expect(vaultContract.connect(feeController).reduceERC721Fee(user.address, nftContract2.address, 4, 101)).to.be.reverted;
    })

    it("Should be able to reduce fee for ERC20s", async () => {
      expect(await vaultContract.erc20Fee(user.address, tokenContract1.address)).to.equal(100);
      await vaultContract.connect(feeController).reduceERC20Fee(user.address, tokenContract1.address, 100);
      expect(await vaultContract.erc20Fee(user.address, tokenContract1.address)).to.equal(0);
    })

    it("Should be able to reduce fee for NFTs", async () => {
      expect(await vaultContract.erc721Fee(user.address, nftContract1.address, 4)).to.equal(100);
      await vaultContract.connect(feeController).reduceERC721Fee(user.address, nftContract1.address, 4, 100);
      expect(await vaultContract.erc721Fee(user.address, nftContract1.address, 4)).to.equal(0);
    })

    it("Should be able to change controller", async () => {
      await vaultContract.connect(feeController).changeFeeController(feeController2.address);
      await expect(vaultContract.connect(feeController).reduceERC721Fee(user.address, nftContract2.address, 4, 100)).to.be.reverted;

      expect(await vaultContract.erc721Fee(user.address, nftContract2.address, 4)).to.equal(100);
      await vaultContract.connect(feeController2).reduceERC721Fee(user.address, nftContract2.address, 4, 100);
      expect(await vaultContract.erc721Fee(user.address, nftContract2.address, 4)).to.equal(0);
    })

    it("Should be able to withdraw fee balances", async () => {
      const provider = waffle.provider;
      const vaultBalance = await provider.getBalance(vaultContract.address);
      
      await vaultContract.connect(feeController2).withdrawPayments(vaultBalance);
      expect(await provider.getBalance(vaultContract.address)).to.equal(0);
    })
  })
});