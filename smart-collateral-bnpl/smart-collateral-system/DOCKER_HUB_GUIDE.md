# 🐳 Smart Collateral BNPL - Docker Hub Guide

## 🚀 Quick Start (Easiest Way Ever!)

**No Repository Needed - Just Download and Run!**

```bash
# 1. Create a directory for the project
mkdir smart-collateral && cd smart-collateral

# 2. Download the docker-compose file
curl -O https://raw.githubusercontent.com/punithns/smart-collateral-bnpl/main/smart-collateral-system/docker-compose.hub.yml

# 3. Rename it to docker-compose.yml
mv docker-compose.hub.yml docker-compose.yml

# 4. Start everything with one command
docker-compose up -d

# 5. Open http://localhost:3000 and you're done! 🎉
```

**That's it! Everything else happens automatically.**

---

## 📥 What Gets Downloaded

Two Docker images from Docker Hub (published by `punithns`):

1. **punithns/smart-collateral-blockchain:latest** (1.66 GB)
   - Hardhat blockchain node
   - All 11 smart contracts
   - Auto-deploys contracts on startup

2. **punithns/smart-collateral-frontend:latest** (1.31 GB)
   - Next.js 16 frontend
   - React UI with all features
   - Auto-connects to blockchain

**Total size: ~3 GB** (but downloads in parallel)

---

## 🎮 Using the Application

### 1. Connect MetaMask

```
Network Name: Local Hardhat
RPC URL: http://localhost:8545
Chain ID: 31337
Currency: ETH
```

### 2. Import Test Account

```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

This account has ~10,000 ETH for testing.

### 3. Add Mock USDT Token

After startup, check blockchain logs for contract addresses or use:
```bash
docker-compose logs blockchain | grep "MockUSDT"
```

---

## 📊 Monitor Logs

```bash
# View both services
docker-compose logs -f

# View blockchain only
docker-compose logs -f blockchain

# View frontend only
docker-compose logs -f frontend
```

---

## 🛑 Stop & Cleanup

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Complete cleanup (removes everything including data)
docker-compose down -v
```

---

## 🔄 Update to Latest Version

```bash
# Pull newest images
docker-compose pull

# Restart with new versions
docker-compose up -d
```

---

## ⚙️ Customize Configuration

Edit `docker-compose.yml` to:

**Change ports:**
```yaml
ports:
  - "9000:8545"  # Use 9000 instead of 8545
  - "3001:3000"  # Use 3001 instead of 3000
```

**Custom environment variables:**
```yaml
environment:
  - NEXT_PUBLIC_CHAIN_ID=31337
  - NEXT_PUBLIC_RPC_URL=http://blockchain:8545
  - CUSTOM_VAR=value
```

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Find what's using the port
lsof -i :8545

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### "Cannot connect to Docker daemon"

```bash
# Make sure Docker Desktop is running
# On macOS: Open Docker.app
# On Windows: Start Docker Desktop
# On Linux: sudo service docker start
```

### "Image download is slow"

```bash
# Check download progress
docker-compose pull --no-parallel

# Or manually pull first
docker pull punithns/smart-collateral-blockchain:latest
docker pull punithns/smart-collateral-frontend:latest
```

### "Frontend says 'Failed to load risk data'"

```bash
# Blockchain might still be deploying
# Wait 30 seconds and refresh the browser
# Or check logs:
docker-compose logs blockchain | grep "Deployed"
```

---

## 📈 Production vs. Development

**This configuration is for DEVELOPMENT/TESTING**

### For Production:

```bash
# Use production mode
docker-compose -f docker-compose.prod.yml up -d

# With proper:
# - HTTPS/SSL certificates
# - Nginx reverse proxy
# - Environment secrets
# - Persistent database
# - Backup strategy
```

See [DOCKER_SETUP.md](../DOCKER_SETUP.md) for production setup.

---

## 🔐 Security Notes

⚠️  **Do NOT use these test credentials in production:**

- The test private key is publicly known
- This blockchain only exists locally
- Not suitable for real fund handling

**For production:**
1. Use proper secrets management
2. Enable HTTPS/TLS
3. Restrict network access
4. Implement authentication
5. Use hardware wallets for keys

---

## 📚 Features Working

✅ Smart Risk Prediction Engine  
✅ Dynamic Collateral Validator  
✅ Deposit/Borrow/Repay/Withdraw  
✅ Health Factor Monitoring  
✅ Insurance NFT System  
✅ Liquidation Engine  
✅ Price Oracle Integration  

---

## 🔗 Links

- **Docker Hub Repo:** https://hub.docker.com/r/punithns/smart-collateral-blockchain
- **GitHub Repo:** https://github.com/punithns/smart-collateral-bnpl
- **Full Documentation:** See DOCKER_SETUP.md in the repository

---

## 💬 Need Help?

```bash
# See all available commands
docker-compose --help

# See service status
docker-compose ps

# Check resource usage
docker stats

# View detailed logs
docker-compose logs --tail=100 --follow
```

---

## 🎓 Learning Path

1. **First time?**
   - Run `docker-compose up -d`
   - Connect MetaMask
   - Test deposit/borrow features
   - Explore the web UI

2. **Want to modify?**
   - Stop containers: `docker-compose down`
   - Clone the repository
   - Make changes
   - Use local `docker-compose.yml` with `docker-compose build`

3. **Want to contribute?**
   - Fork the GitHub repository
   - Make improvements
   - Create a pull request

---

## 🎉 What's Next?

After `docker-compose up -d`:

1. ✅ Wait 30 seconds for blockchain to deploy
2. ✅ Open http://localhost:3000
3. ✅ Connect MetaMask (see instructions above)
4. ✅ Import test account
5. ✅ Start testing features!

**Enjoy your Smart Collateral BNPL system!** 🚀
