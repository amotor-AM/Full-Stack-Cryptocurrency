// A block needs a few things to operate
// 1) A timestamp (represented with Date.now())
// 2) A lastHash
// 3) the block's data
// 4) the block's hash
const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require("../config");
const {cryptoHash} = require("../utils");

class Block {
    constructor({timestamp, lastHash, hash, data, nonce, difficulty}) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    static genesis() {
        return new this(GENESIS_DATA);
    }

    static mineBlock({lastBlock, data}) {
        const lastHash = lastBlock.hash;
        let hash, timestamp;
        let { difficulty } = lastBlock;
        let nonce = 0;

        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

        } while (hexToBinary(hash).substring(0, difficulty) !== "0".repeat(difficulty));

        return new this({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        });
    }
    static adjustDifficulty({originalBlock, timestamp}) {
        const { difficulty } = originalBlock;
        const minedTime = timestamp - originalBlock.timestamp;

        if(difficulty < 1) return 1;
        
        if(minedTime > MINE_RATE) {
            return difficulty -1;
        } else if(minedTime < MINE_RATE) {
        return difficulty + 1;
        };
    }

}

module.exports = Block;
