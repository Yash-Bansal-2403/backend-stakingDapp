require("@nomicfoundation/hardhat-toolbox"); //isme hardhat etehrscan bhi h..gast reportr bhi h,docs m dekh lo kya kya h isme likh a h udhar
require("dotenv").config();
require("hardhat-deploy"); //this is hardhat-community plugin and also not comes in toolbox(see it on hardhat docs,what comes with it,many plugins patrick used doesn't come with it and some come with it.)

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || "Your etherscan API key";
const POLYGONSCAN_API_KEY =
  process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key";
const REPORT_GAS = process.env.REPORT_GAS || false;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      chainId: 31337,
      blockConfirmations: 1,
      // gasPrice: 130000000000,
    },

    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
    }, //goerli network config
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
    },
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      blockConfirmations: 6,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
      {
        version: "0.6.0", //for MockV3Aggregator
      },
    ],
  }, //using multiple solidity version
  etherscan: {
    apiKey: {
      goerli: ETHERSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
    },
  }, //setting up etherscan api

  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  }, //configuring hadhat-gas-reporter package
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      //for different chainIds we can specify what will be the default deployer account
      31337: 0, //on hardhat deployer account will be 2nd account
    },
    player: {
      default: 1,
    },
  }, //this property is used to name different accounts on our chainId
  mocha: {
    timeout: 500000,
  }, //configuring mocha
};
