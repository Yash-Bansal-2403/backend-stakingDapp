const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
  },
  5: {
    name: "goerli",

    erc20NTRO: "0x02D3d30bdEf23F087dE497645176C2C9171951Db",
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
};

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6; //so that surely verified on etherscan until we will wait
const frontEndContractsFile =
  "../staking-frontend-next/constants/contractAddresses.json";
const frontEndAbiFile = "../staking-frontend-next/constants/abi.json";
const frontEndAbiERC20MockFile =
  "../staking-frontend-next/constants/abiERC20Mock.json";
const frontEndERC20ContractAddressesFile =
  "../staking-frontend-next/constants/erc20ContractAddresses.json";

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  frontEndContractsFile,
  frontEndAbiFile,
  frontEndAbiERC20MockFile,
  frontEndERC20ContractAddressesFile,
};
