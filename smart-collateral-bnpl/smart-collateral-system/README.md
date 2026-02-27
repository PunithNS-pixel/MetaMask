# Smart Collateral for Web3 Credit & BNPL

## 📋 Overview

A comprehensive, production-ready smart contract system for decentralized lending and Buy-Now-Pay-Later (BNPL) on the BNB Chain. This project merges the best patterns from leading DeFi protocols:

- **Compound Finance** - Risk management & collateral ratios
- **Lenfi** - Advanced liquidation engine with partial liquidations
- **Kelo** - BNPL platform architecture
- **EdelPay** - Installment payment mechanisms
- **Lever Fi** - Interest rate models
- **NFT Lending Protocols** - Multi-faceted architecture patterns

## 🎯 Core Concepts

### Smart Collateral
Instead of locking crypto in traditional custody, users deposit collateral directly into smart contracts that:
- Automatically manage collateral
- Enable transparent on-chain borrowing
- Execute liquidations through code (no intermediaries)
- Support partial liquidations for borrower protection

### BNPL (Buy Now Pay Later)
Users can:
- **Get loans immediately** - Receive full amount upfront
- **Pay in installments** - Flexible 6, 12, 24-month plans
- **Interest rates** - Dynamic rates based on pool utilization
- **No credit check** - Collateral-based lending

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Collateral System                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────────┐        │
│  │  User Wallet     │      │  Smart Collateral    │        │
│  │                  │─────▶│  Vault (Core)        │        │
│  │  BNB/USDT/etc    │      │                      │        │
│  └──────────────────┘      │  • Deposits          │        │
│                            │  • Withdrawals       │        │
│                            │  • Borrow Logic      │        │
│                            │  • Health Tracking   │        │
│                            └──────┬───────────────┘        │
│                                   │                         │
│        ┌──────────────────────────┼──────────────────────┐ │
│        │                          │                      │ │
│        ▼                          ▼                      ▼ │
│  ┌──────────────┐      ┌────────────────┐      ┌──────────┐
│  │ Liquidation  │      │  BNPL Lending  │      │  Price   │
│  │ Engine       │      │  Pool          │      │  Oracle  │
│  │              │      │                │      │          │
│  │ • Partial    │      │ • Installments │      │ • Chain  │
│  │   Liquidation│      │ • Interest     │      │   link   │
│  │ • Full Liq   │      │ • Utilization  │      │ • Feeds  │
│  │ • Auctions   │      │                │      │          │
│  └──────────────┘      └────────────────┘      └──────────┘
│        │                       │                     │      │
│        └───────────────────────┼─────────────────────┘      │
│                                │                            │
│                        ┌───────▼────────┐                   │
│                        │ Risk Controller│                   │
│                        │                 │                   │
│                        │ • Health Factor │                   │
│                        │ • LTV Ratios    │                   │
│                        │ • Risk Metrics  │                   │
│                        └─────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Smart Contracts

### 1. SmartCollateralVault.sol
**Core collateral management contract**
- User deposits for collateral
- Borrow against collateral
- Repay loans
- Collateral withdrawal (if health factor allows)

Key Functions:
```solidity
depositCollateral(address token, uint256 amount)      // Lock collateral
borrow(address collateral, address borrowToken, uint256 amount)
repay(address borrowToken, uint256 amount)
withdrawCollateral(address token, uint256 amount)
getHealthFactor(address user) → uint256              // 150% = safe
canBeLiquidated(address user) → bool
```

**Risk Parameters:**
- Min Collateral Ratio: 150% (default)
- Liquidation Threshold: 120%
- Liquidation Bonus: 10%

### 2. LiquidationEngine.sol
**Handles partial & full liquidations**
- Monitors positions for undercollateralization
- Enables liquidators to repay portion of debt
- Returns collateral + bonus to liquidators
- Prevents liquidation spam with cooldown

Key Functions:
```solidity
liquidatePartial(address borrower, address collateral, uint256 amount)
liquidateFull(address borrower, address collateral)
canLiquidate(address account) → bool
```

**Benefits:**
- Borrowers protected from complete liquidation (unless severely undercollateralized)
- Liquidators earn 10% bonus
- Positions become healthy after partial liquidation

### 3. BNPLLendingPool.sol
**BNPL lending with installment payments**
- Liquidity providers earn interest
- Borrowers get BNPL loans
- Dynamic interest rates based on utilization
- 6/12/24-month installment plans

Key Functions:
```solidity
depositLiquidity(uint256 amount)                      // Provide liquidity
initiateBNPLLoan(uint256 loanAmount, uint256 installments)
payInstallment(uint256 amount)
withdrawLiquidity(uint256 shares)
```

**Interest Model:**
```
Interest Rate = Base Rate (5%) + (Utilization × Multiplier)

Example:
- 50% utilization = 5% + (50% × 20%) = 15% APY
- 90% utilization = 5% + (90% × 20%) = 23% APY
```

### 4. PriceOracle.sol
**Chainlink-based price feeds**
- Real-time collateral valuation
- Multi-token price support
- Staleness checks (max 1 hour)
- Fallback prices for testing

Key Functions:
```solidity
getPrice(address token) → uint256
getCollateralValue(address collateral, uint256 amount, address pricingToken)
isPriceFresh(address token) → bool
getPrices(address[] tokens) → uint256[]
```

### 5. RiskController.sol
**Risk management & protocol parameters**
- Sets collateral factors per token
- Monitors system health
- Calculates account liquidity
- Provides stress testing

Key Functions:
```solidity
getAccountLiquidity(address account) → (liquidity, shortfall)
canBorrow(address account, uint256 amount) → bool
isAccountAtRisk(address account) → bool
getStressScenario(address account, uint256 priceDropPercent) → uint256
```

## 🚀 Getting Started

### Prerequisites
```bash
- Node.js >= 16
- npm or yarn
- Hardhat
- OpenZeppelin Contracts
- Chainlink Contracts
```

### Installation

```bash
# 1. Navigate to project
cd /Users/punithns/Desktop/BNB/smart-collateral-bnpl/smart-collateral-system

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# Add your private key:
# PRIVATE_KEY=your_private_key_here
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm test

# With coverage
npm run coverage

# Gas report
REPORT_GAS=true npm test
```

### Deployment

#### BNB Testnet
```bash
npx hardhat run scripts/deploy.js --network bnb_testnet
```

#### BNB Mainnet
```bash
npx hardhat run scripts/deploy.js --network bnb_mainnet
```

## 📊 Example Scenario

**Alice wants to borrow $1,000 USDT using 2 BNB as collateral:**

```
Step 1: Deposit Collateral
├─ Alice deposits 2 BNB (worth $65,000)
├─ Vault records: collateralDeposits[Alice][BNB] = 2 BNB

Step 2: Request Loan
├─ Alice requests $1,000 USDT
├─ Health Factor Check:
│  ├─ Collateral Value = $65,000
│  ├─ Debt = $1,000
│  └─ Health Factor = 6,500% ✅ (way above 150% minimum)
├─ Loan approved, Alice receives $1,000 USDT
└─ Vault records: borrowedAmount[Alice][USDT] = $1,000

Step 3: Monthly Installment Payment
├─ Installment amount = $1,000 / 12 = ~$83.33
├─ Alice pays installment
├─ nextPaymentDue increments
└─ After 12 payments: loan fully repaid, collateral released

Step 4: Collateral Withdrawal
├─ Alice can now withdraw her 2 BNB
└─ Collateral released to her wallet
```

**If BNB price crashes to $20,000 (2 BNB = $40,000):**

```
Step 1: Monitor Health
├─ Collateral Value = $40,000
├─ Debt = $1,000
└─ Health Factor = 4,000% ✅ (still safe, far above 150%)

Note: Position remains healthy even at significant price drops
```

**If Alice starts defaulting and BNB crashes to $5,000 (2 BNB = $10,000):**

```
Step 1: Liquidation Check
├─ Collateral Value = $10,000
├─ Debt = $1,000
└─ Health Factor = 1,000% ✅ (still above 120% threshold)

Step 2: If further drops to $800 (health factor < 120%)
├─ Position eligible for liquidation
├─ Bob (liquidator) calls liquidate()
├─ Bob repays $500 of debt
├─ Bob receives ~$500 collateral + 10% bonus
├─ Alice's remaining collateral secured for remaining debt
```

## 🔐 Security Features

- **ReentrancyGuard** on all state-changing functions
- **Collateral Ratio Checks** before borrowing
- **Health Factor Monitoring** continuous
- **Partial Liquidations** protect borrowers
- **Price Oracle Staleness Checks** prevent stale data
- **Admin Functions Protected** with onlyOwner
- **Flash Loan Resistant Design**

## 📦 Merged Components By Source

| Component | Source | Purpose |
|-----------|--------|---------|
| Risk Model | Compound | Collateral factors, LTV ratios |
| Liquidation | Lenfi | Partial liquidations, health tracking |
| BNPL Structure | Kelo | Installment loans, borrower UX |
| Interest Rates | Lever Fi | Dynamic utilization-based rates |
| Price Feeds | Chainlink | Real-time collateral valuation |
| Vault Pattern | EdelPay | Multi-token collateral management |

## 🧪 Testing Checklist

- [ ] Collateral deposit/withdrawal
- [ ] Borrow function with health checks
- [ ] Repayment logic
- [ ] Partial liquidations
- [ ] Full liquidations
- [ ] Interest rate calculations
- [ ] Installment tracking
- [ ] Price oracle integration
- [ ] Risk parameter updates
- [ ] Stress testing scenarios

## 🚨 Important Notes

**Before Production Deployment:**

1. **Audit**: Get professional smart contract audit
2. **Testing**: 100% code coverage
3. **Testnet**: Deploy to BNB testnet first
4. **Monitoring**: Set up liquidation bots
5. **Insurance**: Consider DeFi insurance
6. **Documentation**: Admin governance procedures

## 📈 Future Enhancements

- [ ] Governance token (DAO)
- [ ] Flash loan integration
- [ ] Multi-token BNPL
- [ ] NFT collateral support
- [ ] Yield farming integration
- [ ] Options/futures support
- [ ] Cross-chain bridges

## 📝 License

MIT

## 🤝 Contributing

Community contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Include tests

## 📞 Support

- Documentation: See TECHNICAL_BRIEF.md
- Issues: GitHub Issues
- Discussion: GitHub Discussions

---

**Built with patterns from Compound Finance, Lenfi, Kelo, EdelPay, Lever Fi, and NFT Lending Protocols. 🚀**
