import "dotenv/config";
import { ethers } from "ethers";
import { nodemailer } from "nodemailer";

const provider = new ethers.providers.AlchemyProvider(
  "maticmum",
  process.env.ALCHEMY_KEY
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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

const contract = new ethers.Contract(
  crowdFundingAddress,
  crowdFundingABI,
  provider
);

function checkTx() {
  provider.on("withdraw", async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (tx && isPotentialReentrancy(tx)) {
        console.log("Potential reentrancy detected:", tx);
        sendNotification(tx);
      }
    } catch (error) {
      console.error("Error monitoring transactions:", error);
    }
  });
}

function isPotentialReentrancy(tx) {
  // Basic check for potential reentrancy attack
  return tx.to === crowdFundingAddress && tx.data.includes("2e1a7d4d");
}

async function sendNotification(tx) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "soufiane@oklever.com",
    subject: "Potential Reentrancy Attack Detected",
    text:
      `A potential reentrancy attack has been detected on the CrowdFunding contract.\n\n` +
      `Transaction: ${tx.hash}\n` +
      `From: ${tx.from}\n` +
      `To: ${tx.to}\n` +
      `Data: ${tx.data}\n` +
      `Value: ${ethers.utils.formatEther(tx.value)} ETH`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

checkTx();
