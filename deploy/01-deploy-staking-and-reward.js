const { network, ethers } = require("hardhat"); //ethers from hardhat
const { networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config"); //just data written not code and import every here,,so that we can change only there any fix data, like..see that File
require("dotenv").config();
const { verify } = require("../utils/verify");

//localhost p jb bhi node dubara run krenge inhe run krna pdega kyuki purane ko bhul jayega but testnet p deploy ke bad dubara need nhi agr update n kiya ho contract

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId; //hardhat populate this from hardhat-config based on  whichever n/w we deploy using command-line,whatever n/w we specified in command hardhat takes data about it from hardhat config and run this script for that network automatically.we are not specifying n/w here in this script,where to deploy  balki hm hardhat se le rhe h yha n/w name/chainId and wo hamari command ke base pr config file se..
  let erc20NTROMock, erc20NTROAddress;

  if (chainId == 31337) {
    erc20NTROMock = await ethers.getContract("NeutronToken"); //Gives latest deployed instance of this contract on hardhat n/w on prev. script. does this work on testnet ??
    erc20NTROAddress = erc20NTROMock.address;
  } else {
    erc20NTROAddress = networkConfig[chainId]["erc20NTRO"]; //accessing data from  objects inside helper-hardhat-config.js
  }
  const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;
  //so that surely verified on etherscan until we will wait

  log("----------------------------------------------------");
  const arguments = [erc20NTROAddress]; //args address based on ChainId
  const stakingAndReward = await deploy("StakingAndReward", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...");
    await verify(stakingAndReward.address, arguments);
    //etehrscan apikey hardhat deploy ke time config se khud utha lega hmne dal di h,,deploy ke time hi run hojayegi alg se api script run nhi krni
  }

  const networkName = network.name == "hardhat" ? "localhost" : network.name;
  log(`Contract deployed to Network :${networkName} and Address: ${stakingAndReward.address}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "staking"];

//npx hardhat deploy --tags all ya staking se run hota h..jitne scripts m ye tag hoga deploy ke andr wo sb scripts run hongi

//if we run this w/o running prev. script sath hi m on hardhat n/w,,phle wo akeli ya sath ki and ab dubara hardhat n/w run kiya prev. secript ke bina  to bhul gya ye to wo b/c gyi..
//This Error will come
/**Error: ERROR processing C:\Users\Dell\Projects\DeFiProjects\Staking-DeFi\staking-ethereum-side\deploy\01-deploy-staking-and-reward.js:
Error: No Contract deployed with name NeutronToken
    at Object.getContract (C:\Users\Dell\Projects\DeFiProjects\Staking-DeFi\staking-ethereum-side\node_modules\@nomiclabs\hardhat-ethers\src\internal\helpers.ts:447:11)
 */

//and on hardhat localhost run node and keep this b/c in running mode  and run prev. script 1 time and you can run this script as many times alone until you re-run the hardhat localhost node

//because on hardhat n/w whenever we run b/c created and destroyed as script ends so their deployed contracts also, isipe unit test hote h ,,
//jbki on hardhat localhost node b/c keep runing mode when we run it by         npx hardhat  node      --------command h ye
//fir new terminal m
//npx hardhat deploy --network localhost      ---ye command run kro for deploy on localhost node ie. run all deploy scripts inside deploy folder 1 by 1 seq. m forever that's why name m numbering jruri h deploy folder k andr scripts ki,koi specific script run krni h --tags all/mocks lga lo sahuliyat se..
//hardhat-deploy alg se deploy folder wali asani deta h hardhat ke sath khud n aati ye usme to simple deploy.js script m likhke run krte the..
//yha deploy name ka task deta h wo naya,,npx hardhat deploy m use ho rha h deploy name se....
//npx hardhat    command se sare tasks list out ho jate h..deploy nya aa jata h hardhat-deploy install ke bad ya task phle se likha tha  ???
//pta nhi lekin usme aur bhi bhut taska h ,wo plugins m h toolbox m,coverage,etherscan-verify,gast reporter..we will see when we use them..
//localhost bhi tetsnet ke jese name specify jruri h koi --network and name n likha to by default hardhat n/w man lega
//eg npx hardhat deploy
//this b/c tb tk exist krti h jb tk use stop n kre like server run krta h..stop krke re-run p sb destroy ho jata h(wo bnd hui and fir se wahi se chalku hui re-run pr and usne phle deployed contract ka instance yad rkh liya bnd krke chlau p bhi kese..sayd re-run p bhi n hulti check it???) and fir se new b/c isme bhi milti h//you know it,,,,patrick ne btaya tha use hardhat fundme and simple storage wale hardhat ke testcases m dekh lena,,aur details ke liye and khud hit and trial kr lena ispe and aur chahiye to hardhat docs m dkeh lena wese itna jruri nhi kam chalau ata h to jao practical kro
//ek aur chij dekhi contract update krne ke bad bhi dubar use same hi uske purane address p deploy mar deta h ye shi h, kis base p addresschange krta h pta nhi,signature change pr ya name chage pr ,,hme janne ki jrurt bhi nhi testnet pr har nar deploy pr nya address milta h ,,,aur yha to hme factory wale m se latest address le let h wo nye p ho ya puarne p hme mtlab nhi kyuki hm to hr bar deploy pr nya hi manke chlenge like testnet ,,no laparwahi

//hardhat node running ke terminal m uspe aane wale logs bhi print honge like server,,,jo bhi txn uspe jayega....pay ka dtaa update ka ya contract creation ka..wo pura txn print hoga..event if any.. ye script wale log nhi ye to jha run hogi wha print hoga wha to txn wale log ie. miNLY TXN PRINT HOGA
// EVENT KA PTA NHI PTA LGANA WHA HOTA H YA NHI.???sayad hoga..b/c p bhi ese hi log hote honge n wha to event logs m hi jata h...

//acc. wgerah to wo khud hardhat n/w ke jese hi wahi khud le leta h bs iska fayda ye h ise runnig m rkhta h like b/c script run krke turant end n krta..wha ctrl+c se process kill krn hoga b/c running ko stop ke liya

//stop this bull shit i know everything about them
