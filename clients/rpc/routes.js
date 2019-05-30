import express from 'express';
import { readFileSync } from 'fs';
import DB from '../../node/db';
import Block from '../../node/block';
import Mempool from '../../node/mempool';
import parseTXObj, { txTypes } from '../../node/helper/parseObj';
// FIXME: исправить циклическую зависимость
import {
  getTransactions,
  getAllBlocks,
  sendSignedTx,
  getPeers,
  getBalance,
} from '../actions';

const blockHashesDB = DB.getInstance('blocksHashes');
const blockDB = DB.getInstance('blocks');
const transactionDB = DB.getInstance('txs');

const router = express.Router();

router.get('/blockhashes', async (req, res) => {
  const blockHashes = [];
  try {
    const response = await (new Promise((resolve) => {
      blockHashesDB.createReadStream({})
        .on('data', (data) => {
          blockHashes.push({
            index: parseInt(data.key, 10),
            hash: data.value,
          });
        })
        .on('end', () => {
          resolve(blockHashes);
        });
    }));

    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/blockhashes', async (req, res) => {
  const blockHashes = [];
  let i = 0;
  try {
    const limit = {
      start: parseInt(req.body.start, 10),
      end: parseInt(req.body.end, 10),
    };
    const response = await (new Promise((resolve) => {
      blockHashesDB.createReadStream({})
        .on('data', (data) => {
          if (i === limit.end + 1) {
            resolve(blockHashes);
          } else {
            if (i >= limit.start) {
              blockHashes.push({
                index: parseInt(data.key, 10),
                hash: data.value,
              });
            }
            i += 1;
          }
        })
        .on('end', () => {
          resolve(blockHashes);
        });
    }));

    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const response = await getTransactions({});
    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/transactions', async (req, res) => {
  const transactions = [];
  let i = 0;
  try {
    const limit = {
      start: parseInt(req.body.start, 10),
      end: parseInt(req.body.end, 10),
    };
    const response = await (new Promise((resolve) => {
      transactionDB.createReadStream({})
        .on('data', (data) => {
          if (i === limit.end + 1) {
            resolve(transactions);
          } else {
            if (i >= limit.start) {
              transactions.push(data);
            }
            i += 1;
          }
        })
        .on('end', () => {
          resolve(transactions);
        });
    }));

    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/blocks', async (req, res) => {
  try {
    const response = await getAllBlocks();
    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/blocks/length', async (req, res) => {
  const length = await getAllBlocks('quantity');
  res.send({ length });
});

router.post('/blocks', async (req, res) => {
  const blocks = [];
  let i = 0;
  try {
    const limit = {
      start: parseInt(req.body.start, 10),
      end: parseInt(req.body.end, 10),
    };
    const response = await (new Promise((resolve) => {
      blockDB.createReadStream({ keys: false, values: true })
        .on('data', (data) => {
          if (i === limit.end + 1) {
            resolve(blocks);
          } else {
            if (i >= limit.start) {
              blocks.push(data);
            }
            i += 1;
          }
        })
        .on('end', () => {
          resolve(blocks);
        });
    }));

    res.send(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/blockhashes/:index', async (req, res) => {
  const key = Block.prepareIndex(req.params.index);
  try {
    const data = await blockHashesDB.get(key);
    res.send(data);
  } catch (e) {
    res.status(404).send(e);
  }
});

router.get('/blocks/:block', async (req, res) => {
  const param = req.params.block;
  if (Number.isInteger(Number(param))) {
    const key = Block.prepareIndex(param);
    try {
      const hash = await blockHashesDB.get(key);
      const data = await blockDB.get(hash);
      res.send(data);
    } catch (e) {
      res.status(404).send(e);
    }
  } else {
    try {
      const data = await blockDB.get(param);
      res.send(data);
    } catch (e) {
      res.status(404).send(e);
    }
  }
});

router.get('/transactions/:hash', async (req, res) => {
  try {
    const response = await (new Promise((resolve, reject) => {
      transactionDB.createReadStream({ keys: false, values: true })
        .on('data', (data) => {
          if (data.hash === req.params.hash) {
            resolve(data);
          }
        })
        .on('end', () => {
          reject(new Error('key not found'));
        });
    }));

    res.send(response);
  } catch (e) {
    console.log(e);
    res.status(404).send(e);
  }
});

router.get('/mempool', (req, res) => {
  try {
    res.send(Mempool.getMempool());
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/mempool/:hash', (req, res) => {
  const responce = Mempool.getMempool().find(tx => tx.hash === req.params.hash);
  if (responce !== undefined) {
    res.send(responce);
  } else {
    res.status(404).send('not found');
  }
});

router.post('/sendtx', async (req, res) => {
  try {
    if (!req.body.data) {
      throw Error('Broken transaction :(');
    }
    let tx = req.body;
    if (tx.data.voters === 'default') {
      tx.data.voters = readFileSync('default-wallets', 'utf8')
        .replace(/\n/g, ',')
        .split(',');
    }

    tx = parseTXObj(tx);
    await Mempool.addTransaction(tx);
    sendSignedTx(tx);

    res.status(200).send('tx sended');
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

router.post('/gentx', async (req, res) => {
  const params = req.body;

  try {
    const tx = txTypes[params.type].genTX(params.from, params.publicKey, params);
    res.status(200).send(JSON.stringify(tx));
  } catch (e) {
    res.status(500);
  }
});


router.get('/peers', async (req, res) => {
  try {
    const data = await getPeers();
    res.send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/balance/:address', async (req, res) => {
  try {
    const data = await getBalance(req.params.address);
    res.send({ amount: data });
  } catch (e) {
    res.status(500).send(e);
  }
});

// TODO: refactor to race db search

router.get('/search/:key', async (req, res) => {
  let { key } = req.params;
  if (key.slice(0, 2) === '0x') key = key.slice(2);

  const mempoolData = Mempool.getMempool().find(tx => tx.hash === key);

  if (mempoolData !== undefined) {
    res.send(`mempool/${mempoolData.hash}`);
  } else {
    new Promise((resolve, reject) => {
      transactionDB.createReadStream({ keys: false, values: true })
        .on('data', (data) => {
          if (data.hash === key) {
            resolve(data);
          }
        })
        .on('end', () => {
          reject(new Error('key not found'));
        });
    }).then((data) => {
      res.send(`transactions/${data.hash}`);
    }).catch(async () => {
      const param = key;
      if (Number.isInteger(Number(param))) {
        const index = Block.prepareIndex(param);
        try {
          res.send(`blocks/${await blockHashesDB.get(index)}`);
        } catch (e) {
          res.status(404).send(e);
        }
      } else {
        try {
          const data = await blockDB.get(param);
          res.send(`blocks/${data.hash}`);
        } catch (e) {
          res.status(404).send(e);
        }
      }
    });
  }
});

export default router;
