class Requests {
  constructor(host, port) {
    this.host = host;
    this.port = port;
  }

  createUrl(ip, path) {
    path = path || '';
    return `http://${ip}:${this.port}/${path}`;
  }

  //GET

  status() {
    return {
      uri: this.createUrl(this.host, 'status'),
      json: true,
    };
  }

  peers() {
    return {
      uri: this.createUrl(this.host, 'peers'),
      json: true,
    };
  }

  blocks() {
    return {
      uri: this.createUrl(this.host, 'blocks'),
      json: true,
    };
  }

  mempool() {
    return {
      uri: this.createUrl(this.host, 'mempool'),
      json: true,
    };
  }

  unban() {
    return {
      uri: this.createUrl(this.host, 'unban'),
      json: true,
    };
  }

  disconnect() {
    return {
      uri: this.createUrl(this.host, 'disconnect'),
      json: true,
    };
  }

  wallets() {
    return {
      uri: this.createUrl(this.host, 'wallets'),
      json: true,
    };
  }

  testmine() {
    return {
      uri: this.createUrl(this.host, 'testmine'),
      json: true,
    };
  }

  stop() {
    return {
      uri: this.createUrl(this.host, 'stop'),
      json: true,
    };
  }

  //POST

  connect(ip) {
    return {
      method: 'POST',
      uri: this.createUrl(this.host, 'connect'),
      body: {
        ip: ip,
      },
      json: true,
    };
  }

  ban(ip) {
    return {
      method: 'POST',
      uri: this.createUrl(this.host, 'ban'),
      body: {
        ip: ip,
      },
      json: true,
    };
  }

  sendMessage(message) {
    return {
      method: 'POST',
      uri: this.createUrl(this.host, 'sendMsg'),
      body: {
        message: message,
      },
      json: true,
    };
  }

  sendTX(tx) {
    return {
      method: 'POST',
      uri: this.createUrl(this.host, 'sendTx'),
      body: {
        message: tx.message,
        to: tx.to,
      },
      json: true,
    };
  }

  sendCoin(tx) {
    return {
      method: 'POST',
      uri: this.createUrl(this.host, 'sendCoin'),
      body: {
        amount: tx.amount,
        to: tx.to,
      },
      json: true,
    };
  }
}

module.exports = Requests;
