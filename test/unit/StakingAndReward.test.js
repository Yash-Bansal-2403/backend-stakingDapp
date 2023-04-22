//solidity return number as big number here in js so take care of that
const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("StakingAndReward Unit Tests", function () {
      let stakingAndReward,
        stakingAndRewardContract,
        erc20Mock,
        user,
        deployer,
        tokenAddress;

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = await accounts[0].getAddress();
        user = accounts[1];
        await deployments.fixture(["mocks", "staking"]); // Deploys modules by running scripts with the tags "mocks" and "stakingAndReward",we will not update frontend during running test cases
        erc20Mock = await ethers.getContract("AlphaToken"); // Returns a new connection to the AlphaToken contract connected to deployer
        stakingAndRewardContract = await ethers.getContract("StakingAndReward"); // Returns a new connection to the StakingAndReward contract
        // stakingAndReward = stakingAndRewardContract.connect(user); // Returns a new instance of the StakingAndReward contract connected to user so user acc can sign txn
        tokenAddress = erc20Mock.address;
      });

      describe("constructor", function () {
        it("initializes the stakingAndReward correctly", async () => {
          // Ideally, we'd separate these out so that only 1 assert per "it" block
          // And ideally, we'd make this check everything
          const stakingAndRewardOwner =
            await stakingAndRewardContract.i_owner();
          // Comparisons for StakingAndReward initialization:
          assert.equal(stakingAndRewardOwner, deployer);
        });
        it("should set the staking token to the specified token address", async function () {
          const stakingTokenAddress =
            await stakingAndRewardContract.getStakingTokenAddress();
          expect(stakingTokenAddress).to.equal(tokenAddress);
        });
      });
      describe("stake function", function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(
            stakingAndRewardContract.address,
            ethers.utils.parseEther("100")
          );
        });

        it("should revert if staking amount is greater than the staker's approved token balance", async function () {
          erc20Mock
            .allowance(deployer, stakingAndRewardContract.address)
            .then((value) => {
              console.log(ethers.utils.formatEther(value.toString()));
            })
            .catch((error) => {
              console.log(error);
            });
          await expect(
            stakingAndRewardContract.stake(ethers.utils.parseEther("101"))
          ).to.be.reverted;
        });
        it("should update totalStakedTokens and userBalance", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          const amountInEther = 80;
          const userStakedBalanceBefore =
            await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedBefore =
            await stakingAndRewardContract.getTotalStakedTokens();
          await stakingAndRewardContract.stake(amountInWei);
          const userStakedBalanceAfter =
            await stakingAndRewardContract.getStakedBalanceOfUser(deployer);

          const totalStakedAfter =
            await stakingAndRewardContract.getTotalStakedTokens();

          expect(
            parseFloat(ethers.utils.formatEther(userStakedBalanceBefore)) +
              amountInEther
          ).to.equal(
            parseFloat(ethers.utils.formatEther(userStakedBalanceAfter))
          );
          expect(
            parseFloat(ethers.utils.formatEther(totalStakedBefore)) +
              amountInEther
          ).to.equal(parseFloat(ethers.utils.formatEther(totalStakedAfter)));
        });
        it("should emit if token staked", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          expect(await stakingAndRewardContract.stake(amountInWei)).to.emit(
            "Token_Staked"
          );

          // const events = await stakingAndRewardContract.queryFilter("Token_Staked");
          //this method provides events of contract passed
        });
      });
      describe("Withdraw function", async function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(
            stakingAndRewardContract.address,
            ethers.utils.parseEther("100")
          );
        });

        it("should revert if user has not staked any token and trying to withdraw", async function () {
          await expect(
            stakingAndRewardContract.withdraw(ethers.utils.parseEther("10"))
          ).to.be.reverted;
        });
        it("should revert if user withdraw when the withdrawn functionality is turned off", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(
            true
          );
          await stakingAndRewardContract.stake(amount);
          await expect(
            stakingAndRewardContract.withdraw(ethers.utils.parseEther("10"))
          ).to.be.reverted;
        });
        it("should revert if user withdraw tokens greater than the staked tokens", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await expect(
            stakingAndRewardContract.withdraw(
              ethers.utils.parseEther(amount + 1)
            )
          ).to.be.reverted;
        });
        it("stakerBalance,totalBalance should be reduced by amount withdrawn", async () => {
          const amountInWei = ethers.utils.parseEther("80");
          const amountInEther = 80;
          await stakingAndRewardContract.stake(amountInWei);
          const userStakedBalanceBefore =
            await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedBefore =
            await stakingAndRewardContract.getTotalStakedTokens();
          await stakingAndRewardContract.withdraw(amountInWei);
          const userStakedBalanceAfter =
            await stakingAndRewardContract.getStakedBalanceOfUser(deployer);
          const totalStakedAfter =
            await stakingAndRewardContract.getTotalStakedTokens();

          expect(
            parseFloat(ethers.utils.formatEther(userStakedBalanceBefore)) -
              amountInEther
          ).to.equal(
            parseFloat(ethers.utils.formatEther(userStakedBalanceAfter))
          );
          expect(
            parseFloat(ethers.utils.formatEther(totalStakedBefore)) -
              amountInEther
          ).to.equal(parseFloat(ethers.utils.formatEther(totalStakedAfter)));
        });
        it("should emit if token withdrawn", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amountInWei);
          expect(await stakingAndRewardContract.withdraw(amountInWei)).to.emit(
            "Token_Withdrawal"
          );
        });
      });
      describe("check updateReward modifier in Staking function", async function () {
        beforeEach(async function () {
          await erc20Mock.increaseAllowance(
            stakingAndRewardContract.address,
            ethers.utils.parseEther("100")
          );
        });
        it("should update the timestamp", async () => {
          const timestampBefore =
            await stakingAndRewardContract.getLatestTimestamp(deployer);
          await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));
          const timestampAfter =
            await stakingAndRewardContract.getLatestTimestamp(deployer);

          assert(timestampAfter > timestampBefore);
        });
        it("should update user reward", async () => {
          const rewardBefore = await stakingAndRewardContract.getUserReward(
            deployer
          );
          await stakingAndRewardContract.stake(ethers.utils.parseEther("80"));

          await new Promise(async (resolve, reject) => {
            try {
              await network.provider.send("evm_increaseTime", [20]);
              await stakingAndRewardContract.stake(
                ethers.utils.parseEther("5")
              );
              await network.provider.request({
                method: "evm_mine",
                params: [],
              });
              const rewardAfter = await stakingAndRewardContract.getUserReward(
                deployer
              );

              assert(
                parseFloat(ethers.utils.formatEther(rewardBefore)) <
                  parseFloat(ethers.utils.formatEther(rewardAfter))
              );

              resolve();
            } catch (e) {
              console.log("Promise rejected");
              reject(e);
            }

            // setTimeout(async () => {
            //   try {
            //     await stakingAndRewardContract.stake(ethers.utils.parseEther("5")); //-staking again so as to mine the block so that reward will be updated after the run updateReward modifier

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
              await network.provider.request({
                method: "evm_mine",
                params: [],
              }); //comments same as prev. promise
              expect(
                await stakingAndRewardContract.stake(
                  ethers.utils.parseEther("5")
                )
              ).to.emit("Rewards_Per_User_Updated");

              resolve();
            } catch (e) {
              console.log("Promise rejected");
              reject(e);
            }
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
            //using .once
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
          await erc20Mock.increaseAllowance(
            stakingAndRewardContract.address,
            amount
          );
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
          await stakingAndRewardContract.stake(amount);
          await network.provider.send("evm_increaseTime", [20]);
          await network.provider.request({ method: "evm_mine", params: [] });

          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(
            true
          );

          await expect(stakingAndRewardContract.claimRewards()).to.be.reverted;
        });
        it("should update the balance of user when reward collected", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await network.provider.send("evm_increaseTime", [20]);
          //here we have to mine to update our blockchain as in hardhat network it does not mine automatically
          await network.provider.request({ method: "evm_mine", params: [] });

          const rewardBefore =
            await stakingAndRewardContract.getRewardToBeClaimed(deployer);
          console.log(rewardBefore.toString());
          const userBalanceBefore = await erc20Mock.balanceOf(deployer);
          await stakingAndRewardContract.claimRewards();
          const userBalanceAfter = await erc20Mock.balanceOf(deployer);

          assert.strictEqual(
            BigInt(userBalanceAfter) - BigInt(userBalanceBefore),
            BigInt(rewardBefore)
          );
        });
        it("should update the rewardUser mapping to zero when reward collected", async () => {
          const amount = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amount);
          await network.provider.send("evm_increaseTime", [20]);

          await stakingAndRewardContract.stake(ethers.utils.parseEther("10"));

          await stakingAndRewardContract.claimRewards();

          const userRewardAfterClaim =
            await stakingAndRewardContract.getUserReward(deployer);

          expect(userRewardAfterClaim.toNumber()).to.equal(0);
        });
        it("should emit if reward collected", async function () {
          const amountInWei = ethers.utils.parseEther("80");
          await stakingAndRewardContract.stake(amountInWei);
          await network.provider.send("evm_increaseTime", [20]);

          expect(await stakingAndRewardContract.claimRewards()).to.emit(
            "Reward_Claimed"
          );
        });
      });
      describe("setPauseWithdrawalOfBalanceAndReward function", async () => {
        it("should pause withdrawl functionality", async () => {
          await stakingAndRewardContract.setPauseWithdrawalOfBalanceAndReward(
            true
          );
          const status =
            await stakingAndRewardContract.getPauseWithdrawalOfBalanceAndReward();
          expect(status).to.equal(true);
        });

        //testing onlyOwner Modifier also with this function
        it("should revert if user other than deployer tries to access pauseWithdrawl functionality", async () => {
          const userContract = await stakingAndRewardContract.connect(
            accounts[1]
          );

          await expect(userContract.setPauseWithdrawalOfBalanceAndReward(true))
            .to.be.reverted;
        });
      });
      describe("setRewardRate function", async () => {
        it("should cahnge rewardRate if ower call it", async () => {
          await stakingAndRewardContract.setRewardRate("20");
          const newRewardRate = await stakingAndRewardContract.getRewardRate();

          expect(newRewardRate.toString()).to.equal("20");
        });
      });
      describe("setRewardPeriod function", async () => {
        it("should cahnge rewardPeriod if ower call it", async () => {
          await stakingAndRewardContract.setRewardPeriod("5");
          const newRewardPeriod =
            await stakingAndRewardContract.getRewardPeriod();

          expect(newRewardPeriod.toString()).to.equal("5");
        });
      });
    });
