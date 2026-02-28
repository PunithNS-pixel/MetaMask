# 🐳 Docker Setup Guide

## Quick Start (Easiest Way)

### Prerequisites
- Docker installed ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (included with Docker Desktop)

### One-Command Start
```bash
# Clone or download the project
cd smart-collateral-system

# Start everything with one command
docker-compose up -d

# Wait ~30 seconds for deployment, then open:
# http://localhost:3000
```

### That's it! 🎉

---

## Detailed Instructions

### 1. Build the Docker Images

```bash
# Build both blockchain and frontend images
docker-compose build

# This will:
# - Compile all smart contracts
# - Install all dependencies
# - Build the frontend
# Takes ~5-10 minutes first time
```

### 2. Start the Containers

```bash
# Start in detached mode (runs in background)
docker-compose up -d

# Or start with logs visible
docker-compose up
```

**What happens:**
1. ✅ Hardhat blockchain node starts on port 8545
2. ✅ Smart contracts automatically compile
3. ✅ All 11 contracts deploy automatically
4. ✅ Frontend starts on port 3000
5. ✅ Contract addresses injected into frontend

### 3. Access the Application

**Frontend:** http://localhost:3000

**Blockchain RPC:** http://localhost:8545

**Chain ID:** 31337

### 4. View Logs

```bash
# View all logs
docker-compose logs -f

# View blockchain logs only
docker-compose logs -f blockchain

# View frontend logs only
docker-compose logs -f frontend
```

### 5. Stop the Containers

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## Using the Dockerized Application

### Connect MetaMask

1. **Add Network:**
   - Network Name: `Local Hardhat`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Balance: ~10000 ETH
   ```

3. **Add Mock USDT Token:**
   - Check deployment logs for token address
   - Or check `deployment-info.json` after containers start

### Test the Features

1. **Smart Risk Prediction Engine**
   - View three color-coded risk cards
   - ETH (GREEN), BNB (YELLOW), Meme (RED)

2. **Vault Operations**
   - Deposit collateral
   - Borrow assets
   - Repay loans
   - Withdraw collateral

3. **Insurance Features**
   - Quote insurance premium
   - Buy insurance NFT policy
   - Claim insurance

---

## Docker Commands Cheat Sheet

### Container Management
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View running containers
docker-compose ps

# View logs (live)
docker-compose logs -f

# View logs (last 100 lines)
docker-compose logs --tail=100
```

### Rebuilding
```bash
# Rebuild after code changes
docker-compose build

# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build blockchain
docker-compose build frontend
```

### Accessing Containers
```bash
# Open shell in blockchain container
docker-compose exec blockchain sh

# Open shell in frontend container
docker-compose exec frontend sh

# Run hardhat commands in blockchain container
docker-compose exec blockchain npx hardhat compile
docker-compose exec blockchain npx hardhat test
```

### Cleanup
```bash
# Remove all containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all unused Docker data
docker system prune -a
```

---

## Environment Configuration

### Blockchain Container
Located in `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=development
```

### Frontend Container
Create `frontend/.env.local` for local overrides:
```env
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://blockchain:8545
```

Contract addresses are automatically populated after deployment.

---

## Troubleshooting

### Issue: "Port already in use"
```bash
# Find process using port 8545 or 3000
lsof -i :8545
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
ports:
  - "8546:8545"  # Use 8546 instead of 8545
  - "3001:3000"  # Use 3001 instead of 3000
```

### Issue: "Cannot connect to blockchain"
```bash
# Check blockchain container status
docker-compose ps

# View blockchain logs
docker-compose logs blockchain

# Restart blockchain container
docker-compose restart blockchain
```

### Issue: "Contracts not deployed"
```bash
# Check blockchain logs for deployment status
docker-compose logs blockchain | grep "Deployed"

# Manually trigger deployment
docker-compose exec blockchain npx hardhat run scripts/deploy.js --network localhost
```

### Issue: "Frontend build fails"
```bash
# View frontend logs
docker-compose logs frontend

# Rebuild frontend only
docker-compose build frontend
docker-compose up -d frontend
```

### Issue: "Need fresh start"
```bash
# Complete reset
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Advanced Usage

### Development Mode with Hot Reload

If you want to develop with hot reload:

```bash
# Stop the containers
docker-compose down

# Start with volume mounts for live code updates
docker-compose -f docker-compose.dev.yml up
```

Create `docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  blockchain:
    extends:
      file: docker-compose.yml
      service: blockchain
    volumes:
      - ./contracts:/app/contracts
      - ./scripts:/app/scripts
      - ./artifacts:/app/artifacts
    command: npx hardhat node --hostname 0.0.0.0

  frontend:
    extends:
      file: docker-compose.yml
      service: frontend
    volumes:
      - ./frontend/src:/app/src
      - ./artifacts:/app/artifacts:ro
    command: npm run dev
```

### Custom Network Configuration

To deploy on a different network:

1. Update `docker-compose.yml`:
```yaml
environment:
  - HARDHAT_NETWORK=bnb_testnet
```

2. Rebuild and restart:
```bash
docker-compose up -d --build
```

### Scaling

Not applicable for this setup as blockchain nodes cannot be scaled horizontally. Each instance needs its own blockchain state.

---

## Docker Image Sizes

**Blockchain Container:** ~800 MB
- Node.js base: ~200 MB
- Dependencies: ~400 MB
- Compiled contracts: ~200 MB

**Frontend Container:** ~600 MB
- Node.js base: ~200 MB
- Dependencies: ~300 MB
- Built application: ~100 MB

**Total:** ~1.4 GB

---

## Pushing to Docker Hub (Optional)

If you want to share your images:

```bash
# Tag images
docker tag smart-collateral-blockchain:latest yourusername/smart-collateral-blockchain:latest
docker tag smart-collateral-frontend:latest yourusername/smart-collateral-frontend:latest

# Login to Docker Hub
docker login

# Push images
docker push yourusername/smart-collateral-blockchain:latest
docker push yourusername/smart-collateral-frontend:latest
```

Then others can use:
```bash
docker-compose -f docker-compose.hub.yml up -d
```

Where `docker-compose.hub.yml` references your published images.

---

## Production Deployment

For production deployment (cloud servers):

### Option 1: Docker Compose on VPS

```bash
# On your server
git clone <your-repo>
cd smart-collateral-system
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes

Create Kubernetes manifests:
- Deployment for blockchain
- Deployment for frontend
- Services to expose ports
- ConfigMaps for configuration
- Persistent Volumes for blockchain data

### Option 3: Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml smart-collateral
```

---

## Security Notes

⚠️ **Important for Production:**

1. **Change Default Keys:** Never use Hardhat's default private keys in production
2. **Enable HTTPS:** Use reverse proxy (nginx) with SSL certificates
3. **Firewall Rules:** Restrict port access appropriately
4. **Secrets Management:** Use Docker secrets or environment variables for sensitive data
5. **Regular Updates:** Keep Node.js and dependencies updated

---

## Support

### Common Issues
- Check logs: `docker-compose logs -f`
- Check container status: `docker-compose ps`
- View resource usage: `docker stats`

### Get Contract Addresses
```bash
# After containers start
docker-compose exec blockchain cat deployment-info.json
```

### Run Tests
```bash
# Run all tests in blockchain container
docker-compose exec blockchain npx hardhat test

# Run specific test
docker-compose exec blockchain npx hardhat run scripts/test-vault-operations.js
```

---

## Benefits of Docker Setup

✅ **Consistent Environment:** Same setup on all machines  
✅ **Easy Onboarding:** New developers start in minutes  
✅ **Isolated Dependencies:** No conflicts with system packages  
✅ **Portable:** Run anywhere Docker runs  
✅ **Version Control:** Lock exact dependency versions  
✅ **CI/CD Ready:** Easy to integrate with pipelines  
✅ **Quick Reset:** Fresh environment with one command  

---

## Next Steps

1. ✅ Start containers: `docker-compose up -d`
2. ✅ Open browser: http://localhost:3000
3. ✅ Connect MetaMask to localhost:8545
4. ✅ Import test account
5. ✅ Start testing!

**Enjoy your Dockerized Smart Collateral BNPL System!** 🚀
