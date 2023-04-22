// SPDX-License-Identifier: MIT
//this is an ERC20 token (will be used for stakingAndReward)
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; //to access ERC20.sol
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol"; //to set upper cap on no of tokens
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol"; // make token burnable

// ERC20Capped itself inherits ERC20
contract AlphaToken is ERC20Capped, ERC20Burnable {
    address payable public owner; //to set owner as person who deploy contract
    uint256 public blockReward; //to set blockreward for miners

    //our constructor requires cap which is given as input to ERC20Capped and reward for determining blockReward
    //ERC20 constructor requires token name and token symbol
    //ERC20Capped constructor requires cap which sets the maximum cap on no of tokens
    // decimals() is by default 18 in ERC20
    constructor(
        uint256 cap,
        uint256 reward
    ) ERC20("AlphaToken", "AT") ERC20Capped(cap * (10 ** decimals())) {
        owner = payable(msg.sender); //owner is the one who deploys contract and should be pyable as he has to get initialsupply
        _mint(owner, 500000 * (10 ** decimals())); //mint function is inherited from ERC20 and
        //is used to generate new tokens with arg-1 as owner of generated tokens and arg-2 as
        //no of tokens to be generated
        //initially 500000 tokens will be minted  i.e newly generated  to the owner
        blockReward = reward * (10 ** decimals());
    }

    function _mint(
        address account,
        uint256 amount
    )
        internal
        virtual
        override(
            ERC20Capped,
            ERC20 //specifies _mint function is overrided for both ERC20 and ERC20Capped
        )
    {
        require(
            ERC20.totalSupply() + amount <= cap(),
            "ERC20Capped: cap exceeded"
        );
        super._mint(account, amount); //to call _mint defined originally in ERC20
    }

    //internal function to mint coins and transfer them to account who is mining the block in blockchain
    //block.coinbase is used to access the address of account who is mining the block
    //this _mintMinerReward is called before actua token transfer is done,.....and then after
    //minting new coins and transferring them to block.coinbase we do the actual transfer of tokens
    //using _beforeTokenTransfer

    //_transfer function is executed after _beforeTokenTransfer and _beforeTokenTransfer
    //is executed after our modified/overrided _beforeTokenTransfer

    // functions starting with underscore signifies that they are from derived class
    function _mintMinerReward() internal {
        _mint(block.coinbase, blockReward);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        if (
            from != address(0) && //to check from address is valid
            // transfer to bock.coinbase
            //this is to prevent another reward for the reward
            //this will check that tokens are not transferring to the miner itself as this will generate infinite loop
            to != block.coinbase && //***IMP*** to prevent infinite loop of i.e transaction occurs which require mining and again transfer occur to miner
            block.coinbase != address(0) //to check to address is valid
        ) {
            _mintMinerReward();
        }
        super._beforeTokenTransfer(from, to, value); //to call _beforTokenTransfer originally in ERC20
    }

    //function to modify the blockReward in future
    function setBlockReward(uint256 reward) public onlyOwner {
        blockReward = reward * (10 ** decimals());
    }

    //this function is to destroy this contract in future
    //not related to token in any way...just to destroy contract
    function destroy() public onlyOwner {
        selfdestruct(owner);
    }

    //modifier to give access of functions only to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
}
