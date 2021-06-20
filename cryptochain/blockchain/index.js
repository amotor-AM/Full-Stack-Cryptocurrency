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

    validTransactionData({ chain }) {
        for (let i=1; i<chain.length; i++) {
          const block = chain[i];
          const transactionSet = new Set();
          let rewardTransactionCount = 0;
    
          for (let transaction of block.data) {
            if (transaction.input.address === REWARD_INPUT.address) {
              rewardTransactionCount += 1;
    
              if (rewardTransactionCount > 1) {
                console.error('Miner rewards exceed limit');
                return false;
              };
    
              if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                console.error('Miner reward amount is invalid');
                return false;
              };
            } else {
              if (!Transaction.validTransaction(transaction)) {
                console.error('Invalid transaction');
                return false;
              };
    
              const trueBalance = Wallet.calculateBalance({
                chain: this.chain, // HAVE to call this.chain to compare origninal chain against the one we need to verify
                address: transaction.input.address
              });
    
              if (transaction.input.amount !== trueBalance) {
                console.error('Invalid input amount');
                return false;
              };
    
              if (transactionSet.has(transaction)) {
                console.error('An identical transaction appears more than once in the block');
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