// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { waffle, ethers } = require("hardhat");
const { getContractAddress } = require("@ethersproject/address");
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";


describe("Flashbot contract", () => {
  let user;
  let wl;
  let nonWl;
  let fauAddress;
  let fauAbi;
  let nftAddress;
  let nftAbi;
  let fauContract;
  let nftContract;
  before(async () => {
    [user] = await ethers.getSigners();
    wl = "0xeE5437fBc370aBf64BB8E855824B01485C497F49";
    nonWl = "0x54CBE75825d6f937004e37dc863258C4f4AdDc58";
    fauAddress = "0xFab46E002BbF0b4509813474841E0716E6730136";
    fauAbi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "DECIMALS", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "INITIAL_SUPPLY", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "mint", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "value", "type": "uint256" }], "name": "burn", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "burnFrom", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "account", "type": "address" }], "name": "addMinter", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "renounceMinter", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "isMinter", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "payable": false, "stateMutability": "nonpayable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "account", "type": "address" }], "name": "MinterAdded", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "account", "type": "address" }], "name": "MinterRemoved", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }]
    nftAddress = "0xAfCd788f9B8242250cb147D0200399889c1149F8";
    nftAbi = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "getApproved", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" }], "name": "isApprovedForAll", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "mint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" }], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

    fauContract = new ethers.Contract(fauAddress, fauAbi, user);
    nftContract = new ethers.Contract(nftAddress, nftAbi, user);
  })


  describe("ERC20 functions", async () => {
    // it("Approve", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })
    it("Transfer", async () => {
      expect(await fauContract.transfer(wl, ethers.utils.parseEther("1.0")))
      await expect(fauContract.transfer(nonWl, ethers.utils.parseEther("1.0"))).to.be.reverted;
    })
    // it("Increase Allowance", async () => {
    //   expect(await fauContract.increaseAllowance(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.increaseAllowance(nonWl, ethers.utils.parseEther("1.0")))
    // })
  })

  describe("ERC721 functions", async () => {
    it("Approve", async () => {
      expect(await fauContract.approve(wl, 5))
      expect(await fauContract.approve(nonWl, 5))
    })

    // it("SetApprovalForAll", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })

    // it("TransferFrom", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })

    // it("SafeTransferFrom1", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })

    // it("SafeTransferFrom2", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })

    // it("SetApprovalForAll with bool as false", async () => {
    //   expect(await fauContract.approve(wl, ethers.utils.parseEther("1.0")))
    //   expect(await fauContract.approve(nonWl, ethers.utils.parseEther("1.0")))
    // })
  })

});