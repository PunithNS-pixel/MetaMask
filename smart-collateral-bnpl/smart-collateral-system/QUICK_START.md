# 🚀 Quick Start Guide

## Choose Your Setup Method

### 🐳 Docker (Easiest - Recommended)

**Best for:** Quick testing, new users, consistent environment

```bash
# 1. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# 2. Start the project
docker-compose up -d

# 3. Wait 30 seconds, then open:
# http://localhost:3000
```

**That's it!** Everything is configured automatically.

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for details.

---

### 💻 Manual Setup (For Development)

**Best for:** Active development, debugging, customization

#### Prerequisites
- Node.js 18+ installed
- Git installed

#### Steps

```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..

# 2. Compile contracts
npx hardhat compile

# 3. Start Hardhat node (Terminal 1)
npx hardhat node

# 4. Deploy contracts (Terminal 2)
npx hardhat run scripts/deploy.js --network localhost

# 5. Update frontend env (Terminal 2)
# Copy contract addresses from deployment output to frontend/.env.local

# 6. Start frontend (Terminal 3)
cd frontend
npm run dev

# 7. Open http://localhost:3000
```

See [SYSTEM_STATUS.md](SYSTEM_STATUS.md) for details.

---

## Comparison

| Feature | Docker | Manual |
|---------|--------|--------|
| **Setup Time** | 1 minute | 5-10 minutes |
| **Commands** | 1 command | 6+ commands |
| **Auto-deploy** | ✅ Yes | ❌ Manual |
| **Consistency** | ✅ Always works | ⚠️ May vary |
| **Hot Reload** | ❌ Need dev mode | ✅ Built-in |
| **Debugging** | ⚠️ Container logs | ✅ Direct access |
| **Resource Use** | Higher (containers) | Lower (native) |

---

## After Setup

### Connect MetaMask

1. **Network Settings:**
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`

2. **Import Test Account:**
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

3. **Start Testing!**
   - Deposit collateral
   - View risk predictions
   - Borrow assets
   - Test insurance features
## 🔧 Troubleshooting: Data Not Updating?

If vault stats show `0.0000` and don't update after deposits:

### ✅ The Fix (Applied in Latest Version)

The frontend needs contract addresses to fetch data. If addresses are stale, all contract calls return empty data.

**Solution:**
1. Contract addresses are now synced from `deployment-info.json`
2. Frontend `.env.local` must match current deployed addresses
3. When contracts are redeployed, update `.env.local`:
   ```bash
   # Copy addresses from deployment-info.json
   NEXT_PUBLIC_VAULT_ADDRESS=<from deployment-info.json>
   NEXT_PUBLIC_LIQUIDATION_ADDRESS=<from deployment-info.json>
   # ... etc for all contracts
   ```
4. Rebuild frontend:
   ```bash
   docker-compose up -d --build frontend
   ```

### 📋 Verify It's Working

1. **Check deployment addresses:**
   ```bash
   cat deployment-info.json | grep -A 20 '"contracts"'
   ```

2. **Run contract test:**
   ```bash
   node test-contracts.js
   ```
   Should show: `✓ minCollateralRatio`, `✓ Collateral deposits`, etc.

3. **Check browser logs:**
   - Open http://localhost:3000
   - Press F12 for DevTools > Console
   - Connect MetaMask wallet
   - Look for: `Vault contract created: 0x...`
   - Should match deployment-info.json

### 📖 More Details

See [frontend/ENV_SETUP.md](frontend/ENV_SETUP.md) for complete environment setup instructions.

---


---

## Need Help?

- **Docker Issues:** See [DOCKER_SETUP.md](DOCKER_SETUP.md#troubleshooting)
- **Manual Issues:** See [SYSTEM_STATUS.md](SYSTEM_STATUS.md)
- **Features:** See [SMART_RISK_ENGINE_SUMMARY.md](SMART_RISK_ENGINE_SUMMARY.md)
- **Fixes:** See [FIXES_APPLIED.md](FIXES_APPLIED.md)

---

## What's Working

✅ Smart Risk Prediction Engine (ETH/BNB/Meme with color-coded risk)  
✅ Health Factor Display (percentage format)  
✅ Deposit/Borrow/Repay/Withdraw Operations  
✅ Insurance NFT System  
✅ Dynamic Collateral Requirements  

**All systems operational!** 🎉
