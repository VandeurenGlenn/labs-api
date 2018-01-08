import { read, write, direxists, encrypt, decrypt } from 'crypto-io-utils';
import { userInfo } from 'os';
import { join } from 'path';
import RSA from 'node-rsa';
import inquirer from 'inquirer';
const userdir = userInfo().homedir;
const store = {};
const pemPath = join(userdir, '.revolutionlabs', 'pem');

const setKeys = obj => {
  return JSON.stringify({
    public: new Buffer(obj.public).toString('base64'),
    private: new Buffer(obj.private).toString('base64')
  })
}

export default async () => {
  let data, cipher, pub, priv;
  const answers = await inquirer.prompt([{
    type: 'password',
    name: 'password',
    message: 'Enter passphrase to encrypt/decrypt server keys'
  }]);
  try {
    data = await read(pemPath, 'string')
    answers.password = null;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const key = new RSA({b: 2048});
      const pair = key.generateKeyPair();
      data = {
        public: pair.exportKey('pkcs1-public-der'),
        private: pair.exportKey('pkcs1-der')
      };
      await write(`${pemPath}`, JSON.stringify(data));
      answers.password = null;
    } else {
      throw error;
    }
  }
  global.pempublic = data.public;
  global.pemprivate = data.private
}
