# 🚀 Smart Collateral BNPL dApp - Running Status

## ✅ System Status

### Backend (Blockchain)
- **Hardhat Node**: ✅ Running on `http://localhost:8545`
- **Deployed Contracts**: ✅ All 6 contracts deployed successfully
- **Network**: Local Hardhat (ChainId: 31337)

### Frontend (Web Application)
- **Next.js Dev Server**: ✅ Running on `http://localhost:3000`
- **TypeScript Errors**: ✅ All fixed
- **Contract Integration**: ✅ Configured with deployed addresses

---

## 📋 Deployed Contract Addresses

```
MockUSDT:              0x5FbDB2315678afecb367f032d93F642f64180aa3
PriceOracle:           0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
SmartCollateralVault:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
LiquidationEngine:     0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
RiskController:        0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
BNPLLendingPool:       0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

---

## 🔧 How to Use the dApp

### Step 1: Configure MetaMask for Local Network

1. Open MetaMask
2. Click on the network dropdown (top center)
3. Click "Add Network" → "Add a network manually"
4. Enter these details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
5. Click "Save"

### Step 2: Import Test Account (with 10,000 ETH)

1. In MetaMask, click the account icon (top right)
2. Select "Import Account"
3. Paste this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   ⚠️ **Note**: This is Hardhat's default test account #0 with 10,000 ETH
4. Click "Import"

### Step 3: Access the dApp

1. Open your browser
2. Go to: **http://localhost:3000**
3. Click "Connect Wallet" in the top right
4. Approve the MetaMask connection

### Step 4: Test the Features

#### 🏦 Deposit Collateral
1. Go to the "Deposit Collateral" section
2. Enter a token address (use MockUSDT: `0x5FbDB2315678afecb367f032d93F642f64180aa3`)
3. Enter amount (try `100`)
4. Click "Approve Token" first
5. Then click "Deposit Collateral"

#### 💰 Borrow Funds
1. After depositing collateral, go to "Borrow" section
2. Enter borrow amount (up to 70% of collateral value)
3. Click "Borrow" and confirm in MetaMask

#### 💳 Repay Loan
1. Go to "Repay Loan" section
2. Enter repayment amount
3. Approve the stable token (if needed)
4. Click "Repay" and confirm

#### 📤 Withdraw Collateral
1. Ensure your loan is repaid or health factor is safe
2. Go to "Withdraw Collateral" section
3. Enter withdrawal amount
4. Click "Withdraw" and confirm

---

## 📊 Dashboard Features

The dApp shows real-time stats:
- **Collateral Balance**: Your total deposited collateral
- **Borrowed Amount**: Current outstanding loan
- **Health Factor**: Loan safety indicator (>1.5 is safe)
- **Available to Borrow**: Maximum you can borrow based on collateral

---

## 🎨 UI Features

✅ **MetaMask-Inspired Design**: Orange gradient theme  
✅ **Network Detection**: Shows if you're on wrong network  
✅ **Transaction Feedback**: Links to view transactions  
✅ **Real-time Updates**: Balances update after transactions  
✅ **Responsive Layout**: Works on desktop and mobile  

---

## 🔍 Testing Tips

1. **Get Test Tokens**: The MockUSDT contract has a faucet function
   ```javascript
   // In browser console or Hardhat:
   const mockUSDT = await ethers.getContractAt(
     "MockUSDT", 
     "0x5FbDB2315678afecb367f032d93F642f64180aa3"
   );
   await mockUSDT.faucet(); // Get 1000 tokens
   ```

2. **Check Balances**: Use the dashboard to see your positions

3. **Test Liquidation**: Borrow maximum amount, watch health factor

4. **Multiple Accounts**: Import more Hardhat accounts to test peer-to-peer

---

## 🛠️ Development Commands

```bash
# Stop Hardhat node
pkill -f "hardhat node"

# Stop frontend
pkill -f "next dev"

# Restart everything
cd /Users/punithns/Desktop/BNB/smart-collateral-bnpl/smart-collateral-system
npx hardhat node &
npx hardhat run scripts/deploy.js --network localhost
cd frontend && npm run dev
```

---

## 🐛 Troubleshooting

### "Wrong Network" Warning
- Make sure MetaMask is on "Hardhat Local" network (ChainId: 31337)
- The dApp won't work on other networks

### "Connect Your Wallet" Not Working
- Check that MetaMask extension is installed
- Refresh the page and try again

### Transactions Failing
- Ensure you have enough ETH for gas (test account has 10,000)
- Check that contracts are deployed (run deploy script again)

### Can't See Balances
- Make sure you've switched to the imported test account
- Deposit collateral first before borrowing

---

## 📱 Access URLs

- **Frontend**: http://localhost:3000
- **Hardhat Node**: http://localhost:8545
- **Contract Artifacts**: `../artifacts/contracts/`

---

## 🎯 Next Steps

1. Test all 4 operations (deposit, borrow, repay, withdraw)
2. Try with different amounts
3. Monitor the health factor
4. Check transaction history in MetaMask
5. For testnet deployment, see `DEPLOYMENT_STATUS.md`

---

**Status**: 🟢 All systems operational  
**Last Updated**: 2026-02-27  
**Frontend**: http://localhost:3000  
**Backend**: http://localhost:8545  

Enjoy testing your Smart Collateral BNPL system! 🎉
