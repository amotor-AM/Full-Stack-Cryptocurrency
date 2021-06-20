const Wallet = require("./index");
const Transaction = require("./transaction");
const {verifySignature} = require("../utils");
const Blockchain = require("../blockchain");
const {STARTING_BALANCE} = require("../config");

describe("Wallet", () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it("has a `balance`", () => {
        expect(wallet).toHaveProperty("balance");
    });

    it("has a `publicKey`", () => {
        expect(wallet).toHaveProperty("publicKey");
    });

    describe("signing data", () => {
        const data = "random_data";

        it("verifies a signature", () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);

        });

        it("does not verify an invalid signature", () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });

    describe("createTransaction()", () => {
        describe("and the amount exceeds the available wallet balance", () => {
            it("throws an error and stops the transaction", () => {
                expect(() => wallet.createTransaction({amount: 1000000, recipient: "test-user"})).toThrow("Transaction amount exceeds available balance");
            });
        });

        describe("and the amount of the transaction does not exceed the available balance", () => {

            let transaction, amount, recipient;

            beforeEach(() => {
               amount = 2;
               recipient = "test-recipient";
               transaction = wallet.createTransaction({amount, recipient}); 
            });

            it("creates an instance of `Transaction`", () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it("matches the transaction with the wallet information", () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it("outputs the correct amount to the recipient", () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });
    });

    describe("and a chain is passed", () => {
        it("calls `Wallet.calculateBalance`", () => {
            const calculateBalanceMock = jest.fn();
            // Prevents other tests from failing that rely on Wallet.calculateBalance
            const originalCalcBalFun = Wallet.calculateBalance;
            
            Wallet.calculateBalance = calculateBalanceMock;

            wallet.createTransaction({recipient: "test", amount: 3, chain: new Blockchain().chain});

            expect(calculateBalanceMock).toHaveBeenCalled();
            // Restores Wallet.calculateBalance
            Wallet.calculateBalance = originalCalcBalFun;
        });
    });

    describe("calculateBalance()", () => {
        let blockchain;

        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe("and there are no transaction outputs for the wallet", () => {
            it("returns the `STARTING_BALANCE`", () => {
                expect(Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey})).toEqual(STARTING_BALANCE); 
            });
        });

        describe("and there are transaction outputs for the wallet", () => {
            let transactionOne, transactionTwo

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({recipient: wallet.publicKey, amount: 10});
                transactionTwo = new Wallet().createTransaction({recipient: wallet.publicKey, amount: 13});
                blockchain.addBlock({data: [transactionOne, transactionTwo]});
            });

            it("adds the sum of all outputs to the wallet balance", () => {
                expect(Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey}))
                .toEqual(STARTING_BALANCE + transactionOne.outputMap[wallet.publicKey] + transactionTwo.outputMap[wallet.publicKey]);
            });

            describe("and the wallet has made a transaction", () => {
                let recentTransaction;

                beforeEach(() => {
                   recentTransaction = wallet.createTransaction({recipient: "Alex", amount: 14});
                   blockchain.addBlock({data: [recentTransaction]});
                });

                it("returns the output amount of this recent transaction", () => {
                    expect(Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey})).toEqual(recentTransaction.outputMap[wallet.publicKey])
                });

                describe("and there are outputs next to and after the recent transaction", () => {
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({recipient: "Alex", amount: 11});
                        sameBlockTransaction = Transaction.rewardTransaction({minerWallet: wallet});
                        blockchain.addBlock({data: [recentTransaction, sameBlockTransaction]});

                        nextBlockTransaction = new Wallet().createTransaction({recipient: wallet.publicKey, amount: 40});
                        blockchain.addBlock({data: [nextBlockTransaction]});
                    });

                    it("includes the output amounts in the returned balance", () => {
                        expect(Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey}))
                        .toEqual(recentTransaction.outputMap[wallet.publicKey] + sameBlockTransaction.outputMap[wallet.publicKey] + nextBlockTransaction.outputMap[wallet.publicKey])
                    });
                })
            });
        });
    });
});