const rp = require('request-promise-native');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const local = new Requests('127.0.0.1', 3000);

const test = async () => {
  await rp(
    local.sendCoin({
      amount: 1,
      to: config.tests.nodes[0].wallet.addr,
    })
  );
};

test();
