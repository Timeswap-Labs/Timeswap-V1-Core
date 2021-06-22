import { web3 } from "hardhat";
import { JsonRpcResponse } from "web3-core-helpers/types/index";

const advanceTime = (time: number) => {
  return new Promise((resolve, reject) => {
    let provider = web3.currentProvider!;

    if (!(typeof provider === "string" || provider instanceof String)) {
      provider.send?.(
        {
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [time],
          id: new Date().getTime(),
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        }
      );
    }
  });
};

const advanceBlock = () => {
  return new Promise((resolve, reject) => {
    let provider = web3.currentProvider!;

    if (!(typeof provider === "string" || provider instanceof String)) {
      provider.send?.(
        {
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [],
          id: new Date().getTime(),
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          const newBlockHash = web3.eth
            .getBlock("latest")
            .then((block) => block.hash);

          return resolve(newBlockHash);
        }
      );
    }
  });
};

const advanceTimeAndBlock = async (time: number) => {
  await advanceTime(time);
  await advanceBlock();
};

const now = async () => {
  const block = await web3.eth.getBlock("latest");
  return BigInt(block.timestamp);
};

const getBlock = (blockHash: string) => {
  return new Promise((resolve: (value: JsonRpcResponse) => void, reject) => {
    let provider = web3.currentProvider!;

    if (!(typeof provider === "string" || provider instanceof String)) {
      provider.send?.(
        {
          jsonrpc: "2.0",
          method: "eth_getBlockByHash",
          params: [blockHash, false],
          id: new Date().getTime(),
        },
        (err, result) => {
          if (err) {
            return reject(err);
          } else if (result === undefined) {
            return reject(Error("Result is undefined"));
          } else {
            return resolve(result);
          }
        }
      );
    } else {
      reject(Error("Current Provider not available"));
    }
  });
};

const getTimestamp = async (blockHash: string) => {
  const block = await getBlock(blockHash);
  return web3.utils.hexToNumber(block.result.timestamp);
};

export default {
  now,
  advanceTimeAndBlock,
  getTimestamp,
};
