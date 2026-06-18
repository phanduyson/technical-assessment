const { ethers } = require('ethers');

// Read-only RPC endpoints. Public nodes are free but occasionally rate-limit or
// lag, which causes intermittent failures. We try several in order and fall back
// to the next on any error/timeout, so a single flaky node doesn't break us.
// Set RPC_URL (Infura / Alchemy / QuickNode) to put your own node first.
const RPC_URLS = [
  process.env.RPC_URL,
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com',
].filter(Boolean);

// How long to wait on one RPC before giving up and trying the next.
const PER_RPC_TIMEOUT_MS = 6_000;

// Pre-deployed, public smart contract: USDC (ERC-20) on Ethereum mainnet.
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// Minimal ABI — only the read-only (view) functions we call.
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

// A well-known holder, used to demonstrate balanceOf (Binance hot wallet).
const SAMPLE_HOLDER = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms (${label})`)), ms)
    ),
  ]);

// Reads all values from a single RPC endpoint.
async function readFrom(rpcUrl) {
  // `staticNetwork` avoids ethers' auto network-detection retry loop, which can
  // otherwise hang ("failed to detect network, retry in 1s") on a bad endpoint.
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: ethers.Network.from(1), // 1 = Ethereum mainnet
  });
  const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply, holderBalance] = await withTimeout(
    Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.balanceOf(SAMPLE_HOLDER),
    ]),
    PER_RPC_TIMEOUT_MS,
    rpcUrl
  );

  provider.destroy(); // free the underlying connection

  return {
    contract: USDC_ADDRESS,
    network: 'ethereum-mainnet',
    rpc: rpcUrl,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: ethers.formatUnits(totalSupply, decimals),
    sampleHolder: SAMPLE_HOLDER,
    sampleHolderBalance: ethers.formatUnits(holderBalance, decimals),
  };
}

/**
 * Fetches public state from the USDC contract, trying each RPC in turn and
 * falling back on failure. Throws only if every endpoint fails.
 * @returns {Promise<Object>} Human-readable contract data.
 */
async function getContractData() {
  let lastErr;
  for (const rpcUrl of RPC_URLS) {
    try {
      return await readFrom(rpcUrl);
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️  RPC failed (${rpcUrl}): ${err.message} — trying next…`);
    }
  }
  throw new Error(`All RPC endpoints failed. Last error: ${lastErr && lastErr.message}`);
}

module.exports = { getContractData };
