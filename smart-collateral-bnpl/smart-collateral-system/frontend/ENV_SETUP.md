# Frontend Environment Setup

## Overview

The frontend requires contract addresses to interact with the blockchain. These addresses must be configured in the `.env.local` file.

## Configuration

### 1. Create `.env.local` in the `frontend/` directory

The `.env.local` file should contain the following environment variables:

```env
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_VAULT_ADDRESS=<SmartCollateralVault address>
NEXT_PUBLIC_LIQUIDATION_ADDRESS=<LiquidationEngine address>
NEXT_PUBLIC_LENDING_POOL_ADDRESS=<BNPLLendingPool address>
NEXT_PUBLIC_ORACLE_ADDRESS=<PriceOracle address>
NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS=<RiskController address>
NEXT_PUBLIC_MOCK_USDT_ADDRESS=<MockUSDT address>
NEXT_PUBLIC_RISK_ORACLE_ADDRESS=<RiskOracle address>
NEXT_PUBLIC_INSURANCE_NFT_ADDRESS=<InsuranceNFT address>
NEXT_PUBLIC_INSURANCE_POOL_ADDRESS=<InsurancePool address>
NEXT_PUBLIC_INSURANCE_MANAGER_ADDRESS=<InsuranceManager address>
NEXT_PUBLIC_DYNAMIC_VALIDATOR_ADDRESS=<DynamicCollateralValidator address>
```

### 2. Getting the Contract Addresses

**From Local Deployment:**
After running the Hardhat node and deploying contracts, check the `deployment-info.json` file in the project root. It contains all newly deployed contract addresses.

**For Localhost (Hardhat):**
```json
{
  "network": "localhost",
  "contracts": {
    "mockUSDT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "priceOracle": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "vault": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    // ... other contracts
  }
}
```

**For BNB Testnet:**
Update the addresses after deploying to testnet using the deployment scripts.

### 3. Docker Configuration

The Docker Compose setup mounts `.env.local` into the container:

```yaml
frontend:
  volumes:
    - ./frontend/.env.local:/app/.env.local:ro
```

This means:
- The `.env.local` file is read-only (`:ro`) in the container
- Changes to `.env.local` require rebuilding the Docker container
- The container has access to all environment variables defined there

### 4. Troubleshooting

If data is showing as `0.0000` or the Smart Risk Engine is not updating:

1. **Check Contract Addresses:**
   - Open the browser's Developer Console (F12)
   - Look for logs like: `Vault contract created: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
   - Compare with addresses in `deployment-info.json`

2. **Check Fetch Conditions:**
   - Look for: `Fetch conditions not met: { signer, account, isCorrectNetwork, ... }`
   - Ensure MetaMask is connected
   - Ensure you're on the correct network (Chain ID 31337 for localhost, 97 for BNB Testnet)

3. **Rebuild Docker:**
   ```bash
   docker-compose up -d --build frontend
   ```

4. **Check Logs:**
   ```bash
   docker logs smart-collateral-frontend --tail 50
   ```

### 5. RPC Configuration

The frontend connects to the blockchain via the RPC URL, which is configured separately:

**Docker Environment Variables (from docker-compose.yml):**
```yaml
environment:
  - NEXT_PUBLIC_CHAIN_ID=31337
  - NEXT_PUBLIC_RPC_URL=http://blockchain:8545
```

**For external networks, configure in Web3Provider:**
The `Web3Provider.tsx` file handles wallet connection and uses the injected provider (MetaMask).

## Data Fetching Flow

1. **Initial Load:**
   - Component mounts
   - `fetchUserStats()` is called if wallet is connected and on correct network
   - Contract calls are made to fetch: collateral balance, borrowed amount, health factor, etc.

2. **After Transactions:**
   - Transaction handlers (handleDeposit, handleBorrow, etc.) call `fetchUserStats()` after tx confirmation
   - Data should update dynamically in the UI

3. **Smart Risk Engine:**
   - `DynamicRiskDisplay.tsx` fetches risk data for assets
   - Updates when component mounts or when connection changes
   - Displays as color-coded badges (GREEN/YELLOW/RED)

## Key Files

- `frontend/.env.local` - Environment variables (not tracked in git)
- `frontend/src/lib/contracts.ts` - Contract initialization and helpers
- `frontend/src/app/components/VaultOperations.tsx` - Vault data fetching
- `frontend/src/app/components/DynamicRiskDisplay.tsx` - Smart Risk Engine
- `deployment-info.json` - Current deployment contract addresses
