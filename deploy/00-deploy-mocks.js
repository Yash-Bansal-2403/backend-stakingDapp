const { network } = require("hardhat");

//Or we can write it 5e8 , we did it and it was also working
const MAX_TOKEN_SUPPLY = "500000000"; //It is cap for max.supply token have,not initial ,initial is 5 Lacs and specified in contract, we were sending less from here and minting there more that's why many error coming gasLimit,invalit gas,less gas ....here was the mistake and took 2hrs to find
const REWARD = "20";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts(); //In Local dev chain,hardhat auto gives it first account,these accounts are not specified in config file
  const chainId = network.config.chainId;
  // If we are on a local development network, we need to deploy mocks! no need to deloy mocks on real testnet
  if (chainId == 31337) {
    log("Local network detected! Deploying mocks...");
    await deploy("NeutronToken", {
      from: deployer,
      log: true,
      args: [MAX_TOKEN_SUPPLY, REWARD],
    });
    //here block-confirmations not specified becoz default is 1, and this sufficient here in local-chain deploy faster and update only using await,but in real testnets we need to specify block-confirmations also so that it can surely deployed  and surely verified on etherscan until we will wait and give instance of that deployed contract then move down.

    log("Mocks Deployed!");
    log("----------------------------------------------------------");
    log("You are deploying to a local network, you'll need a local network running to interact ie. hardhat node");
    log(
      "Please run `npx/yarn hardhat console --network localhost` to interact with the deployed smart contracts from terminal directly,it will open up the hardhat console! and add this network in metamask and reset whenever we run localhost again"
    );
    log("----------------------------------------------------------");
  }
};
module.exports.tags = ["all", "mocks"];
