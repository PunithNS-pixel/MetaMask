# 🚀 Quick Deploy to Vercel

Deploy Smart Collateral BNPL system to BNB testnet and Vercel in 5 minutes!

## Prerequisites

- [ ] Node.js 16+ installed
- [ ] MetaMask or Web3 wallet
- [ ] Git repository on GitHub

## Deploy in 3 Commands

```bash
# 1. Get testnet BNB (one-time setup)
# Visit: https://testnet.bnbchain.org/faucet-smart
# Request 0.5 tBNB to your wallet address

# 2. Set your private key
echo 'PRIVATE_KEY=your_private_key_here' > .env

# 3. Deploy everything
npm run deploy:public
```

That's it! The script will:
- ✅ Deploy all contracts to BNB testnet
- ✅ Generate Vercel environment variables
- ✅ Test contract deployment
- ✅ Build and verify frontend

## Next: Deploy Frontend to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Connect GitHub and select your repository
3. Configure:
   - **Root Directory**: `smart-collateral-bnpl/smart-collateral-system/frontend`
   - **Framework**: Next.js
4. Add environment variables from `frontend/.env.vercel`
5. Click Deploy

### Option B: Vercel CLI

```bash
# Install CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

## Your Public URL

After deployment:
```
https://your-project.vercel.app
```

Share this with anyone! They just need:
- MetaMask installed
- BNB Testnet configured
- Some tBNB from faucet

## Configure MetaMask for Users

**Network Settings:**
```
Network Name: BNB Smart Chain Testnet
RPC URL: https://data-seed-prebsc-1-s1.bnbchain.org:8545
Chain ID: 97
Symbol: tBNB
Block Explorer: https://testnet.bscscan.com
```

## Test Your Deployment

1. Open your Vercel URL
2. Click "Connect Wallet"
3. Switch to BNB Testnet
4. Click "Get Test USDT" (mints 1000 USDT)
5. Deposit collateral
6. View Smart Risk Engine (should show GREEN/YELLOW/RED badge)
7. Try borrowing against collateral

## Troubleshooting

**Balance Issues?**
```bash
npm run check:balance
```

**Need to regenerate env vars?**
```bash
npm run vercel:env
```

**Redeploy contracts?**
```bash
npx hardhat run scripts/deploy-testnet.js --network bnbTestnet
npm run vercel:env
# Update vars in Vercel dashboard
# Trigger new deployment
```

## Security Notes

⚠️ **This is testnet only**
- No real funds at risk
- tBNB has no value
- Perfect for testing/demos

For mainnet deployment, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

## Full Documentation

- [Complete Deployment Guide](VERCEL_DEPLOYMENT.md)
- [Environment Setup](frontend/ENV_SETUP.md)
- [Project README](README.md)

---

**Need Help?**
- Check [deployment logs](https://vercel.com/dashboard)
- View transactions on [BscScan Testnet](https://testnet.bscscan.com)
- Open GitHub issue

**Deployed Successfully?** 🎉
Drop your URL in GitHub Discussions!
