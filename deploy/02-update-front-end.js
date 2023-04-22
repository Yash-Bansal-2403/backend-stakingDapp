const {
  frontEndContractsFile,
  frontEndAbiFile,
  frontEndERC20ContractAddressesFile,
  networkConfig,
} = require("../helper-hardhat-config");
const fs = require("fs");
const { network } = require("hardhat");

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Writing to front end...");
    await updateContractAddresses();
    await updateAbi();
    await updateERC20ContractAddresses();
    console.log("Front end written!");
  }
};

async function updateAbi() {
  const stakingAndReward = await ethers.getContract("StakingAndReward");
  fs.writeFileSync(
    frontEndAbiFile,
    stakingAndReward.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  const stakingAndReward = await ethers.getContract("StakingAndReward");
  const contractAd = stakingAndReward.address;
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, "utf8")
  );
  const chainId = network.config.chainId.toString();

  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId].includes(contractAd)) {
      contractAddresses[chainId].push(contractAd);
    } else {
      let len = contractAddresses[chainId].length; //checking length of array
      if (len > 1) {
        let i = contractAddresses[chainId].indexOf(contractAd);
        let temp = contractAddresses[chainId][i];
        contractAddresses[chainId][i] = contractAddresses[chainId][len - 1];
        contractAddresses[chainId][len - 1] = temp;
      }
    }
  } else {
    contractAddresses[chainId] = [contractAd];
  }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}

async function updateERC20ContractAddresses() {
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndERC20ContractAddressesFile, "utf8")
  );
  const chainId = network.config.chainId.toString();
  if (chainId === "31337") {
    const AlphaToken = await ethers.getContract("AlphaToken");
    if (chainId in contractAddresses) {
      if (!contractAddresses[chainId].includes(AlphaToken.address)) {
        contractAddresses[chainId].push(AlphaToken.address);
      } else {
        let len = contractAddresses[chainId].length;
        if (len > 1) {
          let i = contractAddresses[chainId].indexOf(AlphaToken.address);
          let temp = contractAddresses[chainId][i];
          contractAddresses[chainId][i] = contractAddresses[chainId][len - 1];
          contractAddresses[chainId][len - 1] = temp;
        }
      }
    } else {
      contractAddresses[chainId] = [AlphaToken.address];
    }
  } else {
    erc20ATAddress = networkConfig[chainId]["erc20AT"];
    if (chainId in contractAddresses) {
      if (!contractAddresses[chainId].includes(erc20ATAddress)) {
        contractAddresses[chainId].push(erc20ATAddress);
      }
    } else {
      contractAddresses[chainId] = [erc20ATAddress];
    }
  }
  fs.writeFileSync(
    frontEndERC20ContractAddressesFile,
    JSON.stringify(contractAddresses)
  );
}
module.exports.tags = ["all", "frontend"];
