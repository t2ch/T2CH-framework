const p2p = require('../p2p');
const PeerList = require('../PeerList');
const db = require('../../db').getInstance('peers');

test_list = new PeerList(db);

console.log('init p2p');
const test_p2p = new p2p([], test_list, 'ready');

const test = async () => {
  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('check validation foo (return true)');
  console.log(await test_p2p.validatePeer('46.21.249.179'));

  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('set ip state to 0');
  await test_list.setPeer('46.21.249.179', 0);

  console.log('check validation foo (return true)');
  console.log(await test_p2p.validatePeer('46.21.249.179'));
  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('set ip state to 2');
  await test_list.setPeer('46.21.249.179', 2);

  console.log('check validation foo (return false)');
  console.log(await test_p2p.validatePeer('46.21.249.179'));
  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('check isSocketOpen foo (return false)');
  console.log(await test_p2p.isSocketOpen('46.21.249.179'));
  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('set ip state to 0');
  await test_list.setPeer('46.21.249.179', 0);

  console.log('check isSocketOpen foo (return true)');
  console.log(await test_p2p.isSocketOpen('46.21.249.179'));
  console.log('get list of peers');
  console.log(await test_list.getPeers());

  console.log('set ip state to 1');
  await test_list.setPeer('46.21.249.179', 1);

  console.log('check isSocketOpen foo (return false)');
  console.log(await test_p2p.isSocketOpen('46.21.249.179'));
  console.log('get list of peers');
  console.log(await test_list.getPeers());
};

for (let i = 0; i < 10; i++) {
  test();
}
