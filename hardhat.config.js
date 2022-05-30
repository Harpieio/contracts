require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const ROPSTEN_PRIVATE_KEY = "";

module.exports = {
  solidity: "0.8.13",
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/ccb18660ce2a4cdfb4889d6130c5ad48`,
      accounts: [`${ROPSTEN_PRIVATE_KEY}`]
    }
  }
};
