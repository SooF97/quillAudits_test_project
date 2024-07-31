import "dotenv/config";
import { ethers } from "ethers";

const provider = new ethers.providers.AlchemyProvider(
  "maticmum",
  process.env.ALCHEMY_KEY
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const crowdFundingABI = [
  "error EnforcedPause()",
  "error ExpectedPause()",
  "error InvalidInitialization()",
  "error NotInitializing()",
  "error OwnableInvalidOwner(address)",
  "error OwnableUnauthorizedAccount(address)",
  "event Initialized(uint64)",
  "event OwnershipTransferred(address indexed,address indexed)",
  "event Paused(address)",
  "event Unpaused(address)",
  "event entered(address indexed,uint256 indexed,bool)",
  "function deposit() payable",
  "function getEntrancyFee() view returns (uint256)",
  "function getMaxInvestors() view returns (uint256)",
  "function initialize()",
  "function investors(uint256) view returns (address,uint256,bool)",
  "function mappingInvestor(address) view returns (address,uint256,bool)",
  "function owner() view returns (address)",
  "function pause()",
  "function paused() view returns (bool)",
  "function renounceOwnership()",
  "function transferOwnership(address)",
  "function unpause()",
  "function upgradeFunction()",
  "function withdraw(uint256)",
];
const crowdFundingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Create contract instance
const contract = new ethers.Contract(
  crowdFundingAddress,
  crowdFundingABI,
  wallet
);

async function main() {
  console.log("Starting monitoring...");

  provider.on("withdraw", async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (tx && isPotentialReentrancy(tx)) {
        console.log("Potential reentrancy detected:", tx);

        // Calculate a dynamic gas price
        const gasPrice = await provider.getGasPrice();
        const dynamicGasPrice = gasPrice.mul(ethers.BigNumber.from(2)); // Example: doubling the current gas price

        // Trigger the pause function
        const pauseTx = await contract.pause({ gasPrice: dynamicGasPrice });
        console.log(`Pause transaction sent with hash: ${pauseTx.hash}`);
      }
    } catch (error) {
      console.error("Error monitoring transactions:", error);
    }
  });
}

function isPotentialReentrancy(tx) {
  // Basic check for potential reentrancy attack
  return tx.to === crowdFundingAddress && tx.data.includes("0x"); // Adjust this based on the specific function signature
}

main().catch(console.error);
