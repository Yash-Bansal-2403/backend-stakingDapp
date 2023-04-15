const { run } = require("hardhat");
//ye kya h smjh n aaya ?? video se dekhna
//this verify function will be same for each verify bs ise deploy m call krenge args pass krke and verify kr dega

const verify = async (contractAddress, args) => {
  console.log("Verifying contract...");
  try {
    //Hardhat run  doing the work for us we are giving just our key and deployed contract address to verify
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

module.exports = {
  verify,
};
