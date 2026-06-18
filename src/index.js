const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const killPort = require('kill-port');
const { getContractData } = require('./config/getContractData');

require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

const checkPort = async (port, maxPort = 65535) => {

    if (port > maxPort) {
        throw new Error("No available ports found");
    }

    try {
        await killPort(port, "tcp");
        await killPort(port, "udp");
        return port;
    } catch (err) {
        // kill-port rejects with "No process running on port" when the port is
        // already free — which is exactly what we want, so use it. Only advance
        // to the next port on a genuine error (e.g. permission denied).
        if (/no process running/i.test(err.message)) {
            return port;
        }
        return checkPort(port + 1, maxPort);
    }
};

(async () => {
    const safePort = await checkPort(PORT);
    const getPort = (await import('get-port')).default; // dynamic import
    const final_port = await getPort({ port: safePort });

    console.log(`Port ${final_port} is free. Ready to start server.`);

    // Middleware
    app.use(cors({ origin: `http://localhost:${final_port}` }));
    app.use(express.json());
    app.use(morgan('dev'));

    // Routes
    app.use('/api/items', require('./routes/items'));
    app.use('/api/stats', require('./routes/stats'));

    require('./config/dbHandler.js').connect();

    /**
     * @route    GET /api/ApiTest
     * @desc     Fetches public state from a pre-deployed smart contract (USDC
     *           ERC-20 on Ethereum mainnet) via ethers.js and logs it to the console.
     * @access   public
     * @param    {Request}  req  - Express request object. No params required.
     * @param    {Response} res  - Express response object.
     * @returns  {JSON}          { success: true, data: { name, symbol, decimals, totalSupply, ... } }
     * @throws   502 if the on-chain read fails (e.g., RPC unreachable).
     *
     * @example
     * // Example request
     * curl http://localhost:3001/api/ApiTest
     *
     * // Example response
     * {
     *   "success": true,
     *   "data": { "name": "USD Coin", "symbol": "USDC", "totalSupply": "..." }
     * }
     */
    app.get('/api/ApiTest', async (req, res) => {
        try {
            const data = await getContractData();

            // Requirement: print the fetched on-chain data to the console.
            console.log('\n✅ On-chain data fetched successfully:');
            console.log(data);

            res.json({ success: true, data });
        } catch (err) {
            console.error('❌ Failed to fetch on-chain data:', err.message);
            res.status(502).json({ success: false, error: 'Failed to fetch on-chain data' });
        }
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
        });
    }

    // Start server
    app.listen(final_port, () => {
        console.log(`Backend running on http://localhost:${final_port}`);
    });
})();