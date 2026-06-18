# `GET /api/ApiTest` — Sequence Diagram

How a request flows from the client through the Express server to the
Ethereum blockchain and back. The endpoint reads public state from the
**USDC** ERC-20 contract on mainnet via ethers.js and prints it to the console.

![GET /api/ApiTest sequence diagram](./rwa-seq-diagrame-api-test.png)

The diagram below is the Mermaid source that renders the image above.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client<br/>(curl / Safari)
    participant API as Express Server<br/>(src/index.js)
    participant H as Route Handler<br/>GET /api/ApiTest
    participant G as getContractData()<br/>(src/config)
    participant P as ethers Provider<br/>(JsonRpcProvider)
    participant RPC as Public RPC Node<br/>(ethereum-rpc.publicnode.com)
    participant SC as USDC Contract<br/>(Ethereum mainnet)

    Client->>API: GET /api/ApiTest
    API->>API: middleware (cors, json, morgan)
    API->>H: route matched

    H->>G: await getContractData()
    G->>P: new JsonRpcProvider(RPC_URL, staticNetwork)
    G->>P: new Contract(USDC_ADDRESS, ABI, provider)

    Note over G,SC: 5 read-only (view) calls, batched with Promise.all<br/>raced against a 12s timeout

    par Parallel eth_call requests
        G->>P: name()
        P->>RPC: eth_call
        RPC->>SC: read name
        SC-->>RPC: "USD Coin"
        RPC-->>P: result
        P-->>G: "USD Coin"
    and
        G->>P: symbol() / decimals() / totalSupply() / balanceOf(holder)
        P->>RPC: eth_call (x4)
        RPC->>SC: read state
        SC-->>RPC: values
        RPC-->>P: results
        P-->>G: values
    end

    alt all reads succeed
        G->>G: formatUnits(...) → human-readable
        G-->>H: { name, symbol, decimals, totalSupply, balance }
        H->>API: console.log("✅ On-chain data fetched successfully", data)
        H-->>Client: 200 { success: true, data }
    else RPC unreachable / 12s timeout / call error
        P--xG: error (or timeout fires)
        G-->>H: throws Error
        H->>API: console.error("❌ Failed to fetch on-chain data")
        H-->>Client: 502 { success: false, error }
    end

    API->>API: morgan logs "GET /api/ApiTest <status>"
```

## Notes

- **Read-only:** every blockchain call is an `eth_call` (a free, gasless read).
  No wallet, no transaction, no signing is involved.
- **Parallelism:** the five reads run concurrently via `Promise.all`, so total
  latency is roughly one round-trip, not five.
- **Resilience:** the call is raced against a 12-second timeout, and the provider
  uses `staticNetwork` to avoid ethers' indefinite network-detection retry loop —
  so the handler always responds (200 or 502) instead of hanging.
- **Console output:** the fetched data is logged on the server (the assessment's
  "result printed to the console" requirement) in addition to the HTTP response.
