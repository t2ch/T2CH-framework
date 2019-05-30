const rp = require('request-promise-native');
const wallet = require('../../node/wallet.js');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const local = new Requests('127.0.0.1', 3000);

let start;

const TxRequest = async (_amount, _addr) => {
  await rp(
    local.sendCoin({
      amount: _amount,
      to: _addr,
    })
  );
};

test = async () => {
  let addrs = [];
  for (let i = 0; i < 10000; i++) {
    const unit = await wallet.generate();
    await addrs.push(`0x${unit.Address}`);
  }
  console.log(`txs:${addrs.length}`);
  start = new Date();
  await rp(local.mine());
  for (let i = 0; i < 10000; i++) {
    await TxRequest(1, addrs[i]);
    console.log(i);
  }
};

test().then(() => {
  console.log(start);
  console.log(new Date());
});
