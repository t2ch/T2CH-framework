/* eslint-disable no-console */
import { writeFileSync } from 'fs';
import prompts from 'prompts';
import getTimeInSec from '../node/helper/time';
import Coin from '../node/chainCode/coin';
import Block from '../node/block';
import {
  getPublicFromPrivate, publicToAddress, generate as _generate, privateToAddress,
} from '../node/wallet/wallet';

async function generateBlock(amount, privateKey) {
  try {
    let publicKey = getPublicFromPrivate(privateKey);
    const address = `0x${publicToAddress(publicKey).toString('hex')}`;
    publicKey = publicKey.toString('hex');

    const coin = new Coin(
      null,
      address,
      {
        type: 'coin',
        inputs: [{
          txHash: '0',
          index: 0,
          amount,
        }],
        outputs: [{ address, amount }],
      },
      publicKey,
    );
    await coin.signTX(privateKey.substring(2));

    const block = new Block(
      null,
      0,
      '0',
      getTimeInSec(),
      [coin],
      Block.initialBaseTarget,
      null,
      null,
      address,
      '0',
      0,
      publicKey,
    );
    await block.sign(privateKey.substring(2));

    const genesis = JSON.stringify(block);

    return genesis;
  } catch (e) {
    throw Error(`Не удалось сгенерировать genesis блок :(\n${e}`);
  }
}

(async () => {
  console.log('Добро пожаловать в консольную утилиту платформы EVO для настройки genesis блока!');

  let response = await prompts({
    type: 'password',
    name: 'privKey',
    message: 'Введите приватный ключ genesis кошелька (оставьте пустым, если хотите создать новый)',
    validate: (entKey) => {
      if (entKey.length !== 66 && entKey.length !== 64 && entKey.length !== 0) {
        return 'Введенный приватный ключ неверный! Попробуйте снова';
      }

      return true;
    },
  });

  let privateKey = response.privKey;
  if (privateKey === '') {
    const newWallet = _generate();
    console.log(`
      Новый кошелек сгенерирован!

      Адрес: ${newWallet.Address},
      Публичный ключ: ${newWallet.PublicKey},
      Приватный ключ: ${newWallet.PrivateKey}
    `);

    privateKey = newWallet.PrivateKey;
  }
  if (privateKey.length === 64) {
    privateKey = `0x${privateKey}`;
  }

  const addressFromPriv = privateToAddress(privateKey);
  console.log(`
    Кошелек с адресом ${addressFromPriv} выбран!
  `);

  response = await prompts({
    type: 'number',
    name: 'coins',
    message: 'Укажите начальное количество монет типа "coin"',
    initial: 250000000000,
    min: 0,
  });

  const coinsAmount = response.coins;

  try {
    const genesisBlock = await generateBlock(coinsAmount, privateKey);
    writeFileSync('./genesis.json', genesisBlock);
  } catch (e) {
    console.log(e);
    return;
  }

  console.log('Genesis блок успешно создан! :)');
})();
