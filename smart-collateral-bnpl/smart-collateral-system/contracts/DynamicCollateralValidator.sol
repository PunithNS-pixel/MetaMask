// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RiskOracle.sol";
import "./SmartCollateralVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DynamicCollateralValidator
 * @dev Validates borrowing against dynamic collateral ratios based on asset risk
 * Formula: (collateralValue / borrowAmount) >= requiredRatio
 */
contract DynamicCollateralValidator is Ownable {
    RiskOracle public riskOracle;
    SmartCollateralVault public vault;

    event BorrowValidated(
        address indexed borrower,
        address indexed collateral,
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 requiredRatioBps,
        uint256 actualRatioBps
    );

    event BorrowRejected(
        address indexed borrower,
        address indexed collateral,
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 requiredRatioBps,
        uint256 actualRatioBps
    );

    constructor(address _riskOracle, address _vault) {
        require(_riskOracle != address(0) && _vault != address(0), "Invalid addresses");
        riskOracle = RiskOracle(_riskOracle);
        vault = SmartCollateralVault(_vault);
    }

    /**
     * @dev Validate if a borrow request meets dynamic collateral requirements
     * Returns: (isValid, requiredRatio, currentRatio)
     */
    function validateBorrow(
        address borrower,
        address collateralToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external view returns (bool isValid, uint256 requiredRatioBps, uint256 currentRatioBps) {
        require(borrower != address(0), "Invalid borrower");
        require(collateralToken != address(0), "Invalid collateral");
        require(borrowAmount > 0, "Invalid borrow amount");

        // Get required collateral ratio for this asset
        requiredRatioBps = riskOracle.getRequiredCollateralRatio(collateralToken);

        // Calculate current ratio: (collateral / borrow) * 10000
        // E.g., 1 ETH collateral for 0.7 ETH borrow = 142.8% ratio
        currentRatioBps = (collateralAmount * 10000) / borrowAmount;

        // Validate: current ratio must be >= required ratio
        isValid = currentRatioBps >= requiredRatioBps;

        return (isValid, requiredRatioBps, currentRatioBps);
    }

    /**
     * @dev Check if borrower can borrow given their collateral
     * Reverts if validation fails
     */
    function requireValidBorrow(
        address borrower,
        address collateralToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external view {
        (bool isValid, uint256 requiredRatioBps, uint256 currentRatioBps) = this.validateBorrow(
            borrower,
            collateralToken,
            collateralAmount,
            borrowAmount
        );

        require(isValid, "Insufficient collateral for dynamic ratio");
    }

    /**
     * @dev Get risk information for display
     */
    function getAssetRiskInfo(address asset)
        external
        view
        returns (
            uint256 riskScorePercent,
            uint256 volatilityPercent,
            uint256 requiredCollateralPercent,
            string memory riskLevel
        )
    {
        (uint256 risk, uint256 volatility, uint256 ratio) = riskOracle.getAssetRisk(asset);
        
        return (
            risk / 100,              // Convert to percentage (bps to %)
            volatility / 100,        // Convert to percentage
            ratio / 100,             // Convert to percentage
            riskOracle.getLiquidationRiskLevel(asset)
        );
    }
}
