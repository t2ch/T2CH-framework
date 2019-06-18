/* eslint-disable func-names */
import {
  startP2P,
  connectToAll,
  startForge,
  connect as _connect,
  getWallets,
  getPeers,
  createWallet,
  createKeystore,
  search as _search,
  getAllBlocks,
  sendText,
  unbanAll,
  banIP,
  getBalance,
  getStatus,
  getMempool,
  clearMempool,
  getTransactions,
  selectWallet,
  sendTX,
  stopForge,
  startHTTP,
  testDoubleSpent,
  disconnect as _disconnect,
} from './actions';
import { txTypes } from '../node/helper/parseObj';
import { isValidAddress, getPublicFromPrivate } from '../node/wallet/wallet';
import User from '../node/wallet/user';

// COMMANDS
async function welcome(vorpal) {
  vorpal.log('Welcome to Evodesk blockchain node!');

  try {
    await getWallets();
    vorpal.exec('wallet -s');
  } catch (err) {
    vorpal.log('No wallets :( Please, create new wallet.');

    vorpal.exec('wallet');
  }
}

function start(vorpal) {
  vorpal
    .command('start', 'Sync (peering and seeding), --http --forge')
    .option('-h, --http', 'using RPC-JSON')
    .option('-f, --forge', 'forging blocks')
    .option('-n, --noauto', 'witout auto connections')
    .alias('o')
    .action(async (args, callback) => {
      const log = await startP2P(6000);

      this.log(`Starting node:
          addr| ${log.ip}
          port| ${log.port}
          STUN| ${log.stun}`);

      if (!args.options.noauto) await connectToAll();

      if (args.options.http) {
        const httpPort = 3000;
        this.log(`Starting http-server on ${log.ip}:${httpPort}`);
        startHTTP(httpPort);
      }

      if (args.options.forge) startForge();

      callback();
    });
}

function connect(vorpal) {
  vorpal
    .command('connect <host>', 'Connect to peer')
    .alias('c')
    .action((args, callback) => {
      _connect(args.host);
      callback();
    });
}

function wallet(vorpal) {
  vorpal
    .command('wallet', 'generate new wallet')
    .option('-l, --list', 'list all wallets')
    .option('-i, --import', 'import wallet from private key')
    .option('-s, --select', 'select wallet')
    .alias('w')
    .types({ string: ['_'] })
    .action(async function (args, callback) {
      const self = this;

      if (args.options.list) {
        const wallets = await getWallets();
        wallets.forEach((uWallet) => {
          this.log(uWallet);
        });

        return callback();
      }

      if (args.options.import) {
        return this.prompt(
          [
            {
              type: 'password',
              name: 'privateKey',
              message: 'Enter private key (without "0x"): ',
              validate: input => (input.length === 64),
            },
            {
              type: 'password',
              name: 'password',
              default: false,
              message: 'Enter password: ',
            },
            {
              type: 'password',
              name: 'password2',
              default: false,
              message: 'Confirm password: ',
            },
          ],
          (answers) => {
            if (answers.password !== answers.password2) {
              self.log('Passwords must match!');

              return callback();
            }

            const address = createKeystore(`0x${answers.privateKey}`, answers.password);
            const publicKey = getPublicFromPrivate(`0x${answers.privateKey}`);
            User.selectWallet(address, publicKey, answers.privateKey);

            self.log(`Wallet ${address} successfully imported and selected!`);

            return callback();
          },
        );
      }

      if (args.options.select) {
        const wallets = await getWallets();

        return this.prompt(
          [
            {
              type: 'list',
              name: 'wallet',
              message: 'Please, choose one of the following wallets:',
              choices: wallets,
            },
            {
              type: 'password',
              name: 'password',
              message: 'Enter password: ',
            },
          ],
          (answers) => {
            selectWallet(`${answers.wallet.substring(2)}.json`, answers.password);
            self.log(`Wallet ${answers.wallet} has been selected!`);
          },
        );
      }

      return this.prompt(
        [
          {
            type: 'password',
            name: 'password',
            default: false,
            message: 'Enter password: ',
          },
          {
            type: 'password',
            name: 'password2',
            default: false,
            message: 'Confirm password: ',
          },
        ],
        (answers) => {
          if (answers.password !== answers.password2) {
            self.log('Passwords must match!');

            return vorpal.execSync('wallet');
          }

          const newWallet = createWallet(answers.password);
          self.log(newWallet);

          return callback();
        },
      );
    });
}

function blocks(vorpal) {
  vorpal
    .command('blocks', 'all verifed blocks')
    .alias('b')
    .option('-q, --quantity', 'last verifed block')
    .types({ string: ['_'] })
    .action(async (args, callback) => {
      if (args.options.quantity) {
        this.log(await getAllBlocks('quantity'));
      } else {
        this.log(await getAllBlocks());
      }

      callback();
    });
}

function peers(vorpal) {
  vorpal
    .command('peers', 'list of peers from DHT table')
    .action(async (args, callback) => {
      this.log(await getPeers());
      callback();
    });
}

function search(vorpal) {
  vorpal
    .command('search <data>', 'search blocks/tranasctions/address from hash')
    .alias('sch')
    .option('-b, --blocks', 'address transactions')
    .option('-t, --trans', 'address transactions')
    .option('-a, --address', 'address transactions')
    .action(async (args, callback) => {
      let result;

      if (args.data) {
        if (args.options.address) {
          result = await _search('a', args.data);
        } else if (args.options.trans) {
          result = await _search('t', args.data);
        } else if (args.options.blocks) {
          result = await _search('b', args.data);
        }

        this.log(result);
      } else this.log('Please, input data.');

      callback();
    });
}

function sendTx(vorpal) {
  vorpal
    .command('send', 'Sending a transaction')
    .alias('send')
    .types({ string: ['_'] })
    .action(function (args, callback) {
      const self = this;
      this.prompt({
        type: 'list',
        name: 'txtype',
        choices: Object.keys(txTypes),
        message: 'Select type of transaction',
      }, async (answer) => {
        const params = {
          type: answer.txtype,
        };

        const enterData = new Promise((resolves) => {
          switch (params.type) {
            case 'coin':
              self.prompt(
                [
                  {
                    type: 'input',
                    name: 'recipient',
                    message: 'Enter address of the recipient: ',
                    validate: input => isValidAddress(input),
                  },
                  {
                    type: 'number',
                    name: 'amount',
                    message: 'Enter amount of coins to send: ',
                    validate: input => (Number(input) > 0),
                  },
                ], async (answers) => {
                  params.recipient = answers.recipient;
                  params.amount = answers.amount;

                  resolves();
                },
              );

              break;
            default:
              resolves();

              break;
          }
        });

        await enterData;
        try {
          await sendTX(params.type, params);
        } catch (err) {
          self.log(`Can't send tx: ${err}`);
        }

        self.log('Транзакция успешно отправлена!');
        return callback();
      });
    });
}

function sendMsg(vorpal) {
  vorpal
    .command('sendm <message>', 'send message to all')
    .types({ string: ['_'] })
    .action((args, callback) => {
      sendText(args.message);
      callback();
    });
}

function unban(vorpal) {
  vorpal.command('unban', 'unban all ips').action((args, callback) => {
    unbanAll();
    callback();
  });
}

function ban(vorpal) {
  vorpal
    .command('ban <ip>', 'block incoming messages from single ip')
    .action((args, callback) => {
      banIP(args.ip);
      callback();
    });
}

async function balance(vorpal) {
  vorpal
    .command('balance <address>', 'Get balance of the wallet by address')
    .types({ string: ['_'] })
    .action(async (args, callback) => {
      this.log(await getBalance(args.address));
      callback();
    });
}

function status(vorpal) {
  vorpal
    .command('status', 'Get current node status')
    .types({ string: ['_'] })
    .action((args, callback) => {
      this.log(getStatus());
      callback();
    });
}

function disconnect(vorpal) {
  vorpal
    .command('disconnect', 'Disconnect form all peers')
    .types({ string: ['_'] })
    .action((args, callback) => {
      _disconnect();
      callback();
    });
}

function forge(vorpal) {
  vorpal
    .command('forge', 'forge block')
    .alias('f')
    .types({ string: ['_'] })
    .action(async function (args, callback) {
      try {
        this.log(await startForge());
      } catch (err) {
        this.log(`Can't start forging: ${err}`);
      }

      return callback();
    });
}

function mempool(vorpal) {
  vorpal
    .command('mempool', 'Show mempool transactions')
    .alias('memp')
    .types({ string: ['_'] })
    .option('-l, --length', 'amount txs in mempool')
    .option('-c, --clear', 'clear mempool')
    .action(async (args, callback) => {
      if (args.options.length) {
        this.log(getMempool().length);
        return callback();
      }

      if (args.options.clear) {
        this.log('cleaned', clearMempool());
        return callback();
      }

      this.log(getMempool());

      return callback();
    });
}

function fstop(vorpal) {
  vorpal
    .command('fstop', 'Stop forging')
    .alias('fs')
    .types({ string: ['_'] })
    .action((args, callback) => {
      this.log(stopForge());
      this.log('Форжинг приостановлен');

      callback();
    });
}

function transaction(vorpal) {
  vorpal
    .command('transactions', 'get transactions')
    .alias('tx')
    .types({ string: ['s', 'sender'] })
    .option('-h, --hash <txHash>', 'get transaction by hash')
    .option('-t, --type <txType>', 'get transactions by type')
    .option(
      '-s, --sender <senderAddress>',
      'get transactions by sender address',
    )
    .action(async function (args) {
      const searchOpts = args.options;
      this.log(await getTransactions(searchOpts));
    });
}

function testDS(vorpal) {
  vorpal
  .command('testds', 'test ds transaction')
  .alias('ds')
  .action(async function() {
    this.log(await testDoubleSpent());
  });
}

function cli(vorpal) {
  vorpal
    .use(welcome)
    .use(start)
    .use(connect)
    .use(wallet)
    .use(blocks)
    .use(search)
    .use(peers)
    .use(sendTx)
    .use(unban)
    .use(ban)
    .use(sendMsg)
    .use(balance)
    .use(status)
    .use(forge)
    .use(disconnect)
    .use(mempool)
    .use(fstop)
    .use(transaction)
    .use(testDS)
    .delimiter('Write command →')
    .show();
}

export default cli;
