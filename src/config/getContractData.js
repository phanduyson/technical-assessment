const { ethers } = require('ethers');

// Read-only RPC endpoint. Defaults to a keyless public node so the project
// runs with zero setup; override with RPC_URL (Infura / Alchemy / QuickNode).
const RPC_URL = process.env.RPC_URL || 'https://ethereum-rpc.publicnode.com';

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

/**
 * Fetches public state from the USDC contract via a single batched call set.
 * @returns {Promise<Object>} Human-readable contract data.
 */
async function getContractData() {
  // `staticNetwork` avoids ethers' auto network-detection retry loop, which can
  // otherwise hang forever ("failed to detect network, retry in 1s") if the RPC
  // is unreachable. Combined with the timeout below, the call always settles.
  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
    staticNetwork: ethers.Network.from(1), // 1 = Ethereum mainnet
  });
  const contract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);

  // Fail fast instead of hanging if the RPC is slow/unreachable.
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('RPC request timed out after 12s')), 12_000)
  );

  const [name, symbol, decimals, totalSupply, holderBalance] = await Promise.race([
    Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.balanceOf(SAMPLE_HOLDER),
    ]),
    timeout,
  ]);

  return {
    contract: USDC_ADDRESS,
    network: 'ethereum-mainnet',
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply: ethers.formatUnits(totalSupply, decimals),
    sampleHolder: SAMPLE_HOLDER,
    sampleHolderBalance: ethers.formatUnits(holderBalance, decimals),
  };
}

module.exports = { getContractData };
