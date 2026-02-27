// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InsurancePool is ReentrancyGuard, Ownable {
    IERC20 public immutable stableToken;
    address public manager;

    mapping(address => uint256) public liquidityProvided;
    uint256 public totalLiquidity;

    event ManagerUpdated(address indexed manager);
    event LiquidityDeposited(address indexed provider, uint256 amount);
    event LiquidityWithdrawn(address indexed provider, uint256 amount);
    event PremiumCollected(address indexed payer, uint256 amount);
    event ClaimPaid(address indexed recipient, uint256 amount);

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager");
        _;
    }

    constructor(address stableTokenAddress) {
        require(stableTokenAddress != address(0), "Invalid token");
        stableToken = IERC20(stableTokenAddress);
    }

    function setManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid manager");
        manager = _manager;
        emit ManagerUpdated(_manager);
    }

    function depositLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");

        stableToken.transferFrom(msg.sender, address(this), amount);
        liquidityProvided[msg.sender] += amount;
        totalLiquidity += amount;

        emit LiquidityDeposited(msg.sender, amount);
    }

    function withdrawLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(liquidityProvided[msg.sender] >= amount, "Insufficient LP balance");
        require(amount <= stableToken.balanceOf(address(this)), "Insufficient pool balance");

        liquidityProvided[msg.sender] -= amount;
        totalLiquidity -= amount;

        stableToken.transfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, amount);
    }

    function collectPremium(address payer, uint256 amount) external onlyManager nonReentrant {
        require(payer != address(0), "Invalid payer");
        require(amount > 0, "Invalid amount");

        stableToken.transferFrom(payer, address(this), amount);
        totalLiquidity += amount;

        emit PremiumCollected(payer, amount);
    }

    function payoutClaim(address recipient, uint256 amount) external onlyManager nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(amount <= stableToken.balanceOf(address(this)), "Pool insolvency");

        if (totalLiquidity >= amount) {
            totalLiquidity -= amount;
        } else {
            totalLiquidity = 0;
        }

        stableToken.transfer(recipient, amount);
        emit ClaimPaid(recipient, amount);
    }

    function poolBalance() external view returns (uint256) {
        return stableToken.balanceOf(address(this));
    }
}
