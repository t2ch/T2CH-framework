const PeerList = require('../PeerList');

const test = async () => {
  console.log('start testing ...');

  console.log('adding peer 46.21.249.179 to the list');
  await PeerList.setPeer('46.21.249.179', 1).then(() =>
    console.log('46.21.249.179 added to the list with state 1')
  );

  console.log('getting ips list');
  const buffer = await PeerList.getPeers();
  console.log(buffer);

  console.log('getting state of ' + buffer[0].key);
  await PeerList.getPeerStateByIp(buffer[0].key).then(state =>
    console.log('46.21.249.179 has state ' + state)
  );

  console.log('setting peer ' + buffer[0].key + ' to 2');
  await PeerList.setPeer(buffer[0].key, 2).then(() =>
    console.log('setting complite!')
  );

  console.log('getting state of ' + buffer[0].key);
  await PeerList.getPeerStateByIp(buffer[0].key).then(state =>
    console.log(buffer[0].key + ' has state ' + state)
  );

  console.log('unban all');
  await PeerList.changeStateforAll(2, 1);

  console.log('getting state of ' + buffer[0].key);
  await PeerList.getPeerStateByIp(buffer[0].key).then(state =>
    console.log(buffer[0].key + ' has state ' + state)
  );

  console.log('try get state of unknown peer');
  await PeerList.getPeerStateByIp('1.2.3.4').catch(async () => {
    console.log('peer not found. add peer to the list with state 1');
    await PeerList.setPeer('1.2.3.4', 1).then(async () => {
      console.log('getting ips list');
      console.log(await PeerList.getPeers());
    });
  });

  console.log('read peers w/o 1.2.3.4');
  await PeerList.getSendList('1.2.3.4').then(data => console.log(data));

  return 0;
};

test();
