import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import { config } from 'dotenv'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'solidity-coverage'

const env: any = config()['parsed']
console.log(env)

export default {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    factoryDeployer: 0,
    factoryOwner: 0,
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
  mocha: {
    timeout: 60000,
  },
}
