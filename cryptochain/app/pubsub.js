const PubNub = require("pubnub");

const credentials = {
    publishKey: "pub-c-752af9f5-115f-4b67-8d08-754eff87e41f",
    subscribeKey: "sub-c-5ae4fd3e-5f47-11eb-b440-627658c4805c",
    secretKey: "sec-c-MDQ5YjBmNGQtZGE3NC00MzgyLWJlYjctNjVhNWE4NmI2OTVm",
    logVerbosity: false
};

const CHANNELS = {
    TEST: "TEST",
    BLOCKCHAIN: "BLOCKCHAIN",
    TRANSACTION: "TRANSACTION"
};

class PubSub {
    constructor({blockchain, transactionPool, wallet}) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubnub = new PubNub(credentials); 
        this.pubnub.subscribe({channels: Object.values(CHANNELS)});
        this.pubnub.addListener(this.listener());
    };

    broadcastChain() {
        this.publish({
          channel: CHANNELS.BLOCKCHAIN,
          message: JSON.stringify(this.blockchain.chain)
        });
      };
    
    broadcastTransaction(transaction) {
        this.publish({
          channel: CHANNELS.TRANSACTION,
          message: JSON.stringify(transaction)
        });
    };

    subscribeToChannels() {
        this.pubnub.subscribe({
          channels: [Object.values(CHANNELS)]
        });
      };

    listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        switch(channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
            });
            break;
          case CHANNELS.TRANSACTION:
            if (!this.transactionPool.existingTransaction({
              inputAddress: this.wallet.publicKey
            })) {
              this.transactionPool.setTransaction(parsedMessage);
            }
            break;
          default:
            return;
        };
      }
    }
  }

    publish({channel, message}) {
        this.pubnub.publish({message, channel})
    }
};


module.exports = PubSub;