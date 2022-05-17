// // We import Chai to use its asserting functions here.
// const { expect } = require("chai");
// describe("Vault contract", function () {

//   let NFT;
//   let Flashbot;
//   let nftContract;
//   let flashbotContract;
//   let owner;
//   let addr1;
//   let addr2;
//   let addrs;
  
//   // These tests all run synchronously: tests will not repeat themselves
//   before(async function () {
//     NFT = await ethers.getContractFactory("NFT");
//     Flashbot = await ethers.getContractFactory("Flashbot");
//     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

//     nftContract = await NFT.deploy();
//     flashbotContract = await Flashbot.deploy();
//     await nftContract.mint(owner.address)
//   });

//   describe("NFT Deployment", () => {
//       it("Should have a single mint under owner address", async () => {
//         const ownerBalance = await nftContract.balanceOf(owner.address);
          
//         expect(ownerBalance).to.equal(1);
//       })

//       it("Should be able to transfer NFTs to a smart contract", async () => {
//         await nftContract["safeTransferFrom(address,address,uint256)"](owner.address, flashbotContract.address, 1);

//         expect(await nftContract.ownerOf(1)).to.equal(flashbotContract.address);
//       })
//   })

//   describe("NFT Approvals and Transfers", () => {
//       it("Owner address should approve Flashbot address", async () => {
//         await nftContract.setApprovalForAll(flashbotContract.address, true);
//         expect(await nftContract.isApprovedForAll(owner.address, flashbotContract.address)).to.equal(true);
//       })

//       it("Flashbot should transfer tokenId 1 back to owner", async () => {
//         expect(await nftContract.ownerOf(1)).to.equal(flashbotContract.address);
//         await flashbotContract.transferNFT(nftContract.address, owner.address, 1);
//         expect(await nftContract.ownerOf(1)).to.equal(owner.address);
//       })
//   })

  
// });