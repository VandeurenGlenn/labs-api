import { read, write, direxists, encrypt, decrypt } from 'crypto-io-utils';
import { userInfo } from 'os';
import { join } from 'path';
import RSA from 'node-rsa';
import inquirer from 'inquirer';
import config from './../node_modules/labs-config/src/index.js';

export default async () => {
  let data, cipher, pub, priv;
  const { keys, set } = await config;
  const answers = await inquirer.prompt([{
    type: 'password',
    name: 'password',
    message: 'Enter passphrase to encrypt/decrypt server keys'
  }]);

  if (keys && keys.public && keys.private) {
    answers.password = null;
    return keys;
  } else {
    const key = new RSA({b: 2048});
    const pair = key.generateKeyPair();
    const newKeys = {
      public: pair.exportKey('pkcs1-public-der'),
      private: pair.exportKey('pkcs1-der')
    };
    await set('keys', newKeys);
    answers.password = null;
    return newKeys;
  }
}
