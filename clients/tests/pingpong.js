const rp = require('request-promise-native');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const local = new Requests('127.0.0.1', 3000);
const remote = new Requests(config.tests.nodes[0].ip, 3000);

const test = async () => {
  await rp(local.connect(config.tests.nodes[0].ip));
  setTimeout(async () => {
    await rp(local.sendMessage('ping'));
    await rp(remote.sendMessage('pong'));
  }, 500);
};

test();
