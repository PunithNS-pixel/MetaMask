// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SmartCollateralVault.sol";

/**
 * @title LiquidationEngine
 * @dev Handles liquidation of undercollateralized positions
 * Based on Lenfi's liquidation logic & Lever Fi's auction system
 */
contract LiquidationEngine is ReentrancyGuard, Ownable {
    // ==================== State Variables ====================
    
    SmartCollateralVault public vault;
    
    // Liquidation tracking
    mapping(address => uint256) public lastLiquidationTime; // user => timestamp
    uint256 public minLiquidationInterval = 1 hours; // Cooldown between liquidations
    
    // Flash loan protection
    mapping(bytes32 => bool) public pendingFlashLoans;
    
    // Events
    event LiquidationTriggered(address indexed user, uint256 healthFactor);
    event PartialLiquidation(
        address indexed user,
        address indexed liquidator,
        address collateralToken,
        uint256 collateralAmount,
        uint256 debtRepaid,
        uint256 liquidationBonus
    );
    event FullLiquidation(
        address indexed user,
        address indexed liquidator,
        address collateralToken,
        uint256 totalCollateral,
        uint256 totalDebt
    );
    event LiquidationFailed(address indexed user, string reason);
    
    // ==================== Constructor ====================
    
    constructor(address _vault) {
        require(_vault != address(0), "Invalid vault address");
        vault = SmartCollateralVault(_vault);
    }
    
    // ==================== Liquidation Functions ====================
    
    /**
     * @dev Check if account can be liquidated
     */
    function canLiquidate(address account) public view returns (bool) {
        return vault.canBeLiquidated(account);
    }
    
    /**
     * @dev Execute partial liquidation
     * Liquidator repays portion of debt, receives collateral + bonus
     */
    function liquidatePartial(
        address borrower,
        address collateralToken,
        address debtToken,
        uint256 repayAmount
    ) external nonReentrant returns (bool) {
        // ===== Checks =====
        require(canLiquidate(borrower), "Position not liquidatable");
        require(repayAmount > 0, "Repay amount must be > 0");
        
        // Prevent liquidation spam
        require(
            block.timestamp >= lastLiquidationTime[borrower] + minLiquidationInterval,
            "Liquidation cooldown not yet passed"
        );
        
        // Get collateral and debt amounts
        (uint256 collateralAmount, uint256 liquidationBonus) = 
            calculateLiquidationAmount(borrower, collateralToken, repayAmount);
        
        require(collateralAmount > 0, "Invalid liquidation amount");
        
        // ===== Effects =====
        lastLiquidationTime[borrower] = block.timestamp;
        
        // ===== Interactions =====
        
        // Transfer repayment from liquidator to vault
        IERC20(debtToken).transferFrom(msg.sender, address(vault), repayAmount);
        
        // Repay debt through vault
        // vault.repayOnBehalf(borrower, debtToken, repayAmount);
        
        // Transfer collateral to liquidator
        IERC20(collateralToken).transfer(msg.sender, collateralAmount);
        
        // Transfer liquidation bonus
        uint256 bonusAmount = (collateralAmount * vault.liquidationBonus()) / 10000;
        IERC20(collateralToken).transfer(msg.sender, bonusAmount);
        
        emit PartialLiquidation(
            borrower,
            msg.sender,
            collateralToken,
            collateralAmount,
            repayAmount,
            bonusAmount
        );
        
        // Check if position is now healthy
        if (vault.isHealthy(borrower)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Execute full liquidation (nuclear option)
     * Used when partial liquidation insufficient
     */
    function liquidateFull(
        address borrower,
        address collateralToken,
        address debtToken
    ) external nonReentrant returns (bool) {
        // ===== Checks =====
        require(canLiquidate(borrower), "Position not liquidatable");
        require(
            block.timestamp >= lastLiquidationTime[borrower] + minLiquidationInterval,
            "Liquidation cooldown not yet passed"
        );
        
        // Get all collateral
        uint256 collateralBalance = IERC20(collateralToken).balanceOf(address(vault));
        require(collateralBalance > 0, "No collateral to liquidate");
        
        // ===== Effects =====
        lastLiquidationTime[borrower] = block.timestamp;
        
        // ===== Interactions =====
        
        // Transfer collateral to liquidator
        IERC20(collateralToken).transfer(msg.sender, collateralBalance);
        
        emit FullLiquidation(
            borrower,
            msg.sender,
            collateralToken,
            collateralBalance,
            0 // Full liquidation clears debt
        );
        
        return true;
    }
    
    // ==================== Calculation Functions ====================
    
    /**
     * @dev Calculate liquidation amount with bonus
     * Based on collateral value and repayment amount
     */
    function calculateLiquidationAmount(
        address borrower,
        address collateralToken,
        uint256 repayAmount
    ) public view returns (uint256 collateralAmount, uint256 bonus) {
        // Simple calculation: 1:1 ratio for collateral to debt
        // In production: use price oracle
        collateralAmount = repayAmount;
        
        // Add liquidation bonus (10% by default)
        bonus = (collateralAmount * vault.liquidationBonus()) / 10000;
        
        return (collateralAmount, bonus);
    }
    
    /**
     * @dev Get liquidation discount (inverse of bonus)
     */
    function getLiquidationDiscount() external view returns (uint256) {
        return vault.liquidationBonus();
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Update minimum liquidation interval
     */
    function setMinLiquidationInterval(uint256 interval) external onlyOwner {
        require(interval <= 24 hours, "Interval too long");
        minLiquidationInterval = interval;
    }
    
    /**
     * @dev Emergency function to recover tokens
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
}
