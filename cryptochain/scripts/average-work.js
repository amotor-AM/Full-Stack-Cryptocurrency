/* By default our SHA-256 algorythm produces hexadeciamal characters and bases the network difficulty off of that value. In the case of Bitcoin and other POW Blockchains Binary values are used instead of hexadecimal. This allows them to be more precise but also introduces a fair bit of complexity into the network. This complexity requires miners to have to work harder to generate valid hashes and therefore increases network overhead. This will ultimately lead to a lower network difficulty relative to total hashing power. In this file I am experamenting to see if the tradeoff of increased speed and possible security benefits outweigh the cost of a higher time to mine, greater workload, and lower network difficulty. */

const Blockchain = require("../blockchain");

const blockchain = new Blockchain();

blockchain.addBlock({data: "initial-block"});

let previousTimestamp, nextTimestamp, nextBlock, timeDifference, averageTimeToMineNewBlocks;

const times = [];

// NBD just mining 100 blocks
for(let i = 0; i < 100; i++) {
    // Find last timestamp before adding a block
    previousTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;

    // Adding a new block
    blockchain.addBlock({data: `Block Number ${i}`});
    nextBlock = blockchain.chain[blockchain.chain.length -1];

    // Finding new timestamp based on nextBlock value
    nextTimestamp = nextBlock.timestamp;

    // Comparing the two timestamps against each other and pushing the value to times array
    timeDifference = nextTimestamp - previousTimestamp;
    times.push(timeDifference);

    // finding average time to add blocks
    averageTimeToMineNewBlocks = Math.round(times.reduce((total, num) => (total + num))/times.length);

    console.log(`Time to mine last block: ${timeDifference} ms. Network difficulty: ${nextBlock.difficulty}. Average time overall: ${averageTimeToMineNewBlocks} ms`)
};
