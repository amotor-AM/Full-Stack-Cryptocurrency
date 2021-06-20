const Block = require("./block");
const {cryptoHash} = require("../utils");
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({data}) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length-1],
            data
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactionData, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error("The incoming chain must be longer than the chain it is replacing.");
            return;
        };

        if(!Blockchain.isValidChain(chain)) {
            console.error("The new chain must contain a valid hash value");
            return;
        };

        if(validateTransactionData && !this.validTransactionData({chain})) {
            console.error("the incoming chain has invalid data")
           return; 
        };

        if(onSuccess){
            onSuccess();
        };
        console.log("New chain is valid. Replacing chain with: ", chain);
        this.chain = chain;
    };

    static isValidChain(chain) {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

        
        for(let i = 1; i < chain.length; i++) {
            const {timestamp, lastHash, hash, nonce, difficulty, data} = chain[i];
            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i-1].difficulty;
            if(lastHash !== actualLastHash) return false;
            const validHash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
            if(hash !== validHash) return false
            if(Math.abs(lastDifficulty - difficulty) > 1) return false; // Verifies that the difficulty is not adjusted greater than 1 in either direction.
        }
        
        return true;
    }

    validTransactionData({chain}) {
        for(let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let numberOfRewardTransactions = 0;

            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address) {
                    numberOfRewardTransactions += 1;

                    if(numberOfRewardTransactions > 1) {
                        console.error("Miner Reward applied more than once");
                        return false;
                    };

                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error("Miner Reward does not match preset value");
                        return false;
                    };
                } else {
                    if(!Transaction.validTransaction(transaction)) {
                        console.error("Invalid Transaction");
                        return false;
                    };

                    const correctBalance = Wallet.calculateBalance({
                        chain: this.chain, // Have to call original this.chain NOT pass the chain object we need to validate
                        address: transaction.input.address
                    });
                    if(transaction.input.amount !== correctBalance) {
                        console.error("Wallet balance is not correct");
                        return false;
                    };

                    if(transactionSet.has(transaction)) {
                        console.error("Identical transaction detected");
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    };
                };
            };

        };

        return true;
    };
};

module.exports = Blockchain