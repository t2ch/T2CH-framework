import Blocks from './containers/Blocks';
import BlockDetails from './components/BlockDetails';
import Transactions from './containers/Transactions';
import TransactionDetails from './components/TransactionDetails';
import Peers from './containers/Peers';
import Mempool from './containers/Mempool';
import Wallets from './containers/Wallets';
import WalletDetails from './containers/WalletDetails';
import Home from './components/Home';

const routes = [
  {
    path: '/',
    exact: true,
    component: Home,
  },
  {
    path: '/blocks',
    exact: true,
    component: Blocks,
  },
  {
    path: '/blocks/:hash',
    exact: true,
    component: BlockDetails,
  },
  {
    path: '/blocks/:blockHash/:hash',
    exact: true,
    component: TransactionDetails,
  },
  {
    path: '/transactions',
    exact: true,
    component: Transactions,
  },
  {
    path: '/transactions/:hash',
    exact: true,
    component: TransactionDetails,
  },
  {
    path: '/peers',
    exact: true,
    component: Peers,
  },
  {
    path: '/mempool',
    exact: true,
    component: Mempool,
  },
  {
    path: '/mempool/:hash',
    exact: true,
    component: TransactionDetails,
  },
  {
    path: '/wallets',
    exact: true,
    component: Wallets,
  },
  {
    path: '/wallets/:wallet',
    exact: true,
    component: WalletDetails,
  },
  {
    path: '/wallets/:wallet/:hash',
    exact: true,
    component: TransactionDetails,
  },
];

export default routes;
