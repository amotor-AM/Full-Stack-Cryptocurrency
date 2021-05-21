const MINE_RATE = 10000;
const INITIAL_DIFFICULTY = 3;

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: "AbIR*owe0p0$hY7&9m%",
    hash: "Q03.p)f&w0I29@k",
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
};

const STARTING_BALANCE = 10;

const REWARD_INPUT = {
    address: "miner-reward"
};

const MINING_REWARD = 50;

module.exports = { GENESIS_DATA, MINE_RATE, STARTING_BALANCE, REWARD_INPUT, MINING_REWARD };