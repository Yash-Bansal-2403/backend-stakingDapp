const {
  frontEndContractsFile,
  frontEndAbiFile,
  frontEndERC20ContractAddressesFile,
  networkConfig,
} = require("../helper-hardhat-config");
const fs = require("fs");
const { network } = require("hardhat");

//from here we will update addressa and abi of smart contract from frontend
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
  ); //directly file m likh dala bina pde use kyuki hr bar latest wali abi hi usme rhegi aur koi nhi jbki address sare rhenge but hm generally use yse usme se latest wasla hi krenge
}

async function updateContractAddresses() {
  const stakingAndReward = await ethers.getContract("StakingAndReward");
  const contractAd = stakingAndReward.address;
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndContractsFile, "utf8")
  );
  const chainId = network.config.chainId.toString();

  //searching key in json object
  if (chainId in contractAddresses) {
    //contractAddresses[chainId]ay m inclusdes use kr lete h
    //this will return contractAddresses[chainId]ay of addresses of strings type
    //contractAddress[chainId] ki jagh arr bhi le skte isme use assign krke wo bda nam for small name everywhere
    if (!contractAddresses[chainId].includes(contractAd)) {
      contractAddresses[chainId].push(contractAd);
    } else {
      //isme else nothing chunki h to koi bat hi nhi,but we will change this logic  for localhost h bhi to use last m kr do taki frontend m jb access kre to hmesa last wala hi access ho,,and hardhat wale nye updated contract ko bhi purane address pr deply kr dete h jo phle se likha ho,,obviously esa realtestnet m n hota pr yha ot ho jata h so for protection
      //agr h to use last m kr do,kis aur last se swap krke agr khud hi laost m h to acha h..
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

  //fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses[chainId]));
  //galti bdi muskil se mili
  //yha hm [chainId ] bhi lga ke write krwa rhe address m khali array hi likha jayega wha pura object dhund rhe with key value jbki yha se khali value array bhej rhe ..ab to sudhar di
}

//erc20 contract ke address and abi hm isiliye update kr rhe h chunki hme jrurt h front m approve krne ke liye user direct erc20 token contrct ko frontend se call krega staking smartcontract ke through nhi

async function updateERC20ContractAddresses() {
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndERC20ContractAddressesFile, "utf8")
  );
  const chainId = network.config.chainId.toString(); //toString fro json m dalne and serach krne ko usme , chunki wha key string m hoti h unlike js object
  if (chainId === "31337") {
    const neutronToken = await ethers.getContract("NeutronToken"); //bahar nhi localhost ho to hi access kro wrna error aayegi,goerli p kroge to us smy deploy n hota n ye to address kha se milega.. is scripts se hm deployed address ko store kr rh e h wrna hadrhat to deploy run hote hi bhu jata h..
    if (chainId in contractAddresses) {
      //contractAddresses[chainId]ay m inclusdes use kr lete h

      if (!contractAddresses[chainId].includes(neutronToken.address)) {
        contractAddresses[chainId].push(neutronToken.address);
      } else {
        //isme else nothing chunki h to koi bat hi nhi,but we will change this logic  for localhost h bhi to use last m kr do taki frontend m jb access kre to hmesa last wala hi access ho,,and hardhat wale nye updated contract ko bhi purane address pr deply kr dete h jo phle se likha ho,,obviously esa realtestnet m n hota pr yha ot ho jata h so for protection
        //agr h to use last m kr do,kis aur last se swap krke agr khud hi laost m h to acha h..
        let len = contractAddresses[chainId].length; //checking length of array
        if (len > 1) {
          let i = contractAddresses[chainId].indexOf(neutronToken.address);
          let temp = contractAddresses[chainId][i];
          contractAddresses[chainId][i] = contractAddresses[chainId][len - 1];
          contractAddresses[chainId][len - 1] = temp;
        }
      }
    } else {
      contractAddresses[chainId] = [neutronToken.address];
    }
  } else {
    //it is address of real token contract deployed on testnet/mainnet phle se hi so heleper hardhat m dal diya kyuki hmare yha se har deployment ke sath ye address change n hoga..jbki staki ka hoga chunki use bar bar kr rhe h,ise to deployed se interact kkren ise rea;l m deploy n kr rhe mock to bs localhost pr deploy krte h hr bar chunki yha b/c hr bar nai bnti h node chalane p so purana contrac n rhta uspe...
    //chate to ise wha bhi direct likh skte the json/js kisi me pr yha h to yhi se likh de rhe h kyuki ye change to hona nhi hr deloymemnt m
    erc20NTROAddress = networkConfig[chainId]["erc20NTRO"]; //fixed address helepr hardhat config m likh diye h jha bhi need ho use kr lo
    if (chainId in contractAddresses) {
      if (!contractAddresses[chainId].includes(erc20NTROAddress)) {
        contractAddresses[chainId].push(erc20NTROAddress);
      }
    } else {
      contractAddresses[chainId] = [erc20NTROAddress];
    }
  }
  fs.writeFileSync(
    frontEndERC20ContractAddressesFile,
    JSON.stringify(contractAddresses)
  );
}
module.exports.tags = ["all", "frontend"];
