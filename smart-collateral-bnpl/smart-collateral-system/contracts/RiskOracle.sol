// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RiskOracle
 * @dev Smart Risk Prediction Engine
 * Calculates liquidation risk and dynamic collateral requirements
 */
contract RiskOracle is Ownable {
    // Asset risk and collateral ratio storage
    struct AssetRisk {
        uint256 riskScore;           // 0-100 (percentage, divided by 100 = bps)
        uint256 volatilityScore;     // 0-100
        uint256 requiredCollateralRatioBps; // in basis points (e.g., 14000 = 140%)
        uint256 updatedAt;
        bool isActive;
    }

    // Mapping of asset address to risk data
    mapping(address => AssetRisk) public assetRisks;
    
    // Legacy risk scores for borrowers (kept for backward compatibility)
    mapping(address => mapping(uint256 => uint256)) private _borrowerRiskScores;

    event AssetRiskUpdated(
        address indexed asset,
        uint256 riskScore,
        uint256 volatilityScore,
        uint256 requiredCollateralRatioBps
    );
    event BorrowerRiskScoreUpdated(address indexed borrower, uint256 indexed loanId, uint256 riskBps);

    constructor() {
        // Initialize default risks for common assets
        // Formula: (LTV × 0.5) + (Volatility × 0.3) + (LiquidityRisk × 0.2)
        
        // Mock ETH: Low volatility
        _initAssetRisk(address(0x1), 800,  2000, 14000);  // 8% risk, 20% volatility, 140% ratio
        
        // Mock BNB: Medium volatility
        _initAssetRisk(address(0x2), 1200, 4000, 16000);  // 12% risk, 40% volatility, 160% ratio
        
        // Mock Meme: High volatility
        _initAssetRisk(address(0x3), 3500, 8000, 22000);  // 35% risk, 80% volatility, 220% ratio
    }

    function _initAssetRisk(
        address asset,
        uint256 riskScore,
        uint256 volatilityScore,
        uint256 requiredCollateralRatioBps
    ) internal {
        assetRisks[asset] = AssetRisk({
            riskScore: riskScore,
            volatilityScore: volatilityScore,
            requiredCollateralRatioBps: requiredCollateralRatioBps,
            updatedAt: block.timestamp,
            isActive: true
        });
    }

    /**
     * @dev Set risk for a specific asset (owner only)
     * Updates: risk score, volatility, and required collateral ratio
     */
    function setAssetRisk(
        address asset,
        uint256 riskScore,
        uint256 volatilityScore,
        uint256 requiredCollateralRatioBps
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        require(riskScore <= 10000, "Risk too high");
        require(volatilityScore <= 10000, "Volatility too high");
        require(requiredCollateralRatioBps >= 10000, "Ratio too low");

        assetRisks[asset] = AssetRisk({
            riskScore: riskScore,
            volatilityScore: volatilityScore,
            requiredCollateralRatioBps: requiredCollateralRatioBps,
            updatedAt: block.timestamp,
            isActive: true
        });

        emit AssetRiskUpdated(asset, riskScore, volatilityScore, requiredCollateralRatioBps);
    }

    /**
     * @dev Get complete risk data for an asset
     */
    function getAssetRisk(address asset)
        external
        view
        returns (
            uint256 riskScore,
            uint256 volatilityScore,
            uint256 requiredCollateralRatioBps
        )
    {
        AssetRisk memory risk = assetRisks[asset];
        
        // Return defaults if not set
        if (!risk.isActive) {
            return (1000, 2000, 14000);  // Default: 10% risk, 20% volatility, 140% ratio
        }
        
        return (risk.riskScore, risk.volatilityScore, risk.requiredCollateralRatioBps);
    }

    /**
     * @dev Get required collateral ratio for an asset
     * Used by LendingPool to validate borrow requests
     */
    function getRequiredCollateralRatio(address asset) external view returns (uint256) {
        AssetRisk memory risk = assetRisks[asset];
        if (!risk.isActive) {
            return 14000;  // Default 140%
        }
        return risk.requiredCollateralRatioBps;
    }

    /**
     * @dev Get risk score as percentage (0-10000)
     * For UI display
     */
    function getRiskScorePercent(address asset) external view returns (uint256) {
        AssetRisk memory risk = assetRisks[asset];
        if (!risk.isActive) {
            return 1000;  // Default 10%
        }
        return risk.riskScore;
    }

    /**
     * @dev Get volatility score
     * For UI display and risk indicators
     */
    function getVolatilityScore(address asset) external view returns (uint256) {
        AssetRisk memory risk = assetRisks[asset];
        if (!risk.isActive) {
            return 2000;  // Default 20%
        }
        return risk.volatilityScore;
    }

    /**
     * @dev Legacy function - set borrower-specific risk score
     * Kept for backward compatibility with insurance module
     */
    function setRiskScore(address borrower, uint256 loanId, uint256 riskBps) external onlyOwner {
        require(borrower != address(0), "Invalid borrower");
        require(riskBps <= 10000, "Risk too high");
        _borrowerRiskScores[borrower][loanId] = riskBps;
        emit BorrowerRiskScoreUpdated(borrower, loanId, riskBps);
    }

    /**
     * @dev Legacy function - get borrower risk score
     */
    function getRiskBps(address borrower, uint256 loanId) external view returns (uint256) {
        uint256 riskBps = _borrowerRiskScores[borrower][loanId];
        return riskBps > 0 ? riskBps : 1000;  // Default 10%
    }

    /**
     * @dev Legacy function - get borrower risk score
     */
    function getRiskScore(address borrower, uint256 loanId) external view returns (uint256 riskBps, uint256 updatedAt) {
        uint256 bps = _borrowerRiskScores[borrower][loanId];
        uint256 score = bps > 0 ? bps : 1000;
        return (score, block.timestamp);
    }

    /**
     * @dev Calculate healthy liquidation risk
     * Green: < 10%, Yellow: 10-25%, Red: > 25%
     */
    function getLiquidationRiskLevel(address asset) external view returns (string memory) {
        AssetRisk memory risk = assetRisks[asset];
        uint256 riskScore = risk.isActive ? risk.riskScore : 1000;
        
        if (riskScore < 1000) {
            return "GREEN";   // < 10%
        } else if (riskScore < 2500) {
            return "YELLOW";  // 10-25%
        } else {
            return "RED";     // > 25%
        }
    }
}
