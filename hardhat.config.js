require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.13",
  networks: {
    ropsten: {
      url: process.env.INFURA,
      accounts: [`${ROPSTEN_PRIVATE_KEY}`, process.env.MULE_PRIVATE_KEY]
    },
    goerli: {
      url: process.env.GOERLI,
      accounts: [`${ROPSTEN_PRIVATE_KEY}`, process.env.MULE_PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN
  }
};
