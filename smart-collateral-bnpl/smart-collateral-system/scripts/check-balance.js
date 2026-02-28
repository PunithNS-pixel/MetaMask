/**
 * Check BNB Testnet balance before deployment
 * Usage: npx hardhat run scripts/check-balance.js --network bnbTestnet
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(address);
  const balanceInBNB = hre.ethers.formatEther(balance);

  console.log("📍 Deployer Address:", address);
  console.log("💰 Balance:", balanceInBNB, "tBNB");
  console.log("");

  const MIN_BALANCE = 0.1; // Minimum tBNB required
  
  if (parseFloat(balanceInBNB) < MIN_BALANCE) {
    console.log("❌ Insufficient balance!");
    console.log(`   Required: ${MIN_BALANCE} tBNB`);
    console.log(`   Current:  ${balanceInBNB} tBNB`);
    console.log("");
    console.log("🔗 Get testnet BNB from:");
    console.log("   https://testnet.bnbchain.org/faucet-smart");
    console.log("");
    process.exit(1);
  }

  console.log("✅ Balance sufficient for deployment");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
