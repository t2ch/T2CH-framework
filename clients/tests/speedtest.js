const rp = require('request-promise-native');

const Requests = require('../rpc/Requests');
const config = require('../../config');

const remote1 = new Requests(config.tests.nodes[0].ip, 3000);
const remote2 = new Requests(config.tests.nodes[1].ip, 3000);

const test = async () => {
  await rp(remote1.connect(remote2.host));

  setTimeout(async () => {
    for (let i = 0; i < 10; i++) {
      await rp(
        remote1.sendCoin({
          amount: 1,
          to: config.tests.nodes[1].wallet.addr,
        })
      );
      await rp(
        remote2.sendCoin({
          amount: 1,
          to: config.tests.nodes[0].wallet.addr,
        })
      );
    }
  }, 500);
};

test();
