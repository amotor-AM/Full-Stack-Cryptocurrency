// This is just a quick blockchain to get the idea of what a blockchain is

const lightningHash = () => {
    return data + "*";
}

class Block {
    constructor(data, hash, lastHash) {
        this.data = data;
        this.hash = hash;
        this.lastHash = lastHash;
    }
}

const newBlock = new Block("dummy-data", "dummy-Hash", "dummy-lastHash");
console.log(newBlock);

class Blockchain {
    constructor() {
        const genesis = new Block("genesis-data", "genesis-hash", "genesis-lastHash");
        this.chain = [genesis];
    }
    addBlock(data) {
        const lastHash = this.chain[this.chain.length-1].hash;
        const hash = lightningHash(data + lastHash);

        const block = new Block(data, hash, lastHash);
        this.chain.push(block);
    }
}

const testBlockchain = new Blockchain(); 
testBlockchain.addBlock("one");
testBlockchain.addBlock("two");
testBlockchain.addBlock("three");

console.log(testBlockchain)