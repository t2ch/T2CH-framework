const rp = require('request-promise-native');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const remote1 = new Requests(config.tests.nodes[0].ip, 3000);
const remote2 = new Requests(config.tests.nodes[1].ip, 3000);

const test = async () => {
  await rp(remote1.connect(remote2.host));

  setTimeout(async () => {
    await rp(remote1.testmine());
    await rp(remote2.testmine());
  }, 500);

  setTimeout(() => {
    rp(remote1.stop());
    rp(remote2.stop());
  }, 10000);
};

test();
