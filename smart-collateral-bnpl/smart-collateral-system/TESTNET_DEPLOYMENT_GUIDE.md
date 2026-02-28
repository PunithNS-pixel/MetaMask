# 🚀 BNB Testnet Deployment Guide

This guide will help you deploy your Smart Collateral BNPL system to BNB Testnet (tBNB).

## ⚡ Quick Start (5 minutes)

### Step 1: Get a Test Wallet

1. Open MetaMask
2. Click your profile icon → **Create Account** or **Add Account**
3. Name it: `BNB Testnet Demo`
4. Copy the address (will look like `0x1234...`)

### Step 2: Add BNB Testnet to MetaMask

Click "Add Network" in MetaMask and enter:

```
Network Name: BNB Smart Chain Testnet
RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
Chain ID: 97
Currency Symbol: tBNB
Block Explorer: https://testnet.bscscan.com
```

### Step 3: Get Test tBNB (Free)

1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Paste your address
3. Click "Give me BNB"
4. Wait 1-2 minutes
5. Check MetaMask - you should see 0.5-1 tBNB

### Step 4: Export Your Private Key (ONLY FOR TESTNET!)

⚠️ **WARNING: Only do this with a test account that has NO real funds!**

1. In MetaMask, click the 3 dots next to your test account
2. Click "Account Details"
3. Click "Show Private Key"
4. Enter your MetaMask password
5. Click "Confirm"
6. Copy the private key (64 hex characters, starts with 0x or not)

### Step 5: Update .env File

Open `.env` file in `smart-collateral-system/` folder:

```bash
# Replace YOUR_PRIVATE_KEY with the private key you copied
PRIVATE_KEY=your_64_character_private_key_here
```

**Important:** Remove the `0x` prefix if it's there!

Example:
```
PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Step 6: Deploy to Testnet

```bash
cd /Users/punithns/Desktop/BNB/smart-collateral-bnpl/smart-collateral-system
npx hardhat run scripts/deploy-testnet.js --network bnb_testnet
```

This will:
- ✅ Deploy all 11 smart contracts to BNB Testnet
- ✅ Configure the Smart Risk Prediction Engine
- ✅ Set up test assets (ETH, BNB, MEME) with risk levels
- ✅ Fund the insurance pool
- ✅ Update frontend/.env.local automatically
- ✅ Save deployment info to `deployment-info-testnet.json`

### Step 7: Run Frontend with Testnet

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 and connect MetaMask (make sure you're on BNB Testnet!)

## 📊 What You'll See

After deployment, your **Smart Risk Prediction Engine** will show:

- 🟢 **ETH**: 8% liquidation risk, 140% collateral required (GREEN)
- 🟡 **BNB**: 12% liquidation risk, 160% collateral required (YELLOW)  
- 🔴 **MEME**: 35% liquidation risk, 220% collateral required (RED)

## 🔍 Verify on Block Explorer

All transactions are visible at:
https://testnet.bscscan.com

Search for your deployer address to see all deployed contracts!

## 🛠️ Troubleshooting

### "Insufficient balance" error
- You need at least 0.1 tBNB
- Visit the faucet again: https://testnet.bnbchain.org/faucet-smart

### "Invalid private key" error
- Make sure you removed the `0x` prefix
- Private key should be exactly 64 hexadecimal characters
- Use a **testnet-only** account

### Frontend shows "Wrong Network"
- Switch MetaMask to BNB Testnet (Chain ID: 97)
- Refresh the page

### Smart Risk Engine not loading
- Make sure contracts are deployed
- Check that frontend/.env.local has the correct addresses
- Restart the frontend: `npm run dev`

## 🎯 Demo Mode (For Presentations)

Your system is now live on testnet! You can:

1. **Show judges live transactions** on BSCScan
2. **Connect any MetaMask wallet** to test
3. **Demonstrate Smart Risk Engine** with real on-chain data
4. **Prove it's not just a UI mockup** - everything is verifiable on-chain

## 🔐 Security Reminders

- ✅ ONLY use test accounts for testnet
- ✅ NEVER put real funds in a testnet account
- ✅ NEVER commit your `.env` file to GitHub
- ✅ This private key is ONLY for BNB Testnet, not mainnet

## 📝 What Gets Deployed

1. **MockUSDT** - Test USDC token
2. **PriceOracle** - Mock price feeds
3. **SmartCollateralVault** - Main vault contract
4. **LiquidationEngine** - Handles liquidations
5. **RiskController** - Risk management
6. **BNPLLendingPool** - Lending logic
7. **RiskOracle** - Risk scoring system
8. **InsuranceNFT** - NFT-based insurance policies
9. **InsurancePool** - Insurance liquidity pool
10. **InsuranceManager** - Insurance orchestration
11. **DynamicCollateralValidator** - ⚡ **Smart Risk Prediction Engine**

---

## 🚀 Ready to Deploy?

Run this command:

```bash
cd /Users/punithns/Desktop/BNB/smart-collateral-bnpl/smart-collateral-system
npx hardhat run scripts/deploy-testnet.js --network bnb_testnet
```

🎉 Your system will be live on BNB Testnet in ~2-3 minutes!
