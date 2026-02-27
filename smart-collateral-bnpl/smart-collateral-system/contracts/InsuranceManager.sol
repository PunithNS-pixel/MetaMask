// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./InsuranceNFT.sol";
import "./InsurancePool.sol";
import "./RiskOracle.sol";

contract InsuranceManager is Ownable {
    InsuranceNFT public immutable insuranceNFT;
    InsurancePool public immutable insurancePool;
    RiskOracle public immutable riskOracle;

    address public liquidationEngine;

    uint256 public coverageFactorBps = 5000; // 50%
    uint256 public maxCoverageBps = 6000; // 60%
    uint256 public minLockPeriod = 1 hours;

    mapping(bytes32 => uint256) public recordedLiquidationLoss;

    event LiquidationEngineUpdated(address indexed liquidationEngine);
    event CoverageParamsUpdated(uint256 coverageFactorBps, uint256 maxCoverageBps, uint256 minLockPeriod);
    event PolicyPurchased(address indexed borrower, uint256 indexed policyId, uint256 indexed loanId, uint256 premium, uint256 coverageAmount);
    event LiquidationRecorded(address indexed borrower, uint256 indexed loanId, uint256 lossAmount);
    event PolicyClaimed(address indexed borrower, uint256 indexed policyId, uint256 payoutAmount);

    constructor(address nft, address pool, address oracle) {
        require(nft != address(0) && pool != address(0) && oracle != address(0), "Invalid address");
        insuranceNFT = InsuranceNFT(nft);
        insurancePool = InsurancePool(pool);
        riskOracle = RiskOracle(oracle);
    }

    function setLiquidationEngine(address engine) external onlyOwner {
        require(engine != address(0), "Invalid engine");
        liquidationEngine = engine;
        emit LiquidationEngineUpdated(engine);
    }

    function setCoverageParams(uint256 _coverageFactorBps, uint256 _maxCoverageBps, uint256 _minLockPeriod) external onlyOwner {
        require(_coverageFactorBps <= 10000, "Invalid coverage factor");
        require(_maxCoverageBps <= 10000, "Invalid max coverage");

        coverageFactorBps = _coverageFactorBps;
        maxCoverageBps = _maxCoverageBps;
        minLockPeriod = _minLockPeriod;

        emit CoverageParamsUpdated(_coverageFactorBps, _maxCoverageBps, _minLockPeriod);
    }

    function quotePremium(address borrower, uint256 loanId, uint256 coverageAmount) public view returns (uint256 premium, uint256 riskBps) {
        require(borrower != address(0), "Invalid borrower");
        require(coverageAmount > 0, "Invalid coverage");

        riskBps = riskOracle.getRiskBps(borrower, loanId);
        require(riskBps > 0, "Risk unavailable");

        premium = (coverageAmount * riskBps * coverageFactorBps) / 100000000;
        if (premium == 0) {
            premium = 1;
        }
    }

    function buyPolicy(uint256 loanId, uint256 loanAmount, uint256 coverageAmount, uint256 duration) external returns (uint256 policyId, uint256 premium) {
        require(duration >= minLockPeriod, "Duration too short");
        require(coverageAmount > 0, "Coverage required");
        require(loanAmount > 0, "Loan amount required");

        uint256 maxCoverage = (loanAmount * maxCoverageBps) / 10000;
        require(coverageAmount <= maxCoverage, "Coverage exceeds cap");

        uint256 riskBps;
        (premium, riskBps) = quotePremium(msg.sender, loanId, coverageAmount);

        insurancePool.collectPremium(msg.sender, premium);

        uint256 expiry = block.timestamp + duration;
        policyId = insuranceNFT.mintPolicy(
            msg.sender,
            loanId,
            coverageAmount,
            premium,
            riskBps,
            expiry
        );

        emit PolicyPurchased(msg.sender, policyId, loanId, premium, coverageAmount);
    }

    function recordLiquidation(address borrower, uint256 loanId, uint256 lossAmount) external {
        require(msg.sender == liquidationEngine || msg.sender == owner(), "Unauthorized caller");
        require(borrower != address(0), "Invalid borrower");
        require(lossAmount > 0, "Invalid loss");

        bytes32 key = keccak256(abi.encodePacked(borrower, loanId));
        recordedLiquidationLoss[key] = lossAmount;

        emit LiquidationRecorded(borrower, loanId, lossAmount);
    }

    function claimPolicy(uint256 policyId) external returns (uint256 payoutAmount) {
        require(insuranceNFT.ownerOf(policyId) == msg.sender, "Not policy owner");

        InsuranceNFT.Policy memory policy = insuranceNFT.getPolicy(policyId);
        require(policy.isActive, "Policy inactive");
        require(!policy.isClaimed, "Already claimed");
        require(block.timestamp <= policy.expiry, "Policy expired");

        bytes32 key = keccak256(abi.encodePacked(policy.borrower, policy.loanId));
        uint256 lossAmount = recordedLiquidationLoss[key];
        require(lossAmount > 0, "No liquidation record");

        payoutAmount = lossAmount;
        if (payoutAmount > policy.coverageAmount) {
            payoutAmount = policy.coverageAmount;
        }

        insuranceNFT.markPolicyClaimed(policyId);
        insurancePool.payoutClaim(msg.sender, payoutAmount);

        delete recordedLiquidationLoss[key];

        emit PolicyClaimed(msg.sender, policyId, payoutAmount);
    }
}
