# 🚀 Vercel Deployment Guide

Deploy Smart Collateral BNPL to Vercel for public access.

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Repository**: Code must be pushed to GitHub
3. **BNB Testnet tBNB**: Get from https://testnet.bnbchain.org/faucet-smart
4. **MetaMask**: Configured for BNB Testnet

---

## Step 1: Deploy Contracts to BNB Testnet

### 1.1 Configure Hardhat for BNB Testnet

Check `hardhat.config.js` has BNB testnet configuration:

```javascript
networks: {
  bnbTestnet: {
    url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
    chainId: 97,
    accounts: [process.env.PRIVATE_KEY],
  }
}
```

### 1.2 Set Up Your Private Key

```bash
# Create .env file in project root
echo 'PRIVATE_KEY=your_private_key_here' > .env
```

**⚠️ Security Warning**: 
- Never commit `.env` to git
- Use a dedicated testnet wallet
- This wallet only needs testnet tBNB (no real value)

### 1.3 Get Testnet BNB

1. Go to: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request tBNB (you need ~0.5 tBNB for deployment)
4. Wait 1-2 minutes for confirmation

### 1.4 Deploy Contracts

```bash
# From project root
npx hardhat run scripts/deploy-testnet.js --network bnbTestnet
```

**Expected Output:**
```
🚀 Deploying Smart Collateral System to BNB Testnet...
📍 Deploying from account: 0x...
💰 Account balance: 0.5 tBNB

0️⃣ Deploying MockUSDT...
✅ MockUSDT deployed to: 0x...
1️⃣ Deploying PriceOracle...
✅ PriceOracle deployed to: 0x...
...
✅ All contracts deployed successfully!
```

### 1.5 Save Contract Addresses

The script creates `deployment-testnet.json` with all contract addresses. You'll need these for Vercel.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2.2 Import Project to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Connect your GitHub account
4. Select your repository: `PunithNS-pixel/MetaMask`
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `smart-collateral-bnpl/smart-collateral-system/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

**Option B: Via CLI**

```bash
cd frontend/
vercel
```

### 2.3 Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```env
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_VAULT_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_LIQUIDATION_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_LENDING_POOL_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_ORACLE_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_MOCK_USDT_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_RISK_ORACLE_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_INSURANCE_NFT_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_INSURANCE_POOL_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_INSURANCE_MANAGER_ADDRESS=<from deployment-testnet.json>
NEXT_PUBLIC_DYNAMIC_VALIDATOR_ADDRESS=<from deployment-testnet.json>
```

**💡 Tip**: Use the helper script to generate these:

```bash
node scripts/generate-vercel-env.js
```

This creates a `.env.vercel` file you can copy-paste.

### 2.4 Deploy

Click "Deploy" in Vercel Dashboard or run:

```bash
vercel --prod
```

### 2.5 Get Your Public URL

After deployment completes:
- Production URL: `https://your-project.vercel.app`
- Share this URL with anyone!

---

## Step 3: Test Public Deployment

### 3.1 Configure MetaMask for BNB Testnet

Guide users to add BNB Testnet to MetaMask:

**Network Details:**
- Network Name: BNB Smart Chain Testnet
- RPC URL: https://data-seed-prebsc-1-s1.bnbchain.org:8545
- Chain ID: 97
- Symbol: tBNB
- Block Explorer: https://testnet.bscscan.com

### 3.2 Test the Dapp

1. Open your Vercel URL
2. Click "Connect Wallet"
3. Switch to BNB Testnet in MetaMask
4. Try depositing collateral (get test USDT from your deployed contract)
5. View Smart Risk Engine display
6. Test borrow/repay operations

---

## Automated Deployment Script

For convenience, use the automated script:

```bash
# Deploy everything in one command
npm run deploy:public
```

This script:
1. ✅ Checks for testnet tBNB balance
2. ✅ Deploys all contracts to BNB testnet
3. ✅ Generates Vercel environment variables
4. ✅ Creates deployment guide with your contract addresses

---

## Troubleshooting

### Contract Deployment Fails

**Error**: `Insufficient balance`
- **Solution**: Get more tBNB from the faucet

**Error**: `nonce has already been used`
- **Solution**: Wait 30 seconds and try again, or reset account nonce

### Vercel Build Fails

**Error**: `Module not found`
- **Solution**: Ensure all dependencies are in `package.json`
- Run `npm install` locally first to verify

**Error**: `Environment variable not found`
- **Solution**: Double-check all `NEXT_PUBLIC_` variables are set in Vercel

### Frontend Shows 0.0000 Values

**Issue**: Data not loading
- **Solution**: 
  1. Check browser console for errors
  2. Verify contract addresses in Vercel env vars
  3. Ensure MetaMask is on BNB Testnet (Chain ID 97)
  4. Check BscScan to confirm contracts are deployed

### MetaMask Connection Issues

**Issue**: "Wrong Network" error
- **Solution**: Add BNB Testnet to MetaMask (see Step 3.1)

**Issue**: Wallet won't connect
- **Solution**: 
  1. Refresh page
  2. Disconnect wallet in MetaMask
  3. Reconnect on the site

---

## Post-Deployment Checklist

- [ ] Contracts deployed to BNB testnet
- [ ] Contract addresses saved in `deployment-testnet.json`
- [ ] All environment variables configured in Vercel
- [ ] Frontend deployed and accessible via public URL
- [ ] MetaMask connected to BNB testnet
- [ ] Test deposit operation works
- [ ] Smart Risk Engine displays correctly
- [ ] Borrow/Repay operations functional
- [ ] Share URL with team/users

---

## Maintenance

### Update Contracts

If you need to redeploy contracts:

```bash
# Redeploy to testnet
npx hardhat run scripts/deploy-testnet.js --network bnbTestnet

# Update Vercel env vars with new addresses
# Trigger new deployment in Vercel
```

### Update Frontend

Push changes to GitHub - Vercel auto-deploys:

```bash
git add .
git commit -m "Update frontend feature"
git push
```

### Monitor Deployment

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Build Logs**: Check for errors
- **Analytics**: Monitor usage
- **BscScan**: https://testnet.bscscan.com

---

## Production Deployment (Mainnet)

⚠️ **For real mainnet deployment:**

1. Deploy contracts to BNB Mainnet (Chain ID: 56)
2. Use production RPC: https://bsc-dataseed.bnbchain.org
3. Audit contracts thoroughly before mainnet
4. Use a hardware wallet
5. Set up monitoring and alerts
6. Have emergency pause mechanisms tested

**Mainnet deployment requires:**
- Real BNB for gas fees (~0.5 BNB)
- Smart contract audit
- Security review
- Insurance reserve funding
- Governance mechanisms
- Legal compliance review

---

## Alternative Deployment Platforms

If Vercel doesn't work, try these:

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Render
1. Connect GitHub repo
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/.next`

### Railway
```bash
npm install -g railway
railway up
```

---

## Cost Estimate

**BNB Testnet (Free)**
- Contract deployment: ~0.3 tBNB (free testnet tokens)
- Transactions: ~0.0001 tBNB each (free)

**Vercel (Free Tier)**
- Bandwidth: 100GB/month
- Builds: Unlimited
- Perfect for testing/demo

**Production Costs** (if scaling):
- Vercel Pro: $20/month
- BNB Mainnet gas: Variable based on usage

---

## Support

- **Documentation**: See project README.md
- **Issues**: GitHub Issues
- **Testnet Explorer**: https://testnet.bscscan.com
- **Vercel Docs**: https://vercel.com/docs

**Deployment Status**: ✅ Ready for public access!
