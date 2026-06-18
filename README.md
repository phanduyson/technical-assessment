# Engineering Assessment

> **Solution** — the implemented endpoint and how to run it are documented below.
> The original task description follows after.

## ✅ Solution: `GET /api/ApiTest`

A new endpoint that reads public state from a **pre-deployed, public smart contract**
— **USDC** (ERC-20) on Ethereum mainnet (`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`)
— using [ethers.js](https://docs.ethers.org/), prints the result to the console, and
returns it as JSON.

### Run it

```bash
npm install
npm start          # waits for: "Backend running on http://localhost:3001"
```

In a second terminal:

```bash
curl http://localhost:3001/api/ApiTest
```

### Example response

```json
{
  "success": true,
  "data": {
    "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "network": "ethereum-mainnet",
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "totalSupply": "51835210126.479676",
    "sampleHolder": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
    "sampleHolderBalance": "142.2445"
  }
}
```

The same data is printed to the **server console** (the requirement), e.g.:

```
✅ On-chain data fetched successfully:
{ name: 'USD Coin', symbol: 'USDC', totalSupply: '51835210126.479676', ... }
GET /api/ApiTest 200
```

### What it reads

Via the contract's read-only (`view`) functions: `name`, `symbol`, `decimals`,
`totalSupply`, and `balanceOf` for a sample holder — i.e. contract state, public
variables, and a balance.

### Implementation notes

- **Endpoint:** `src/index.js` — `GET /api/ApiTest` (calls the helper, logs to
  console, returns JSON, responds `502` on failure).
- **On-chain logic:** `src/config/getContractData.js` — minimal ABI, parallel reads
  via `Promise.all`, human-readable formatting with `formatUnits`.
- **Provider:** a keyless public RPC by default (zero setup); override with the
  `RPC_URL` env var (Infura / Alchemy / QuickNode).
- **Robustness:** `staticNetwork` + a 12s timeout so the request always settles
  rather than hanging if the RPC is slow or unreachable.

---

## 📝 Objective

The goal of this assessment is to evaluate your ability to:

Work with Web3 technologies and integrate blockchain functionality into a decentralized application (dApp).

---

## 📌 Task Instructions

1. **Create a New API Endpoint**

   - Add a new API endpoint in `index.js` named:

     ```
     [Name]ApiTest
     ```

2. **Smart Contract Interaction**

   - Select any **pre-deployed** or **public smart contract** (mainnet or testnet).
   
   - Fetch some data (any useful information such as balance, contract state, or public variables).
   
   - The logic should fetch data through your new API endpoint.


3. **Output**

   - The result should be printed to the console.
   - No need for complex UI or data persistence 
   - just demonstrate that the data was fetched successfully.

---

## 📤 Submission

Once completed, submit one of the following:

- **short video** recording your work.
- **screenshots** showing the API call and console result.
- **Github Link** where your assessment result were pushed.

---

## ⏰ Time Expectation

- Estimated time to complete: **30–60 minutes**.

---

## ⚙️ Notes

You may use any blockchain provider such as:

  - **ethers.js**
  - **web3.js**
  - Any public RPC provider (Infura, Alchemy, QuickNode, etc.)
  
Keep your code **clean, simple, and easy to review**.

Handle errors gracefully where possible.

---
## 🚀 Quick Start Guide

To run the project locally:

```bash
# Clone the repository (if provided)
git clone [repo-url]

# Move into the project directory
cd [project-folder]

# Install dependencies
npm install

# Start the server
npm start