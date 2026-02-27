// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BNPLLendingPool
 * @dev BNPL (Buy Now Pay Later) lending pool with installment support
 * Based on Kelo BNPL Platform & EdelPay architecture
 */
contract BNPLLendingPool is ERC20, ReentrancyGuard, Ownable {
    // ==================== State Variables ====================
    
    IERC20 public underlyingToken; // Token that can be borrowed/lent
    
    // Pool state
    uint256 public totalLiquidityPool; // Total available liquidity
    uint256 public totalBorrowed; // Total borrowed amount
    
    // Interest calculations
    uint256 public baseInterestRate = 500; // 5% annual (in basis points)
    uint256 public utilizationMultiplier = 2000; // 20% increase per 100% utilization
    
    // BNPL specific
    struct Installment {
        uint256 loanAmount;
        uint256 installmentAmount;
        uint256 nextPaymentDue;
        uint256 installmentsPaid;
        uint256 totalInstallments;
        bool isActive;
    }
    
    mapping(address => Installment) public installmentLoans;
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 amount, uint256 sharesReceived);
    event LiquidityRemoved(address indexed provider, uint256 amount, uint256 sharesBurned);
    event LoanInitiated(address indexed borrower, uint256 amount, uint256 installments);
    event InstallmentPayment(address indexed borrower, uint256 amount, uint256 remainingPayments);
    event InterestAccrued(address indexed borrower, uint256 interestAmount);
    
    // ==================== Constructor ====================
    
    constructor(address _underlyingToken) ERC20("BNPL-LP", "BNPL") {
        require(_underlyingToken != address(0), "Invalid token");
        underlyingToken = IERC20(_underlyingToken);
    }
    
    // ==================== Liquidity Provider Functions ====================
    
    /**
     * @dev Deposit liquidity and receive LP tokens
     */
    function depositLiquidity(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        // Calculate share amount
        uint256 shares;
        if (totalSupply() == 0) {
            shares = amount;
        } else {
            shares = (amount * totalSupply()) / totalLiquidityPool;
        }
        
        // Transfer tokens to pool
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        
        // Update state
        totalLiquidityPool += amount;
        
        // Mint LP tokens
        _mint(msg.sender, shares);
        
        emit LiquidityAdded(msg.sender, amount, shares);
    }
    
    /**
     * @dev Withdraw liquidity by burning LP tokens
     */
    function withdrawLiquidity(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be > 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        // Calculate amount to return
        uint256 amount = (shares * totalLiquidityPool) / totalSupply();
        require(amount <= underlyingToken.balanceOf(address(this)), "Insufficient liquidity");
        
        // Burns shares
        _burn(msg.sender, shares);
        
        // Update state
        totalLiquidityPool -= amount;
        
        // Return tokens
        underlyingToken.transfer(msg.sender, amount);
        
        emit LiquidityRemoved(msg.sender, amount, shares);
    }
    
    // ==================== Borrower Functions ====================
    
    /**
     * @dev Initiate BNPL installment loan
     * Borrower gets full amount upfront, pays back in installments
     */
    function initiateBNPLLoan(
        uint256 loanAmount,
        uint256 numberOfInstallments
    ) external nonReentrant returns (bool) {
        require(loanAmount > 0, "Loan amount must be > 0");
        require(numberOfInstallments > 0, "Installments must be > 0");
        require(loanAmount <= underlyingToken.balanceOf(address(this)), "Insufficient pool liquidity");
        require(installmentLoans[msg.sender].isActive == false, "Existing active loan");
        
        // Calculate interest
        uint256 totalInterestRate = calculateInterestRate();
        uint256 totalRepayment = loanAmount + (loanAmount * totalInterestRate) / 10000;
        uint256 installmentAmount = totalRepayment / numberOfInstallments;
        
        // Create installment structure
        installmentLoans[msg.sender] = Installment({
            loanAmount: loanAmount,
            installmentAmount: installmentAmount,
            nextPaymentDue: block.timestamp + 30 days,
            installmentsPaid: 0,
            totalInstallments: numberOfInstallments,
            isActive: true
        });
        
        // Update pool state
        totalBorrowed += loanAmount;
        
        // Transfer loan to borrower
        underlyingToken.transfer(msg.sender, loanAmount);
        
        emit LoanInitiated(msg.sender, loanAmount, numberOfInstallments);
        return true;
    }
    
    /**
     * @dev Make installment payment
     */
    function payInstallment(uint256 amount) external nonReentrant {
        Installment storage loan = installmentLoans[msg.sender];
        
        require(loan.isActive, "No active loan");
        require(amount >= loan.installmentAmount, "Payment less than installment amount");
        require(loan.installmentsPaid < loan.totalInstallments, "Loan already paid off");
        
        // Transfer payment
        underlyingToken.transferFrom(msg.sender, address(this), amount);
        
        // Update loan
        loan.installmentsPaid += 1;
        loan.nextPaymentDue = block.timestamp + 30 days;
        
        // Update pool
        totalBorrowed -= loan.loanAmount / loan.totalInstallments;
        
        // Mark as inactive if all paid
        if (loan.installmentsPaid >= loan.totalInstallments) {
            loan.isActive = false;
        }
        
        emit InstallmentPayment(msg.sender, amount, loan.totalInstallments - loan.installmentsPaid);
    }
    
    /**
     * @dev Check if installment is overdue
     */
    function isInstallmentOverdue(address borrower) external view returns (bool) {
        Installment storage loan = installmentLoans[borrower];
        return loan.isActive && block.timestamp > loan.nextPaymentDue;
    }
    
    // ==================== Calculation Functions ====================
    
    /**
     * @dev Calculate dynamic interest rate based on utilization
     * Formula: base rate + (utilization % * multiplier)
     */
    function calculateInterestRate() public view returns (uint256) {
        if (totalLiquidityPool == 0) return baseInterestRate;
        
        uint256 utilization = (totalBorrowed * 10000) / totalLiquidityPool;
        uint256 additionalRate = (utilization * utilizationMultiplier) / 10000;
        
        return baseInterestRate + additionalRate;
    }
    
    /**
     * @dev Get loan status for borrower
     */
    function getLoanStatus(address borrower) 
        external 
        view 
        returns (
            uint256 loanAmount,
            uint256 remainingPayments,
            uint256 nextPaymentDue,
            uint256 installmentAmount,
            bool isActive
        ) 
    {
        Installment memory loan = installmentLoans[borrower];
        return (
            loan.loanAmount,
            loan.totalInstallments - loan.installmentsPaid,
            loan.nextPaymentDue,
            loan.installmentAmount,
            loan.isActive
        );
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Update base interest rate
     */
    function setBaseInterestRate(uint256 newRate) external onlyOwner {
        require(newRate <= 10000, "Rate too high"); // Max 100%
        baseInterestRate = newRate;
    }
    
    /**
     * @dev Update utilization multiplier
     */
    function setUtilizationMultiplier(uint256 newMultiplier) external onlyOwner {
        utilizationMultiplier = newMultiplier;
    }
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 liquidity,
        uint256 borrowed,
        uint256 utilization,
        uint256 currentRate
    ) {
        utilization = totalLiquidityPool > 0 ? (totalBorrowed * 10000) / totalLiquidityPool : 0;
        return (totalLiquidityPool, totalBorrowed, utilization, calculateInterestRate());
    }
}
