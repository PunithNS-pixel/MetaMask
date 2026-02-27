// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("Mock USDT", "mUSDT") {
        _decimals = 18;
        _mint(msg.sender, 1000000 * 10**18); // Mint 1M tokens to deployer
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
