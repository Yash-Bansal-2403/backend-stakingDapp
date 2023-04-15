//sol return number as big number here so take care of that
const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("StakingAndReward Unit Tests", function () {
      let stakingAndReward, stakingAndRewardContract, erc20Mock, user, deployer, tokenAddress;

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts usse ek hi n aayega ??
        deployer = await accounts[0].getAddress();
        user = accounts[1];
        await deployments.fixture(["mocks", "staking"]); // Deploys modules by running scripts with the tags "mocks" and "stakingAndReward",we will not update frontend during running test cases
        erc20Mock = await ethers.getContract("NeutronToken"); // Returns a new connection to the NeutronToken contract connected to deployer
        stakingAndRewardContract = await ethers.getContract("StakingAndReward"); // Returns a new connection to the StakingAndReward contract
        // stakingAndReward = stakingAndRewardContract.connect(user); // Returns a new instance of the StakingAndReward contract connected to user so user acc can sign txn
        tokenAddress = erc20Mock.address;
      });

      describe("constructor", function () {
        it("initializes the stakingAndReward correctly", async () => {
          // Ideally, we'd separate these out so that only 1 assert per "it" block
          // And ideally, we'd make this check everything
          const stakingAndRewardOwner = await stakingAndRewardContract.i_owner();
          // Comparisons for StakingAndReward initialization:
          assert.equal(stakingAndRewardOwner, deployer);
        });
        it("should set the staking token to the specified token address", async function () {
          const stakingTokenAddress = await stakingAndRewardContract.getStakingTokenAddress();
          expect(stakingTokenAddress).to.equal(tokenAddress);
        });
      });
      describe("stake function", function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(stakingAndRewardContract.address, ethers.utils.parseEther("100"));
        });

        it("should revert if staking amount is greater than the staker's approved token balance", async function () {
          //await lgane pr bhi nhi thik se chla tha .allowance Promise ho de rha tha..fir .then se chal gya kbhi kbhi ho jata h await se bhi promise resolve n ho pata kyu ? pta nhi abhi tk to await se kam hota tha ....then se har hal m resolved hi milta h
          //Chatgpt: then the issue might be that the allowance() function is returning a Promise that is not being properly resolved. In this case, you can use .then() to retrieve the resolved value of the Promise instead of using await
          erc20Mock
            .allowance(deployer, stakingAndRewardContract.address)
            .then((value) => {
              console.log(ethers.utils.formatEther(value.toString()));
            })
            .catch((error) => {
              console.log(error);
            });
          await expect(stakingAndRewardContract.stake(ethers.utils.parseEther("101"))).to.be.reverted;
          // await expect(token.transfer(walletTo.address, 1007)).to.be.revertedWith("Insufficient funds");
          // await expect(stakingAndRewardContract.stake(ethers.utils.parseEther("101"))).to.be.revertedWith("Approved_Token_Balance_Not_Sufficient()");
        });
        it("should update totalStakedTokens and userBalance", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          const amountInEther = 80;
          const userStakedBalanceBefore = await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedBefore = await stakingAndRewardContract.getTotalStakedTokens();
          await stakingAndRewardContract.stake(amountInWei);
          const userStakedBalanceAfter = await stakingAndRewardContract.getStakedBalanceOfUser(deployer);

          const totalStakedAfter = await stakingAndRewardContract.getTotalStakedTokens();

          expect(parseFloat(ethers.utils.formatEther(userStakedBalanceBefore)) + amountInEther).to.equal(parseFloat(ethers.utils.formatEther(userStakedBalanceAfter)));
          expect(parseFloat(ethers.utils.formatEther(totalStakedBefore)) + amountInEther).to.equal(parseFloat(ethers.utils.formatEther(totalStakedAfter)));
        });
        it("should emit if token staked", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          expect(await stakingAndRewardContract.stake(amountInWei)).to.emit("Token_Staked");

          // const events = await stakingAndRewardContract.queryFilter("Token_Staked");
          // //ye  method h queryFilter events de deta h contract ke iska use kya h ??? event emit hone ke nad call kroge ya phle krke kya mlega ..bad m contract instance pr kese pta chelga  ???balklol chatgpt gave this
          // console.log(events);
        });
      });
      describe("Withdraw function", async function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(stakingAndRewardContract.address, ethers.utils.parseEther("100"));
        });

        it("should revert if user has not staked any token and trying to withdraw", async function () {
          await expect(stakingAndRewardContract.withdraw(ethers.utils.parseEther("10"))).to.be.reverted;
        });
        it("should revert if user withdraw when the withdrawn functionality is turned off", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(true);
          await stakingAndRewardContract.stake(amount);
          await expect(stakingAndRewardContract.withdraw(ethers.utils.parseEther("10"))).to.be.reverted;
        });
        it("should revert if user withdraw tokens greater than the staked tokens", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await expect(stakingAndRewardContract.withdraw(ethers.utils.parseEther(amount + 1))).to.be.reverted;
        });
        it("stakerBalance,totalBalance should be reduced by amount withdrawn", async () => {
          const amountInWei = ethers.utils.parseEther("80");
          const amountInEther = 80;
          await stakingAndRewardContract.stake(amountInWei);
          const userStakedBalanceBefore = await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedBefore = await stakingAndRewardContract.getTotalStakedTokens();
          await stakingAndRewardContract.withdraw(amountInWei);
          const userStakedBalanceAfter = await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedAfter = await stakingAndRewardContract.getTotalStakedTokens();

          expect(parseFloat(ethers.utils.formatEther(userStakedBalanceBefore)) - amountInEther).to.equal(parseFloat(ethers.utils.formatEther(userStakedBalanceAfter)));
          expect(parseFloat(ethers.utils.formatEther(totalStakedBefore)) - amountInEther).to.equal(parseFloat(ethers.utils.formatEther(totalStakedAfter)));
        });
        it("should emit if token withdrawn", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amountInWei);
          expect(await stakingAndRewardContract.withdraw(amountInWei)).to.emit("Token_Withdrawal");
        });
      });
      describe("check updateReward modifier in Staking function", async function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(stakingAndRewardContract.address, ethers.utils.parseEther("100"));
        });
        it("should update the timestamp", async () => {
          const timestampBefore = await stakingAndRewardContract.getLatestTimestamp(deployer);
          await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));
          const timestampAfter = await stakingAndRewardContract.getLatestTimestamp(deployer);

          assert(timestampAfter > timestampBefore);
        });
        it("should update user reward", async () => {
          const rewardBefore = await stakingAndRewardContract.getUserReward(deployer);
          await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));

          await new Promise(async (resolve, reject) => {
            try {
              await network.provider.send("evm_increaseTime", [20]);
              await stakingAndRewardContract.stake(ethers.utils.parseEther("5"));
              await network.provider.request({ method: "evm_mine", params: [] });
              //iske mine ke abhi need nhi ,fir bhi kr diya kro thik rhta h tuarant wha tiem jake uoadet ho ajta hmare txn ka wait nhi rkta wrna txn koi ye increcd tiem b/c chain pr phucnhana pdta h tb wha block.timestampo ko upadet rkta h..(kya sikie niche txn bhejne se hoag ya us n/w pr hm is file se ya khi se bhi txn bhej de update ho jayega)chunki upar dubara stake krneg 5 to txn call hoga and khud mine ho jayega usi se jo timeincrese kiya h wo block.timstamp m nw pr update ho ajeyga.. yha se btana pdta h txn se ya block mine krwa ke ..
              const rewardAfter = await stakingAndRewardContract.getUserReward(deployer);

              assert(parseFloat(ethers.utils.formatEther(rewardBefore)) < parseFloat(ethers.utils.formatEther(rewardAfter)));

              resolve();
            } catch (e) {
              console.log("Promise rejected");
              reject(e);
            }

            // setTimeout(async () => {
            //   try {
            //     await stakingAndRewardContract.stake(ethers.utils.parseEther("5")); //-staking again so as to mine the block so that reward will be updated after the run updateReward moodifier

            //     const rewardAfter = await stakingAndRewardContract.getUserReward(deployer);

            //     assert(parseFloat(ethers.utils.formatEther(rewardBefore)) < parseFloat(ethers.utils.formatEther(rewardAfter)));

            //     resolve();
            //   } catch (e) {
            //     console.log("rejected");
            //     reject(e); // if try fails, rejects the promise
            //   }
            // }, 2000);

            // if try passes, resolves the promise
          });
        });
        it("should emit if  user reward  updated", async () => {
          await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));

          await new Promise(async (resolve, reject) => {
            try {
              await network.provider.send("evm_increaseTime", [20]);
              await network.provider.request({ method: "evm_mine", params: [] }); //comments same as prev. promise
              expect(await stakingAndRewardContract.stake(ethers.utils.parseEther("5"))).to.emit("Rewards_Per_User_Updated");

              resolve();
            } catch (e) {
              console.log("Promise rejected");
              reject(e);
            }
            //blockchin m block.timstmp hardhat n/w ka update kr diya(apnma hi h na)  so wait krne ki jrurt nhi ye functio niche ka to real  m wait krwayega..
            // setTimeout(async () => {
            //   try {
            //     expect(await stakingAndRewardContract.stake(ethers.utils.parseEther("5"))).to.emit("Rewards_Per_User_Updated");

            //     resolve();
            //   } catch (e) {
            //     console.log("rejected");
            //     reject(e); // if try fails, rejects the promise
            //   }
            // }, 20000);

            // if try passes, resolves the promise
          });
        });
        it("should emit if time stamp update", async function () {
          await new Promise(async (resolve, reject) => {
            const amountInWei = ethers.utils.parseEther("80");

            await stakingAndRewardContract.stake(amountInWei);
            //ise somilte to emit se bhi check kr skte the but .once try krne ke liye ye kiya h bas
            stakingAndRewardContract.once("TimeStamp_Updated", async () => {
              try {
                console.log("Promise Resolved");
                resolve();
              } catch (e) {
                console.log("Promise Rejected");
                reject(e);
              }
            });
          });
        });
      });
      describe("Claim Reward function", async function () {
        beforeEach(async function () {
          const amount = ethers.utils.parseEther("100");
          await erc20Mock.increaseAllowance(stakingAndRewardContract.address, amount);
        });

        it("should revert if user has not staked any token and trying to claim rewards", async function () {
          await expect(stakingAndRewardContract.claimRewards()).to.be.reverted;
        });
        // it("should update the timestamp", async () => {
        //   await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));
        //   const timestampBefore = await stakingAndRewardContract.getLatestTimestamp(deployer);
        //   await network.provider.send("evm_increaseTime", [20]);
        //   const timestampAfter = await stakingAndRewardContract.getLatestTimestamp(deployer);
        //   console.log(timestampBefore);
        //   console.log(timestampAfter);
        //   assert(timestampAfter > timestampBefore);
        // });
        it("should revert if user claim rewards when the claim reward functionality is turned off", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount); //stake krenge taki phli error na aaye stake an kiye wali..yhi aaye..
          await network.provider.send("evm_increaseTime", [20]);
          await network.provider.request({ method: "evm_mine", params: [] });

          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(true);

          await expect(stakingAndRewardContract.claimRewards()).to.be.reverted;
        });
        it("should update the balance of user when reward collected", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await network.provider.send("evm_increaseTime", [20]);

          //yha block khud mine n hoat testnet ki trh ye apna h jb tk hm xtn n dete ya mine kr aye yahs etb tk n hota
          await network.provider.request({ method: "evm_mine", params: [] });
          //mine kroge tbhi upadted incresed time b/c pr phuchega yha se,,increse ke bad ya to txn send kr do wo phucnha dega upadeted incresd tyime ya block mine krwa do yha se,,udhar ab block.timestamp upadtd hoga tbhi jb yha se mine karye tya txn bheje so ho jayega and reward bn ajeyga 20 sec bdne pr so reward bnke hme mil jayega...

          //now time incraesed and rerwad period passed so reward can be collectd,, maaping not updated still until something trigger to upadetReward modeifre so we stake again afer 20 sec.

          // await stakingAndRewardContract.stake(ethers.utils.parseEther("10"));  mine kr rhe h so iski need nhi rewrad collect krne ko nya
          // //iske bina maping of reward update n hogi,,ye getUserReward ke liye jruri tha getRewardToBeclaimed ke liye nhi sume to upadetd ho aayega..jesa udhr jaeyga rewrad period jitn ebnge us hiasb se..
          // const rewardBefore = await stakingAndRewardContract.getUserReward(deployer);
          const rewardBefore = await stakingAndRewardContract.getRewardToBeClaimed(deployer);
          console.log(rewardBefore.toString());
          //ye function use kiya kyuyki isiki hisab se net reward jayeg user ko collect krne pr..mapping ke hisab se nhi wo puarani ho ajti h and stake/withdrwa se upadte hoti h.. usme flaw ho skta h agr reward period km ho an dyha se stake krne ke bad bhi alg rewad bhej skta h and alg se stake bhi call krna hoga pr is function ko use m jruri nhi isme updated reward hi aaye jo use rko ajyega so asani se comare kr skte h bsrte rewad perio bhut hi km n ho ki y e le tb k user ca  kre dusre line m reward bd jaye esa rarely hoga itna km rewradEpriod n hoag 5 10 sec bhi is test code ke liye bhut hote h <1 sec m puara test chl ajat h kyuki ye real b/c pr nhi hardhat n/w terer pr chlta h..,,so no problem for this use..//real pr getRewardToBeClaimed bhi shi chlega kyuki view tuarant de deta txn m hi tiem lgta h bs..

          const userBalanceBefore = await erc20Mock.balanceOf(deployer);
          await stakingAndRewardContract.claimRewards();

          // const rewardAfter = await stakingAndRewardContract.getUserReward(deployer); //should be zero now until rewardPeriod passed from collecting here and update reward modifire triggered by something to update this mapping again
          const userBalanceAfter = await erc20Mock.balanceOf(deployer);

          // Error: overflow [ See: https://links.ethers.org/v5-errors-NUMERIC_FAULT-overflow
          //direct wei ko number m krke ye eerro aayi..isliye genralyy bignumber ko toString krte h eth m krke ya uske bina direct wei ko bhi
          //expect(userBalanceAfter.toNumber() - userBalanceBefore.toNumber()).to.equal(rewardBefore.toNumber());
          // console.log(userBalanceAfter.toNumber());
          //ise krne pr bhi overflow aa rha tha
          //phle fromat to ether krneg tb number m convert rkeng
          // expect(parseFloat(ethers.utils.formatEther(userBalanceAfter)) - parseFloat(ethers.utils.formatEther(userBalanceBefore))).to.equal(parseFloat(ethers.utils.formatEther(rewardBefore)));

          /**BigInt and BigNumber are both data types in JavaScript that are used to represent integers with arbitrary precision, but they have some important differences.

// BigInt is a built-in data type that was added to JavaScript in ECMAScript 2020. It is a native implementation of arbitrary-precision integers and is designed to work seamlessly with other JavaScript features and data types. Because it is a native data type, BigInt is generally faster and uses less memory than other arbitrary-precision libraries.

// On the other hand, BigNumber is a third-party library that provides arbitrary-precision arithmetic for JavaScript. It is not built into the language itself and must be imported as a separate library. Unlike BigInt, which uses the native JavaScript number type to represent integers of arbitrary size, BigNumber represents numbers using a custom object that stores the number as an array of digits. This makes BigNumber slower and more memory-intensive than BigInt, but it also provides more features and customization options.

// In general, you should use BigInt when you need to perform arithmetic operations on integers with arbitrary precision and want to take advantage of the native implementation in JavaScript. If you need more advanced features, such as formatting or custom precision settings, you may want to consider using BigNumber or another third-party library. */

          //Bignmbuer nad wei m aata smart contract se..
          assert.strictEqual(BigInt(userBalanceAfter) - BigInt(userBalanceBefore), BigInt(rewardBefore));

          //ye direct wei m h and bignumber object ko bigint data type m convert kr liya h to compare like simple int
          //baki se comare nhi ho pa rha tha wei se eth m anbd parseFloat krke alg alg conversion ho rha tha last digits m marginal ddiffrence tha
          //This means that you can use BigInt to perform arithmetic operations on integers of any size, from very small to very large, without worrying about loss of precision or overflow errors.

          //However, because BigInt values require more memory than regular numbers, they can be slower to work with and may have performance implications for your code. It's also worth noting that some JavaScript engines may impose a practical limit on the size of BigInt values due to memory constraints or implementation details.
          /**Many operations in Ethereum operate on numbers which are outside the range of safe values to use in JavaScript.

A BigNumber is an object which safely allows mathematical operations on numbers of any magnitude.

Most operations which need to return a value will return a BigNumber and parameters which accept values will generally accept them. */
          //to string bignumber and bigint are safe to convert bignumbe rm already aata h ..and last are safe to compare numbers balances etc//
          //Bignumber use krna nhi aata seekhna jrurt pdegi tb seekh lenge..lmba floating point comare rka hoga mostly lgta h bigint se kam ho ajyega uhdr se wei m hi aate h and udhr . n smjhte pure int m wei m aate h
        });
        it("should update the rewardUser mapping to zero when reward collected", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await network.provider.send("evm_increaseTime", [20]);
          //now time incraesed and rerwad period passed so reward can be collectd maaping notupdated still until something trigger to upadetReward modeifre so we stake again afer 20 sec.

          await stakingAndRewardContract.stake(ethers.utils.parseEther("10"));
          //iske bina maping of rewardUsers update n hogi

          await stakingAndRewardContract.claimRewards();

          const userRewardAfterClaim = await stakingAndRewardContract.getUserReward(deployer); //from reward mapping

          expect(userRewardAfterClaim.toNumber()).to.equal(0);
          //no need to formatEther becoz zero is zero kitne bhi lge ho usme overflow bhi n h
        });
        it("should emit if reward collected", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amountInWei);
          await network.provider.send("evm_increaseTime", [20]);
          //now time incraesed and rerwad period passed so reward can be collectd now

          expect(await stakingAndRewardContract.claimRewards()).to.emit("Reward_Claimed");
        });
      });
      describe("setPauseWithdrawalOfBalanceAndReward function", async () => {
        it("should pause withdrawl functionality", async () => {
          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(true);
          const status = await stakingAndRewardContract.getPauseWithdrawalOfBalanceAndReward();
          expect(status).to.equal(true);
        });

        //testing onlyOwner Modifier also with this function
        it("should revert if user other than deployer tries to access pauseWithdrawl functionality", async () => {
          const userContract = await stakingAndRewardContract.connect(accounts[1]);
          //giving the new instance of that contract connected ith new account/signer to sign txn
          //both instance can co exist together ans we can work on them mtlab .conncte se agr kisi instance pr call kre to wo bhi rhta h sath m dusra jisse se signer s e connect krte h wo bhi bn jata h phla khtm n hota work krta h
          //see this:
          //  await expect(stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(true)).to.be.reverted;
          //revert nhi kreg achunki ye contract instance to deployer se ie. owner se connected h ie. ye onowenr function ko call kr skta h but userContract  insnace as a user h

          //kbhi ye await expect ke andr lga ke chla jata h kbhi bahr se chla jata h mostly bahar hi rkho..
          await expect(userContract.setPauseWithdrawalOfBalanceAndReward(true)).to.be.reverted;
        });
      });
      describe("setRewardRate function", async () => {
        it("should cahnge rewardRate if ower call it", async () => {
          await stakingAndRewardContract.setRewardRate("20"); //simple number sendig 20 bhejo 20 jayega waha and 20 ki trh treat hoga,,tokens/ethers m esa hota h yha jo hm smjhte h uska wei hota h wha isiliye um=nhe parse krke bhet h
          const newRewardRate = await stakingAndRewardContract.getRewardRate();

          //bignumber dega ie. strin m kiya to compare
          expect(newRewardRate.toString()).to.equal("20");
        });
      });
      describe("setRewardPeriod function", async () => {
        it("should cahnge rewardPeriod if ower call it", async () => {
          await stakingAndRewardContract.setRewardPeriod("5"); //simple number sendig 20 bhejo 20 jayega waha and 20 ki trh treat hoga,,tokens/ethers m esa hota h yha jo hm smjhte h uska wei hota h wha isiliye um=nhe parse krke bhet h
          const newRewardPeriod = await stakingAndRewardContract.getRewardPeriod();

          //bignumber dega ie. strin m kiya to compare
          expect(newRewardPeriod.toString()).to.equal("5");
        });
      });
      //Testing keliye bnaya tha now commented kyuki wha se hata diya contract se
      // describe("getTime function", async () => {
      //   it("should cahngetime afetr evm increase time method", async () => {
      //     const time = await stakingAndRewardContract.getTime();
      //     console.log(time.toString());
      //     await network.provider.send("evm_increaseTime", [1111]);
      //     await network.provider.request({ method: "evm_mine", params: [] });
      //mine kroge tbhi upadted incresed time b/c pr phuchega yha se,,increse ke bad ya to txn send kr do wo phucnha dega upadeted incresd tyime ya block mine krwa do yha se
      //     const time2 = await stakingAndRewardContract.getTime();
      //     console.log(time2.toString());
      //   });
      // });

      //we have not tested nonReentrant modifier of openzepplin becoz it is not ours it oz's and already tested so we are trusting their team,hamari etst krne m halat khrab ho jayegi
    });
