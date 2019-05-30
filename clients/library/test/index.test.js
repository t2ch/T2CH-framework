'use strict';

const webED = require('./../lib/index');
const bch = new webED('http://localhost:3000');
/*(() => {
    let bch = new webED('http://localhost:8080');

    let wallet = bch.createWallet();
    console.log(wallet);
})();*/

it('создает кошелек', () => {
  let wallet = bch.createWallet();

  if (
    wallet.PrivateKey.length != 66 ||
    wallet.PublicKey.length != 128 ||
    wallet.Address.length != 42
  )
    throw 'все плоха';
  //else
  //console.log(wallet)
});

it('подписывает транзакцию "coin"', async () => {
  // console.log(await bch.getVotingResults('805268ab33379fbc13264c4fbe1829bff3b509cd9cb717faf1cdf87519dc0a3e'));
  await bch.sendVote('41b47f567dfa5d455aa22ae29d5643d863e0f847592479e0fad237a52a15a706', 0,
    '488fe7dbfb843d22345b9ff4a74085c1682dda00df712a5c9010900a23fa8337');
  // let i = 0;
  // setTimeout(async function run() {
  //   if (i < 20) {
  //     await func();
  //     setTimeout(run, 1000);
  //     ++i;
  //   }
  // }, 1000);
  // let func = async () => {
  //   await bch.sendCoin(
  //     '0xd5d7672e1cc819e4225b917d2b943afe727e3f03',
  //     10000,
  //     '0x61a85e134138553b092e639ff49d0790e79360be3935d816e25bf5f6a9fdcc85'
  //   );
  // };
});
