const rp = require('request-promise-native');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const local = new Requests('127.0.0.1', 3000);
const remote1 = new Requests(config.tests.nodes[0].ip, 3000);
const remote2 = new Requests(config.tests.nodes[1].ip, 3000);

const test = async () => {
  await rp(local.connect(remote1.host));
  setTimeout(async () => {
    await rp(local.testmine());
    await rp(remote1.testmine());
  }, 500);

  setTimeout(async () => {
    await rp(remote2.testmine());
  }, 1000);

  setTimeout(async () => {
    await rp(remote1.connect(remote2.host));
  }, 10000);

  setTimeout(() => {
    rp(local.stop());
    rp(remote1.stop());
    rp(remote2.stop());
  }, 300000);
};

test();
