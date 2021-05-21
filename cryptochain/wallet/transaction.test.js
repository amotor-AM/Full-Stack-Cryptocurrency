const Transaction = require("./transaction");
const Wallet = require("./index");
const {verifySignature} = require("../utils");
const { REWARD_INPUT, MINING_REWARD } = require("../config")

describe("Transaction", () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = "recipient-public-key";
        amount = 5;

        transaction = new Transaction({senderWallet, recipient, amount});
    });

    it("has a unique `id`", () => {
        expect(transaction).toHaveProperty("id");
    });

    describe("outputMap", () => {
        it("has an `outputMap`", () => {
            expect(transaction).toHaveProperty("outputMap");
        });

        it("outputs the amount to the recipient", () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it("outputs the remaining balance for the `senderWallet`", () => {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });

    describe("input", () => {
        it("has an `input`", () => {
            expect(transaction).toHaveProperty("input");
        });

        it("has a `timestamp` in the input", () => {
            expect(transaction.input).toHaveProperty("timestamp");
        });

        it("sets the `amount` to the `senderWallet` balance", () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it("sets the `address` to the `senderWallet` public key", () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it("signs the input", () => {
            expect(
              verifySignature({
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature  
              })
            ).toBe(true);
            
        });
    });

    describe("validTransaction()", () => {
        let errorMock;

        beforeEach(() => {
            errorMock = jest.fn();

            global.console.error = errorMock;
        })
      describe("when the transaction is valid", () => {
          it("returns true", () => {
            expect(Transaction.validTransaction(transaction)).toBe(true)  
          }); 
      });
      
      describe("when the transaction is invalid", () => {
          describe("and the transaction outputMap value is invalid", () => {
            it("returns false and logs an error", () => {
                transaction.outputMap[senderWallet.publicKey] = 1000000;
                expect(Transaction.validTransaction(transaction)).toBe(false)
                expect(errorMock).toHaveBeenCalled();
            });
          });

          describe("and the transaction signature is invalid", () => {
            it("returns false and logs an error", () => {
                transaction.input.signature = new Wallet().sign("fake-signature");
                expect(Transaction.validTransaction(transaction)).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
          });
      });
    });

    describe("update()", () => {

        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe("and the amount is invalid", () => {
            it("throws an error", () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: "test-user", amount: 1000000  
                    })
                }).toThrow("Transaction amount exceeds available balance");
            });
        });

        describe("and the amount is valid", () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = "new-test-user";
                nextAmount = 1;
    
                transaction.update({senderWallet, recipient: nextRecipient, amount: nextAmount});
            });
    
            it("outputs the amount to the next recipient", () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });
    
            it("subtracts the amount from the original sender output amount", () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });
    
            it("maintains a total output amount that matches the input amount", () => {
                expect(
                Object.values(transaction.outputMap).reduce((total, outputAmount) => total + outputAmount)
                ).toEqual(transaction.input.amount);
            });
    
            it("re-signs the existing transaction after updating the transaction", () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe("and another update for the same recipient", () => {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 4;
                    transaction.update({
                        senderWallet,
                        recipient: nextRecipient,
                        amount: addedAmount,
                    });
                });

                it("adds to the recipient's amount", () => {
                    console.log(transaction.outputMap[nextRecipient])
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount)
                });

                it("subtracts the new amount from the original sender's amount", () => {
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });

    describe("rewardTransaction()", () => {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({minerWallet})
        });

        it("creates a transaction with the reward input", () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT)
        });

        it("creates one transaction for the miner with the `MINING_REWARD`", () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD)
        });
    });
});