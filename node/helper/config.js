import { readFileSync } from 'fs';

const configPath = './config.json';
const config = {};

export function readConfig() {
  Object.assign(config, JSON.parse(readFileSync(configPath, 'utf8')));
}

export default config;
