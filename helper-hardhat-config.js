const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
  },

  11155111: {
    name: "sepolia",

    erc20AT: "address of Alpha token deployed on sepolia network",
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
  80001: {
    name: "mumbai",
    keepersUpdateInterval: "30",
    erc20AT: "0x0EB51D67B101e23c2eAa61618f550a0527197bdd",
  },
};

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6; //so that surely verified on etherscan until we will wait
const frontEndContractsFile =
  "../frontend-staking/constants/contractAddresses.json";
const frontEndAbiFile = "../frontend-staking/constants/abi.json";

const frontEndERC20ContractAddressesFile =
  "../frontend-staking/constants/erc20ContractAddresses.json";

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  frontEndContractsFile,
  frontEndAbiFile,
  frontEndERC20ContractAddressesFile,
};
