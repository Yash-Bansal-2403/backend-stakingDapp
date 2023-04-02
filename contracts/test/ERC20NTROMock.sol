//Contract for NuetronToken
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

//contract name differne here from original so iska abi bhi usse main se alg hoga
contract ERC20NTROMock is ERC20Capped, ERC20Burnable {
    address payable public immutable i_owner;
    uint256 public blockReward;

    constructor(
        uint256 cap,
        uint256 reward
    ) ERC20("ERC20NTROMock", "NTRO") ERC20Capped(cap * (10 ** decimals())) {
        i_owner = payable(msg.sender);
        _mint(i_owner, 500000 * (10 ** decimals()));
        blockReward = reward;
    }

    function _mint(
        address account,
        uint256 amount
    ) internal virtual override(ERC20Capped, ERC20) {
        require(
            ERC20.totalSupply() + amount <= cap(),
            "ERC20Capped: cap exceeded"
        );
        super._mint(account, amount);
    }

    modifier onlyOwner() {
        require(
            msg.sender == i_owner,
            "Only Owner is allowed to call this function"
        );
        _;
    }

    function setReward(uint256 newReward) public onlyOwner {
        blockReward = newReward * (10 ** decimals());
    }

    function _mintMinerReward() internal {
        _mint(block.coinbase, blockReward);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        if (
            from != address(0) && // to check it is valid address not 0x000000..000
            to != block.coinbase &&
            block.coinbase != address(0)
        ) {
            _mintMinerReward();
        }
        super._beforeTokenTransfer(from, to, value);
    }
}