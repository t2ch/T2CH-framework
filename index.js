import vorpal from 'vorpal';
import Block from './node/block';
import cli from './clients/cli';
import { readConfig } from './node/helper/config';

const Vorpal = vorpal();

(async () => {
  readConfig();
  await Block.initLatestBlock();
  Vorpal.use(cli);
})();
