const bodyParser = require("body-parser"); // Parses mined block data to JSON
const express = require("express");
const request = require("request");
const path = require("path");
const helmet = require("helmet");
const Blockchain = require("./blockchain");
const PubSub = require("./app/pubsub");
const TransactionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const TransactionMiner = require("./app/transaction-miner");

const app = express();
app.use(helmet());
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool, wallet});
const transactionMiner = new TransactionMiner({blockchain, transactionPool, wallet, pubsub});

const DEFAULT_PORT = 3000;

const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

express.json();
ap.use(express.static(path.join(__dirname, "client/dist")))

app.get("/api/blocks", (req, res) => {
    res.json(blockchain.chain);
});

// POST REQUEST ADD BLOCK TO CHAIN
app.post("/api/mine", (req, res) => {
    const {data} = req.body;

    blockchain.addBlock({data});

    pubsub.broadcastChain();

    res.redirect("/api/blocks");
});

let transaction = transactionPool.existingTransaction({inputAddress: wallet.publicKey}); // Creates global binding

// Sends transaction to the network
app.post("/api/transact", (req, res) => {
    const {amount, recipient} = req.body;


    try {
        if(transaction) {
            transaction.update({senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({recipient, amount, chain: blockchain.chain});
        }
    } catch(error) {
        return res.status(400).json({type: "error", message: error.message});
    };

    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction(transaction); // Calls broadcastTransaction from pubsub class (does not work for peers)

    res.json({type: "success", transaction});
});

app.get("/api/transaction-pool-map", (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get("/api/mine-transactions", (req, res) => {
    transactionMiner.mineTransactions();
    res.redirect("/api/blocks")
});

app.get("/api/wallet-info", (req, res) => {S
    res.json({
        address: wallet.publicKey,
        balance: Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey})
    })
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/dist/index.html"))
});

// Broadcasts blocks to network 
const syncWithRootChange = () => {
    request({url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            console.log("replaced chain on sync with ", rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) => {
        if(!error && response.statusCode === 200){
            const rootTransactionPoolMap = JSON.parse(body);

            console.log("Replaced transaction pool map on sync with ", rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    })
};

let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
};

const PORT = PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`server is listening at localhost:${PORT}`);

    if(PORT !== DEFAULT_PORT) {
        syncWithRootChange();
    };
});

