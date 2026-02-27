// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract InsuranceNFT is ERC721, Ownable {
    struct Policy {
        address borrower;
        uint256 loanId;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 riskBps;
        uint256 startTime;
        uint256 expiry;
        bool isClaimed;
        bool isActive;
    }

    uint256 public nextPolicyId;
    address public manager;

    mapping(uint256 => Policy) private _policies;

    event ManagerUpdated(address indexed manager);
    event PolicyMinted(uint256 indexed policyId, address indexed borrower, uint256 indexed loanId, uint256 coverageAmount, uint256 premiumPaid, uint256 expiry);
    event PolicyClaimed(uint256 indexed policyId, address indexed borrower);
    event PolicyExpired(uint256 indexed policyId);

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager");
        _;
    }

    constructor() ERC721("Liquidation Insurance Policy", "LIP") {}

    function setManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid manager");
        manager = _manager;
        emit ManagerUpdated(_manager);
    }

    function mintPolicy(
        address borrower,
        uint256 loanId,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 riskBps,
        uint256 expiry
    ) external onlyManager returns (uint256 policyId) {
        require(borrower != address(0), "Invalid borrower");
        require(coverageAmount > 0, "Invalid coverage");
        require(expiry > block.timestamp, "Invalid expiry");

        policyId = ++nextPolicyId;
        _safeMint(borrower, policyId);

        _policies[policyId] = Policy({
            borrower: borrower,
            loanId: loanId,
            coverageAmount: coverageAmount,
            premiumPaid: premiumPaid,
            riskBps: riskBps,
            startTime: block.timestamp,
            expiry: expiry,
            isClaimed: false,
            isActive: true
        });

        emit PolicyMinted(policyId, borrower, loanId, coverageAmount, premiumPaid, expiry);
    }

    function markPolicyClaimed(uint256 policyId) external onlyManager {
        Policy storage policy = _policies[policyId];
        require(policy.isActive, "Policy inactive");
        require(!policy.isClaimed, "Already claimed");

        policy.isClaimed = true;
        policy.isActive = false;

        emit PolicyClaimed(policyId, policy.borrower);
    }

    function markPolicyExpired(uint256 policyId) external onlyManager {
        Policy storage policy = _policies[policyId];
        require(policy.isActive, "Policy inactive");
        require(block.timestamp > policy.expiry, "Not expired");

        policy.isActive = false;
        emit PolicyExpired(policyId);
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return _policies[policyId];
    }

    function isPolicyActive(uint256 policyId) external view returns (bool) {
        Policy memory policy = _policies[policyId];
        return policy.isActive && !policy.isClaimed && block.timestamp <= policy.expiry;
    }
}
