# Smart Collateral System - Technical Specification

## 1. System Overview

The Smart Collateral for Web3 Credit & BNPL system is a decentralized lending platform that enables users to:
- Deposit crypto assets as collateral
- Borrow stablecoins against collateral
- Repay loans with flexible installment payments (BNPL)
- Enable liquidators to maintain system health

## 2. Core Components

### 2.1 SmartCollateralVault

**Purpose**: Manage user collateral deposits and borrows

**Key State Variables**:
```solidity
mapping(address => mapping(address => uint256)) collateralDeposits
mapping(address => mapping(address => uint256)) borrowedAmount
uint256 minCollateralRatio = 15000 (150%)
uint256 liquidationThreshold = 12000 (120%)
uint256 liquidationBonus = 1000 (10%)
```

**Critical Functions**:

1. **depositCollateral(address token, uint256 amount)**
   - Accepts ERC20 token as collateral
   - Updates user's collateral balance
   - Emits `CollateralDeposited` event

2. **borrow(address collateralToken, address borrowToken, uint256 amount)**
   - Checks collateral is available
   - Verifies health factor ≥ 150%
   - Transfers borrowed tokens to user
   - Requires: collateral value ≥ borrow amount × 1.5

3. **withdrawCollateral(address token, uint256 amount)**
   - Reduces collateral balance
   - Checks health factor remains ≥ 150%
   - Transfers tokens back to user

4. **repay(address borrowToken, uint256 amount)**
   - Accepts repayment from borrower
   - Reduces debt tracking
   - Burns repaid tokens

**Health Factor Calculation**:
```
Health Factor = (Collateral Value / Total Debt) × 100

Safe:           HF ≥ 150%
At Risk:    120% ≤ HF < 150%
Liquidatable:   HF < 120%
```

### 2.2 LiquidationEngine

**Purpose**: Monitor and execute liquidations of undercollateralized positions

**Key Features**:

1. **Partial Liquidations** (Most Common)
   - Liquidator repays X amount of debt
   - Receives X amount + 10% bonus collateral
   - Position becomes safer after liquidation
   - User retains remaining collateral

2. **Full Liquidations** (Emergency Only)
   - Used when position is severely undercollateralized
   - All collateral liquidated
   - Debt fully repaid

3. **Liquidation Flow**:
```
1. Monitor: Health Factor < 120%
2. Check: Cooldown (1 hour minimum between liquidations)
3. Calculate: Amount to liquidate based on debt/collateral
4. Execute:
   - Liquidator transfers repayment
   - Vault acknowledges debt reduction
   - Liquidator receives collateral + bonus
5. Verify: Position either healthy or fully liquidated
```

**Economic Incentives**:
```
Liquidator Profit = (Collateral Bonus) - (Gas Fees)
- 10% bonus incentivizes liquidators
- Acts as market maker for collateral
- Protects borrowers through partial liquidation
```

### 2.3 BNPLLendingPool

**Purpose**: Manage lending pool and collectstallment-based loans

**Two Types of Users**:

1. **Liquidity Providers**
   - Deposit tokens
   - Earn interest from borrowers
   - Receive LP tokens
   - Can withdraw anytime (if liquidity available)

2. **Borrowers**
   - Take BNPL loans
   - Receive full amount upfront
   - Repay in fixed installments
   - Monthly payment deadlines

**Interest Rate Model**:
```
Formula: Base Rate + (Utilization % × Multiplier)

Where:
- Base Rate = 5% APY
- Multiplier = 20% per 100% utilization
- Utilization = Total Borrowed / Total Liquidity

Examples:
- 30% utilization → 5% + (30% × 20%) = 11% APY
- 60% utilization → 5% + (60% × 20%) = 17% APY
- 90% utilization → 5% + (90% × 20%) = 23% APY
```

**Installment Logic**:
```solidity
struct Installment {
    uint256 loanAmount;          // Original borrowed amount
    uint256 installmentAmount;   // Fixed payment per period
    uint256 nextPaymentDue;      // Exact timestamp
    uint256 installmentsPaid;    // Payments received
    uint256 totalInstallments;   // Total periods (6/12/24)
    bool isActive;               // Loan status
}
```

### 2.4 PriceOracle

**Purpose**: Provide real-time price feeds for collateral valuation

**Data Sources**:
```
Primary: Chainlink Aggregators
- Mainnet: Decentralized network
- Testnet: Chainlink test aggregators

Fallback: Admin-set prices
- For testing/development
- Emergency fallback
```

**Price Discovery Process**:
```
1. Query: Chainlink aggregator latest round
2. Validate:
   - Price > 0
   - Timestamp within 1 hour
   - Sufficient rounds confirmed
3. Return: Price with 8 decimals
4. Fallback: If stale, use admin price if available
```

**Supported Chains**:
- BNB Mainnet
- BNB Testnet
- Ethereum
- Polygon

### 2.5 RiskController

**Purpose**: Centralized risk management and monitoring

**Functions**:

1. **Per-Token Parameters**:
```solidity
struct CollateralParams {
    uint256 collateralFactor;    // Max LTV (70% typical)
    uint256 liquidationFactor;   // Liquidation multiplier
    uint256 maxBorrowLimit;      // Protocol-wide limit
    bool isActive;
}
```

2. **Account Liquidity Calculation**:
```
Available Borrow = (Collateral Value × Collateral Factor) - Current Debt

Example:
- Collateral: $100,000 BNB
- Collateral Factor: 70%
- Max Borrow: $70,000
- Current Debt: $30,000
- Available: $40,000
```

3. **Risk Levels**:
```
Level 0: Safe (HF ≥ 150%)
Level 1: Warning (150% > HF ≥ 120%)
Level 2: Danger (120% > HF ≥ 110%)
Level 3: Critical (HF < 110%)
```

## 3. Smart Contract Interactions

### Typical Borrow Flow:

```
User
  ├─ Calls: depositCollateral(BNB, 2 BTC)
  │  └─ SmartCollateralVault: Records 2 BNB locked
  │
  ├─ Calls: borrow(BNB, USDT, 1000)
  │  └─ SmartCollateralVault:
  │     ├─ Checks: collateral exists
  │     ├─ Calculates health factor
  │     ├─ Verifies: HF ≥ 150%
  │     └─ Transfers USDT to user
  │
  ├─ Calls: initiateBNPLLoan(1000, 12)
  │  └─ BNPLLendingPool:
  │     ├─ Calculates interest
  │     ├─ Total repay = 1050 (5% interest)
  │     ├─ Monthly = 87.5 USDT
  │     └─ Creates installment
  │
  └─ No further action needed
     (Until liquidation risk or payment due)
```

### Liquidation Flow:

```
Liquidator (Bot or Manual)
  ├─ Calls: canLiquidate(borrower)
  │  └─ LiquidationEngine: Returns true/false
  │
  ├─ Calls: liquidatePartial(borrower, BNB, USDT, 500)
  │  └─ LiquidationEngine:
  │     ├─ Checks: Position < 120% HF
  │     ├─ Transfers: 500 USDT from liquidator
  │     ├─ Debits: 500 USDT from borrower's account
  │     ├─ Transfers: ~500 BNB + 50 BNB bonus to liquidator
  │     └─ Emits: PartialLiquidation event
  │
  └─ Liquidator Profit: 50 BNB (10% bonus)
```

## 4. Security Considerations

### 4.1 Attack Vectors Mitigated

| Attack | Mitigation |
|--------|-----------|
| Reentrancy | ReentrancyGuard on state changes |
| Flash Loans | Cooldown between liquidations |
| Price Manipulation | Chainlink + staleness checks |
| Undercollateralized Borrows | Health factor checks |
| Liquidation Sandwich | Brief liquidation cooldown |
| Admin Abuse | Timelock contract (production) |

### 4.2 Assumptions

1. **Chainlink Price Feeds**
   - Assumed reliable and maintained
   - Fallback to admin prices during outages
   - Timestamp checks enforce freshness

2. **ERC20 Token Behavior**
   - Standard transfer/transferFrom
   - No fee-on-transfer tokens (initially)
   - Non-rebasing tokens

3. **Oracle Data**
   - 8 decimal standard
   - Prices > 0
   - Updated within 1 hour

## 5. Gas Optimization

### Optimized Operations:

1. **Batch Operations**:
   - Deposit + Borrow in one transaction
   - Multiple repayments
   - Liquidate multiple positions

2. **Storage Decisions**:
   - Mapping-based storage (cheap reads)
   - Event logging for off-chain indexing
   - Minimal data duplication

3. **Function Efficiency**:
   ```
   Estimated Gas Costs:
   - depositCollateral:  70,000 gas
   - borrow:            150,000 gas
   - repay:              90,000 gas
   - liquidate:         200,000 gas
   ```

## 6. Testing Strategy

### Test Categories:

1. **Unit Tests**
   - Individual function behavior
   - Edge cases
   - Input validation

2. **Integration Tests**
   - Cross-contract interactions
   - Complex scenario flows
   - Event emissions

3. **Scenario Tests**
   - Liquidation cascades
   - Price crashes
   - High utilization

4. **Security Tests**
   - Reentrancy attempts
   - Overflow/underflow
   - Authorization bypasses

## 7. Deployment Checklist

- [ ] Code audit completed
- [ ] 100% test coverage achieved
- [ ] Testnet deployment verified
- [ ] Mainnet parameters configured
- [ ] Price feeds verified
- [ ] Governance setup (if applicable)
- [ ] Liquidation bot ready
- [ ] Insurance purchased
- [ ] Monitoring systems active
- [ ] Documentation complete

## 8. Future Enhancements

### Phase 2:
- Multi-collateral support optimization
- NFT collateral integration
- Yield farming integration

### Phase 3:
- DAO governance
- Yield optimization
- Cross-chain bridges
- Options/futures

### Phase 4:
- Advanced risk models
- Insurance protocol
- Derivatives market

## 9. References & Sources

**Merged Codebases**:
1. **Compound Finance**
   - Risk model architecture
   - Comptroller pattern
   - Interest rate calculation

2. **Lenfi**
   - Liquidation engine design
   - Partial liquidation logic
   - Health factor tracking

3. **Kelo BNPL**
   - Installment payment mechanism
   - BNPL loan structure
   - Payment scheduling

4. **EdelPay**
   - Multi-token collateral vaults
   - Secure transfer patterns
   - Emergency withdrawal

5. **Lever Fi**
   - Interest rate models
   - Utilization-based dynamics
   - Position management

6. **NFT Collateral Protocols**
   - Multi-faceted architecture
   - Layered abstraction
   - Complex collateral handling

---

**Last Updated**: February 27, 2026
**Version**: 1.0.0
**Status**: Production-Ready (Pending Audit)
