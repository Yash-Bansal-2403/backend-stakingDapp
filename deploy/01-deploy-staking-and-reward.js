const { network, ethers } = require("hardhat"); //ethers from hardhat
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config"); //just data written not code and import every here,,so that we can change only there any fix data, like..see that File
require("dotenv").config();
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let erc20ATMock, erc20ATAddress;

  if (chainId == 31337) {
    erc20ATMock = await ethers.getContract("AlphaToken");
    erc20ATAddress = erc20ATMock.address;
  } else {
    erc20ATAddress = networkConfig[chainId]["erc20AT"];
    //accessing data from  objects inside helper-hardhat-config.js
  }
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;
  //so that surely verified on etherscan until we will wait

  log("----------------------------------------------------");
  const arguments = [erc20ATAddress]; //args address based on ChainId
  const stakingAndReward = await deploy("StakingAndReward", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(stakingAndReward.address, arguments);
  }

  const networkName = network.name == "hardhat" ? "localhost" : network.name;
  log(
    `Contract deployed to Network :${networkName} and Address: ${stakingAndReward.address}`
  );
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "staking"];
