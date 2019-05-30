const rp = require('request-promise-native');

const Requests = require('../rpc/Requests.js');

const localRequests = new Requests('localhost', 3000);

const test = async () => {
  console.log(`Запрос статуса ноды...`);

  await rp(localRequests.status()).then(async data => {
    console.log(`Вывод статуса ноды: ${JSON.stringify(data)}`);
  });

  console.log(`Запрос списка блоков...`);

  await rp(localRequests.blocks()).then(data => {
    console.log(`Вывод списка валидированных блоков: ${JSON.stringify(data)}`);
  });

  console.log(`Запрос списка пиров...`);

  await rp(localRequests.peers()).then(data => {
    console.log(`Вывод списка пиров: ${JSON.stringify(data)}`);
  });

  console.log(`Запрос мемпула ...`);

  await rp(localRequests.mempool()).then(data => {
    console.log(`Вывод мемпула: ${JSON.stringify(data)}`);
  });
};

test();
