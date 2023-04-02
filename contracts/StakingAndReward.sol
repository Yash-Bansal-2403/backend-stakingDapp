// SPDX-License-Identifier: MIT

//users can stake & withdraw erc20
//claim rewardsPerUser

pragma solidity ^0.8.17;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Transfer_Failed();
error User_Has_Not_Staked_Any_Tokens();
error Not_An_Owner();
error Token_Balance_Not_Sufficient();
error Withdrawal_Of_Staking_Balance_And_Reward_Paused();

contract StakingAndReward is ReentrancyGuard {
    event TimeStamp_Updated(uint256 indexed timestamp, address indexed creator);
    event Token_Staked(uint256 indexed amount, address indexed staker);
    event Token_Withdrawal(uint256 indexed amount, address indexed withdrawer);
    event Withdrawal_Paused();
    event Rewards_Per_User_Updated(
        uint256 indexed updatedReward,
        address indexed user
    );
    event Reward_Rate_Updated(
        uint256 indexed newRewardRate,
        address indexed updater
    );
    event Reward_Period_Updated(
        uint256 indexed newRewardPeriod,
        address indexed updater
    );
    //Two changes to be done
    //make reward less when users increase like patrick
    //remove latestStaked_tokens mapping and by modifier/function update the reward whenever stake/claim/withdraw called
    //events and errors
    //units and staging tests
    //events to reduce state reading. so gas can be saved patrick ne marketplace m kese kiye dekhna. 3 trh se use h txRecipet.evensts se , .once  se and direct graph se read sb dekhna..use krna smjh jaoge..
    //jis state ki contract m jrurt nhi us var ko contract m n bnate,balki agr bahar hi chaiye to graph m event se phuncha ke wha se fron end pd leta h ..eg ItemLisated ,Ite,mbaught etc in market place..ise yha n bnaya,state bnani pdti write krte for frotend but yha jrurt n thus isse use whi phucnha diya graph p
    //dusre wale evnt like Winner picked kese use honge pta nhi frontend code m patrick ka .once wal lottery se delkhna test m and smjh lena..
    //listening events using etehr.js in frontend side,patrick n backend m tetsts m listen kiya tha

    address payable public immutable i_owner;
    mapping(address => uint256) private stakersBalances;
    mapping(address => uint256) private latestTimeStamps;
    mapping(address => uint256) private rewardsPerUser;
    mapping(address => uint256) private latestStakedTokens;
    uint256 private totalStakedTokens = 0;
    IERC20 private immutable i_stakingToken;
    //pause feature would allow the contract owner to pause the contract in case of emergencies or unforeseen circumstances
    bool private pauseWithdrawalOfBalanceAndReward = false;
    // In 1 period  staking of 1000 tokens, will get rewardRate tokens as reward
    uint256 private rewardRate = 5; //rewardTokensPerPeriodPerThousandStaked
    //rewardPeriod in seconds ,reward milega itne eac itni secodns ke bad staking ke
    uint256 private rewardPeriod = 10;

    constructor(address tokenAddress) {
        i_owner = payable(msg.sender);
        i_stakingToken = IERC20(tokenAddress);
    }

    //gas for calling this token contract transferFrom cuts from stake function caller from outside b/c ie. from metamask or script
    //but why this can't work for erc20 token transfer may be because erc20 contract doesn't allow this but native gas allow this. yes
    //patrcik ne bhi phle approve kiya token contract ka function direct cal krke tb stake kiya agr ye ui se krwana ho to ui approve call kregi fir metamaks pooch lega ye mang rhe h,confirm kru agr use chahe to approve confirm kr skta h.. So approve those tokens for this contract as spender then call this stake function..
    function stake(uint256 amount) public returns (bool) {
        //check approval before transferFrom,wese ye check ki hme jrurt nhi kyuki transferfrom call m wo khud check kregga and nhi hua to false retrun kr dega,hm yha se use dekh ke revrt kr denge ,isse ye bhi sb plt jayega jo bhi chenge is txn m hua ho. ese hi tranfer se ohle khud wo check ki jrurt nhi jo transfer m jake us contract m erc20 token ke khud hi check hoinge,agr balance wagerah km nikla to fasle return hoga/revert bhi kr skega, hoga hm yha se false pdke revrt kr denge,,so yha need to nhi un checks call se hle transfer/transferFrom ki ki pr fir bhi good look kro to kr lo
        if (amount > i_stakingToken.balanceOf(msg.sender)) {
            revert Token_Balance_Not_Sufficient();
        } //is this redundenyt or necessary ??
        //amount <=0 revert, zero address khi possibility ho to require lgana

        //need to be approved before calling transferFrom,kya yha bhi jaruri  h kya ? Yes..and how user will approve ??direct calling token contract from remix by it's address

        //oz ki erc20.sol chunki usi se bna h hmare token ntro ka contract thoda hi bdla h baki ye sare function wahi h openzepplin wale hi m dekha ye spender bnke jayega contract aur apne m mang rha h msg.sender m se spender ko approve hona jaruri h jbki ise nhi h isiliye ye nhi kr skta yha se call krke cut..
        //try krke dekh liya...phle alg se approve krega staker apne tokens ko is contract ke liye tbhi stake call krega wo direct ke alawa is contract ke through kr skta h kya ..socho dekho..
        //flashloan m to hm contract m token dal rh  the tb wo contract approve kr rha tha..
        //so only owner can call approve of token not this contrcat

        bool success = i_stakingToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) {
            revert Transfer_Failed();
        }
        if (stakersBalances[msg.sender] > 0) {
            rewardsPerUser[msg.sender] += getReward(
                block.timestamp - latestTimeStamps[msg.sender],
                latestStakedTokens[msg.sender]
            );
        }
        stakersBalances[msg.sender] += amount;
        latestStakedTokens[msg.sender] = amount;
        totalStakedTokens += amount;

        emit Token_Staked(amount, msg.sender);

        latestTimeStamps[msg.sender] = block.timestamp;
        emit TimeStamp_Updated(block.timestamp, msg.sender);

        return success;
    }

    function withdraw() public returns (bool) {
        if (stakersBalances[msg.sender] <= 0) {
            revert User_Has_Not_Staked_Any_Tokens();
        }
        if (pauseWithdrawalOfBalanceAndReward) {
            revert Withdrawal_Of_Staking_Balance_And_Reward_Paused();
        }
        uint256 total = stakersBalances[msg.sender] +
            getRewardToBeClaimed(msg.sender);
        stakersBalances[msg.sender] = 0;
        latestTimeStamps[msg.sender] = 0;
        latestStakedTokens[msg.sender] = 0;
        rewardsPerUser[msg.sender] = 0;
        totalStakedTokens -= total;
        //only transfer for erc20 token only owner of token call this.
        bool success = i_stakingToken.transfer(msg.sender, total);
        if (!success) {
            revert Transfer_Failed();
        }
        //If success is true then,Transfer event will be emitted from transfer function
        emit Token_Withdrawal(total, msg.sender);
        return success;
    }

    function claimRewards() public {
        if (stakersBalances[msg.sender] <= 0) {
            revert User_Has_Not_Staked_Any_Tokens();
        }
        if (pauseWithdrawalOfBalanceAndReward) {
            revert Withdrawal_Of_Staking_Balance_And_Reward_Paused();
        }
        latestTimeStamps[msg.sender] = block.timestamp;
        emit TimeStamp_Updated(block.timestamp, msg.sender);
        uint256 reward = getRewardToBeClaimed(msg.sender);

        rewardsPerUser[msg.sender] = 0;
        emit Rewards_Per_User_Updated(0, msg.sender);
        i_stakingToken.transfer(msg.sender, reward);
    }

    function setPauseWithdrawalOfBalanceAndReward(
        bool pause
    ) external onlyByOwner {
        pauseWithdrawalOfBalanceAndReward = pause;
    }

    function setRewardRate(uint256 newRewardRate) external onlyByOwner {
        rewardRate = newRewardRate;
    }

    function setDaysPerRewardPeriod(
        uint256 newRewardDays
    ) external onlyByOwner {
        rewardPeriod = newRewardDays;
    }

    modifier onlyByOwner() {
        if (msg.sender != i_owner) {
            revert Not_An_Owner();
        }
        _;
    }

    /** View/Pure Functions */
    function getReward(
        uint256 stakingTimeSeconds,
        uint256 totalStakedPerUser
    ) private view returns (uint256) {
        // In 1 whole period of staking of staking 1000 token will get  rewardRate  tokens as reward
        //getting days count as whole number
        //  uint256 totalStakingDays = uint(stakingTimeSeconds) / (60 * 60 * 24);
        //getting periods count as whole number
        uint256 totalStakingPeriods = uint(stakingTimeSeconds) / rewardPeriod;
        //no need to write uint() here until numerator is var. still we wrote for safety. so that it always return integer after division, if it was number on both num. and denom. fixed value then we have to put uint(num.) type casting on numerator otherwise it will show error not to assign 5/2 in uint256.in neweer sol verions it will give partial number,but solidity can't accept this number so error eg: check by seeong own
        // uint256 h = 5 / 2;
        /**Type rational_const 5 / 2 is not implicitly convertible to expected type uint256 */

        return (uint(totalStakedPerUser * totalStakingPeriods * rewardRate) /
            (10000)); //returned in wei,we wil convert them using ethers.utils
        //10000 can be written as 10_000 solidity feature we can add underscores
        //10000 ki jagh total staked tokens whcole rkhe to acha h,upar per thousand ki jagh kuch aur kr skte h
        //ansh m 1e18 multily krna taki niche ke wei nutrelize ho ske,totlsupply ke
    }

    function getPauseWithdrawalOfBalanceAndReward()
        external
        view
        returns (bool)
    {
        return pauseWithdrawalOfBalanceAndReward;
    }

    function getStakedBalanceOfUser(
        address user
    ) external view returns (uint256) {
        return stakersBalances[user];
    }

    function getTotalStakedTokens() external view returns (uint256) {
        return totalStakedTokens;
    }

    function getTotalContractTokenBalance() external view returns (uint256) {
        return i_stakingToken.balanceOf(address(this));
    }

    function getStakingTokenAddress() external view returns (address) {
        return address(i_stakingToken);
    }

    function getLatestStakedTokens(
        address user
    ) external view returns (uint256) {
        return latestStakedTokens[user];
    }

    function getLatestTimestamp(address user) external view returns (uint256) {
        return latestTimeStamps[user];
    }

    function getRewardRate() external view returns (uint256) {
        return rewardRate;
    }

    function getDaysPerRewardPeriod() external view returns (uint256) {
        return rewardPeriod;
    }

    function getApprovedTokensToBeStaked(
        address ownerOfTokens
    ) external view returns (uint256) {
        return i_stakingToken.allowance(ownerOfTokens, address(this));
        //allowance(address owner, address spender)
        //this contract is spender here so that it can transfer tokens to itself of staking
    }

    //public because ,also used in this contract
    function getRewardToBeClaimed(address user) public view returns (uint256) {
        uint256 stakingTimeSeconds = block.timestamp - latestTimeStamps[user];
        uint256 latestStaked = latestStakedTokens[user];
        uint256 reward = (rewardsPerUser[user] > 0)
            ? (getReward(stakingTimeSeconds, latestStaked) +
                rewardsPerUser[user])
            : getReward(stakingTimeSeconds, latestStaked);
        return reward;
    }
}
