const Block = require("./block")
const {cryptoHash} = require("../utils");

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

    replaceChain(chain) {
        if(chain.length <= this.chain.length) {
            console.error("The incoming chain must be longer than the chain it is replacing.")
            return;
        }

        if(!Blockchain.isValidChain(chain)) {
            console.error("The new chain must contain a valid hash value")
            return;
        }
        
        console.log("New chain is valid. Replacing chain with: ", chain)
        this.chain = chain;
    }

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
}

module.exports = Blockchain