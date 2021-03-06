const TransactionPool = require ("./transaction-pool");
const Blockchain = require("../blockchain")
const Transaction = require ("./transaction");
const Wallet = require("./index");

describe("TransactionPool", () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool;
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: "test-user",
            amountmount: 3
        });
    });

    describe("setTransaction()", () => {
        it("adds a transaction", () => {
            transactionPool.setTransaction(transaction);

            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        });
    });

    describe("existingTransaction()", () => {
        it("returns an existing transaction of a given input address", () => {
            transactionPool.setTransaction(transaction);

            expect(transactionPool.existingTransaction({inputAddress: senderWallet.publicKey})).toBe(transaction);
        });
    });

    describe("validTransactions()", () => {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for(let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: "test_user",
                    amount: 1
                });

                if(i % 3 === 0) {
                    transaction.input.amount = 500;
                } else if(i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign("invalid_signature");
                } else {
                    validTransactions.push(transaction);
                }
               
                transactionPool.setTransaction(transaction);
            };
        });

        it("returns valid transactions", () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });

        it("logs errors for invalid transactions", () => {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        })
    });

    describe("clear()", () => {
       it("clears the transactions from the pool", () => {
        transactionPool.clear();
        expect(transactionPool.transactionMap).toEqual({});
       });
    });

    describe("clearBlockchainTransactions()", () => {
        it("clears the blockchain of any existing transactions", () => {
            const blockchain = new Blockchain();
            const expectedTransactions = {};

            for(let i = 0; i < 6; i++) {
                const transaction = new Wallet().createTransaction({recipient: "test-user", amount: 2});
                transactionPool.setTransaction(transaction);

                if(i % 2 === 0) {
                    blockchain.addBlock({data: [transaction]});
                } else {
                    expectedTransactions[transaction.id] = transaction;
                };
            };

            transactionPool.clearBlockchainTransactions({chain: blockchain.chain});
            expect(transactionPool.transactionMap).toEqual(expectedTransactions);
        });
    });
});