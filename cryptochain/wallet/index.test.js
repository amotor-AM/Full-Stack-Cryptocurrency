const Wallet = require("./index");
const Transaction = require("./transaction");
const {verifySignature} = require("../utils");

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
});