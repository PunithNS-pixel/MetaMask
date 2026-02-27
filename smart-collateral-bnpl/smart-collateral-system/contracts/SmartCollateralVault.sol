// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SmartCollateralVault
 * @dev Core collateral management contract for Web3 Credit & BNPL
 * Inspired by Compound Protocol & Lenfi Smart Contracts
 */
contract SmartCollateralVault is ReentrancyGuard, Ownable {
    // ==================== State Variables ====================
    
    // Collateral tracking
    mapping(address => mapping(address => uint256)) public collateralDeposits; // user => token => amount
    mapping(address => bool) public isCollateralSupported; // token => is supported
    
    // Debt tracking
    mapping(address => mapping(address => uint256)) public borrowedAmount; // user => token => amount
    mapping(address => uint256) public totalDebt; // token => total borrowed
    
    // Collateral ratios (in basis points, 10000 = 100%)
    uint256 public minCollateralRatio = 15000; // 150% default
    uint256 public liquidationThreshold = 12000; // 120%
    uint256 public liquidationBonus = 1000; // 10%
    
    // Supported collateral tokens
    address[] public supportedCollaterals;
    
    // Events
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount);
    event BorrowingInitiated(address indexed user, address indexed token, uint256 amount);
    event DebtRepaid(address indexed user, address indexed token, uint256 amount);
    event CollateralLiquidated(address indexed user, address indexed token, uint256 amount, address indexed liquidator);
    event CollateralAdded(address indexed token);
    event CollateralRemoved(address indexed token);
    
    // ==================== Constructor ====================
    
    constructor() {
        // Initializations
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Add supported collateral token
     */
    function addCollateral(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!isCollateralSupported[token], "Token already supported");
        
        isCollateralSupported[token] = true;
        supportedCollaterals.push(token);
        
        emit CollateralAdded(token);
    }
    
    /**
     * @dev Remove collateral token from supported list
     */
    function removeCollateral(address token) external onlyOwner {
        require(isCollateralSupported[token], "Token not supported");
        
        isCollateralSupported[token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedCollaterals.length; i++) {
            if (supportedCollaterals[i] == token) {
                supportedCollaterals[i] = supportedCollaterals[supportedCollaterals.length - 1];
                supportedCollaterals.pop();
                break;
            }
        }
        
        emit CollateralRemoved(token);
    }
    
    /**
     * @dev Update collateral ratio
     */
    function setMinCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio > liquidationThreshold, "Ratio too low");
        minCollateralRatio = newRatio;
    }
    
    /**
     * @dev Update liquidation threshold
     */
    function setLiquidationThreshold(uint256 threshold) external onlyOwner {
        require(threshold < minCollateralRatio, "Invalid threshold");
        liquidationThreshold = threshold;
    }
    
    /**
     * @dev Update liquidation bonus
     */
    function setLiquidationBonus(uint256 bonus) external onlyOwner {
        require(bonus <= 5000, "Bonus too high"); // Max 50%
        liquidationBonus = bonus;
    }
    
    // ==================== User Functions ====================
    
    /**
     * @dev Deposit collateral
     */
    function depositCollateral(address token, uint256 amount) external nonReentrant {
        require(isCollateralSupported[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        collateralDeposits[msg.sender][token] += amount;
        
        emit CollateralDeposited(msg.sender, token, amount);
    }
    
    /**
     * @dev Withdraw collateral (if health factor allows)
     */
    function withdrawCollateral(address token, uint256 amount) external nonReentrant {
        require(collateralDeposits[msg.sender][token] >= amount, "Insufficient collateral");
        require(amount > 0, "Amount must be greater than 0");
        
        collateralDeposits[msg.sender][token] -= amount;
        
        // Check health factor after withdrawal
        require(isHealthy(msg.sender), "Would violate collateral ratio");
        
        IERC20(token).transfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, token, amount);
    }
    
    /**
     * @dev Borrow against collateral
     */
    function borrow(address collateralToken, address borrowToken, uint256 borrowAmount) 
        external 
        nonReentrant 
    {
        require(isCollateralSupported[collateralToken], "Collateral token not supported");
        require(collateralDeposits[msg.sender][collateralToken] > 0, "No collateral deposited");
        require(borrowAmount > 0, "Borrow amount must be greater than 0");
        
        borrowedAmount[msg.sender][borrowToken] += borrowAmount;
        totalDebt[borrowToken] += borrowAmount;
        
        // Check health factor
        require(isHealthy(msg.sender), "Would violate collateral ratio");
        
        // Transfer borrowed tokens (would need a lending pool)
        IERC20(borrowToken).transfer(msg.sender, borrowAmount);
        
        emit BorrowingInitiated(msg.sender, borrowToken, borrowAmount);
    }
    
    /**
     * @dev Repay borrowed amount
     */
    function repay(address borrowToken, uint256 amount) external nonReentrant {
        require(borrowedAmount[msg.sender][borrowToken] >= amount, "Repay amount too high");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(borrowToken).transferFrom(msg.sender, address(this), amount);
        
        borrowedAmount[msg.sender][borrowToken] -= amount;
        totalDebt[borrowToken] -= amount;
        
        emit DebtRepaid(msg.sender, borrowToken, amount);
    }
    
    // ==================== View Functions ====================
    
    /**
     * @dev Get user's collateral value (mock - would integrate with price oracle)
     */
    function getCollateralValue(address user) public view returns (uint256) {
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < supportedCollaterals.length; i++) {
            address token = supportedCollaterals[i];
            uint256 amount = collateralDeposits[user][token];
            
            if (amount > 0) {
                // Simple value: 1 token = 1 unit (would use price oracle)
                totalValue += amount;
            }
        }
        
        return totalValue;
    }
    
    /**
     * @dev Get user's total debt value
     */
    function getTotalDebt(address user) public view returns (uint256) {
        uint256 debt = 0;
        
        for (uint256 i = 0; i < supportedCollaterals.length; i++) {
            address token = supportedCollaterals[i];
            debt += borrowedAmount[user][token];
        }
        
        return debt;
    }
    
    /**
     * @dev Calculate health factor
     * Health Factor = Collateral Value / Debt
     * If HF < Liquidation Threshold, position can be liquidated
     */
    function getHealthFactor(address user) public view returns (uint256) {
        uint256 collateralValue = getCollateralValue(user);
        uint256 debt = getTotalDebt(user);
        
        if (debt == 0) return type(uint256).max;
        
        return (collateralValue * 10000) / debt;
    }
    
    /**
     * @dev Check if position is healthy
     */
    function isHealthy(address user) public view returns (bool) {
        uint256 healthFactor = getHealthFactor(user);
        return healthFactor >= minCollateralRatio;
    }
    
    /**
     * @dev Check if position can be liquidated
     */
    function canBeLiquidated(address user) public view returns (bool) {
        uint256 healthFactor = getHealthFactor(user);
        return healthFactor < liquidationThreshold;
    }
    
    /**
     * @dev Get list of supported collaterals
     */
    function getSupportedCollaterals() external view returns (address[] memory) {
        return supportedCollaterals;
    }
}
