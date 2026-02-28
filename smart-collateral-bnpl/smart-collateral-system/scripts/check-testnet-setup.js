const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking BNB Testnet Setup...\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    
    if (!deployer) {
      console.error("❌ No wallet configured!");
      console.log("\n📝 You need to set up a private key in .env file");
      console.log("Follow these steps:\n");
      console.log("1. Create a test wallet in MetaMask");
      console.log("2. Export the private key (TESTNET ONLY!)");
      console.log("3. Add to .env:");
      console.log("   PRIVATE_KEY=your_64_character_key_without_0x");
      console.log("\n4. Get testnet BNB:");
      console.log("   https://testnet.bnbchain.org/faucet-smart\n");
      process.exit(1);
    }

    console.log("✅ Wallet configured");
    console.log("📍 Address:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balanceInBNB = hre.ethers.formatEther(balance);
    
    console.log("💰 Balance:", balanceInBNB, "tBNB");
    
    if (parseFloat(balanceInBNB) === 0) {
      console.log("\n❌ No tBNB balance!");
      console.log("\n📝 Get free testnet BNB:");
      console.log("1. Visit: https://testnet.bnbchain.org/faucet-smart");
      console.log("2. Paste your address:", deployer.address);
      console.log("3. Click 'Give me BNB'");
      console.log("4. Wait 1-2 minutes and run this check again");
      process.exit(1);
    }
    
    if (parseFloat(balanceInBNB) < 0.1) {
      console.log("\n⚠️  Low balance!");
      console.log("You have", balanceInBNB, "tBNB but deployment needs ~0.1-0.2 tBNB");
      console.log("\nYou can:");
      console.log("1. Try deployment anyway (might work)");
      console.log("2. Get more tBNB from faucet: https://testnet.bnbchain.org/faucet-smart");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }
    
    // Check network
    const network = await hre.ethers.provider.getNetwork();
    console.log("\n🌐 Network:", network.name);
    console.log("🆔 Chain ID:", network.chainId.toString());
    
    if (network.chainId.toString() !== "97") {
      console.log("\n⚠️  Warning: Chain ID is not 97 (BNB Testnet)");
    } else {
      console.log("✅ Connected to BNB Testnet");
    }
    
    console.log("\n✅ ALL CHECKS PASSED!");
    console.log("\n🚀 Ready to deploy! Run:");
    console.log("npx hardhat run scripts/deploy-testnet.js --network bnb_testnet\n");
    
  } catch (error) {
    console.error("\n❌ Setup check failed:", error.message);
    console.log("\n📝 Common fixes:");
    console.log("1. Check PRIVATE_KEY in .env file (64 hex chars, no 0x prefix)");
    console.log("2. Make sure you have tBNB in your wallet");
    console.log("3. Check internet connection");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
