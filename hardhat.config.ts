
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-deploy'
import {config} from 'dotenv'

const env:any=config()['parsed']

module.exports = {
  solidity: {
    version: "0.8.1",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    factoryDeployer:0, factoryOwner:0
  },
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${env.INFURA_PROJECT_ID}`,
      accounts: [`0x${env.PRIVATE_KEY}`],
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
    alwaysGenerateOverloads: true,
  },
};
