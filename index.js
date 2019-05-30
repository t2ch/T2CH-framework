import vorpal from 'vorpal';
import Block from './node/block';
import cli from './clients/cli';

const Vorpal = vorpal();

(async () => {
  await Block.initLatestBlock();
  Vorpal.use(cli);
})();
