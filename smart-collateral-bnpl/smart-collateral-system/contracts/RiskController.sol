// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SmartCollateralVault.sol";
import "./PriceOracle.sol";

/**
 * @title RiskController
 * @dev Risk management and protocol parameters
 * Based on Compound's Comptroller & Lever Fi's risk model
 */
contract RiskController is Ownable {
    // ==================== State Variables ====================
    
    SmartCollateralVault public vault;
    PriceOracle public oracle;
    
    // Risk parameters per collateral
    struct CollateralParams {
        uint256 collateralFactor; // Max LTV (in basis points, 7000 = 70%)
        uint256 liquidationFactor; // Liquidation incentive (10500 = 5% bonus)
        uint256 maxBorrowLimit; // Max total borrow amount in this collateral
        bool isActive;
    }
    
    mapping(address => CollateralParams) public collaterals;
    
    // Account liquidity tracking
    mapping(address => uint256) public accountLiquidity; // user => available to borrow
    
    // Risk metrics
    struct RiskMetrics {
        uint256 systemUtilization; // Overall system utilization
        uint256 maxLoanToValue; // Max LTV across all collaterals
        uint256 averageHealth; // Average health factor
        uint256 liquidationCount; // Number of liquidations
    }
    
    RiskMetrics public metrics;
    
    // Events
    event CollateralParamsUpdated(
        address indexed token,
        uint256 collateralFactor,
        uint256 liquidationFactor
    );
    event RiskMetricsUpdated(uint256 utilization, uint256 avgHealth);
    event LiquidityUpdated(address indexed user, uint256 availableBorrow);
    event SystemRiskAlert(string riskType, uint256 severity);
    
    // ==================== Constructor ====================
    
    constructor(address _vault, address _oracle) {
        require(_vault != address(0), "Invalid vault");
        require(_oracle != address(0), "Invalid oracle");
        
        vault = SmartCollateralVault(_vault);
        oracle = PriceOracle(_oracle);
    }
    
    // ==================== Risk Parameter Functions ====================
    
    /**
     * @dev Set collateral parameters
     */
    function setCollateralParams(
        address token,
        uint256 collateralFactor,
        uint256 liquidationFactor,
        uint256 maxBorrowLimit
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(collateralFactor <= 9000, "Collateral factor too high"); // Max 90%
        require(liquidationFactor >= 10000, "Invalid liquidation factor");
        require(liquidationFactor <= 15000, "Liquidation factor too high"); // Max 50% bonus
        
        collaterals[token] = CollateralParams({
            collateralFactor: collateralFactor,
            liquidationFactor: liquidationFactor,
            maxBorrowLimit: maxBorrowLimit,
            isActive: true
        });
        
        emit CollateralParamsUpdated(token, collateralFactor, liquidationFactor);
    }
    
    /**
     * @dev Disable collateral
     */
    function disableCollateral(address token) external onlyOwner {
        collaterals[token].isActive = false;
    }
    
    // ==================== Risk Calculation Functions ====================
    
    /**
     * @dev Calculate account's available borrow amount
     */
    function getAccountLiquidity(address account) 
        external 
        view 
        returns (
            uint256 liquidity,
            uint256 shortfall
        ) 
    {
        // Get collateral value
        uint256 collateralValue = vault.getCollateralValue(account);
        
        // Get debt
        uint256 debt = vault.getTotalDebt(account);
        
        // Calculate available borrow
        if (collateralValue == 0) {
            return (0, debt);
        }
        
        // Available = (collateral * collateralization factor) - debt
        uint256 avgCollateralizationFactor = 7000; // 70% default
        uint256 maxBorrow = (collateralValue * avgCollateralizationFactor) / 10000;
        
        if (maxBorrow >= debt) {
            liquidity = maxBorrow - debt;
            shortfall = 0;
        } else {
            liquidity = 0;
            shortfall = debt - maxBorrow;
        }
        
        return (liquidity, shortfall);
    }
    
    /**
     * @dev Check if account can borrow more
     */
    function canBorrow(address account, uint256 amount) 
        external 
        view 
        returns (bool) 
    {
        (uint256 liquidity, ) = this.getAccountLiquidity(account);
        return liquidity >= amount;
    }
    
    /**
     * @dev Get account's borrow power
     */
    function getBorrowPower(address account) 
        external 
        view 
        returns (uint256) 
    {
        (uint256 liquidity, ) = this.getAccountLiquidity(account);
        return liquidity;
    }
    
    // ==================== Risk Monitoring Functions ====================
    
    /**
     * @dev Update system risk metrics
     */
    function updateRiskMetrics() external onlyOwner {
        // Calculate system utilization
        // In production: aggregate data from vault
        
        // Check for system-wide risks
        if (metrics.systemUtilization > 9000) {
            // 90% utilization
            emit SystemRiskAlert("HIGH_UTILIZATION", 3);
        }
        
        if (metrics.liquidationCount > 100) {
            // Too many liquidations
            emit SystemRiskAlert("HIGH_LIQUIDATION_RATE", 2);
        }
        
        emit RiskMetricsUpdated(metrics.systemUtilization, metrics.averageHealth);
    }
    
    /**
     * @dev Check if account is in danger of liquidation
     */
    function isAccountAtRisk(address account) 
        external 
        view 
        returns (bool) 
    {
        uint256 healthFactor = vault.getHealthFactor(account);
        
        // At risk if health factor below 150%
        return healthFactor < 15000;
    }
    
    /**
     * @dev Get risk level for an account
     */
    function getAccountRiskLevel(address account) 
        external 
        view 
        returns (uint256) 
    {
        uint256 healthFactor = vault.getHealthFactor(account);
        
        if (healthFactor >= 15000) return 0; // Safe
        if (healthFactor >= 12000) return 1; // Warning
        if (healthFactor >= 11000) return 2; // Danger
        return 3; // Critical
    }
    
    // ==================== Stress Testing ====================
    
    /**
     * @dev Calculate stress scenario (e.g., 10% price drop)
     */
    function getStressScenario(
        address account,
        uint256 priceDropPercent
    ) external view returns (uint256 healthFactorAfterStress) {
        // In production: use price oracle and simulate price change
        
        // Simple calculation for now
        uint256 collateralValue = vault.getCollateralValue(account);
        uint256 adjustedValue = collateralValue - (collateralValue * priceDropPercent) / 100;
        uint256 debt = vault.getTotalDebt(account);
        
        if (debt == 0) return type(uint256).max;
        
        healthFactorAfterStress = (adjustedValue * 10000) / debt;
        
        return healthFactorAfterStress;
    }
    
    /**
     * @dev Get liquidation price (at what price will account be liquidated)
     */
    function getLiquidationPrice(address account) 
        external 
        view 
        returns (uint256) 
    {
        uint256 debt = vault.getTotalDebt(account);
        uint256 liquidationThreshold = vault.liquidationThreshold();
        
        // Liquidation price = debt / (collateral amount * liquidation threshold)
        // Simplified calculation
        
        if (debt == 0) return 0;
        
        return debt * 10000 / liquidationThreshold;
    }
}
