
import * as fs from 'fs'
import pump from 'pump'
import { StatusCodes } from 'http-status-codes'
const asb = require("asbuild").main
import { randomBytes } from 'crypto'
import { Readable } from 'stream'
import * as nearAPI from 'near-api-js'
const { NETWORK_ID } = process.env

export const HEX = 'hex'
const HASH_LENGTH = 3
function createId(length: number): string {
  return randomBytes(length).toString(HEX)
}

enum NetworkId {
  Test = 'testnet',
  Beta = 'betanet',
  Main = 'mainnet'
}

async function connection(accountName: string, key: string, networkId: string = NetworkId.Test): Promise<nearAPI.Near> {
  const { keyStores, connect, KeyPair } = nearAPI;

  const keyStore = new keyStores.InMemoryKeyStore()
  keyStore.setKey(networkId, accountName, KeyPair.fromString(key))
  const config = {
    networkId: networkId,
    keyStore,
    nodeUrl: `https://rpc.${networkId}.near.org`,
    walletUrl: `https://wallet.${networkId}.near.org`,
    helperUrl: `https://helper.${networkId}.near.org`,
    explorerUrl: `https://explorer.${networkId}.near.org`,
    headers: {}
  }

  return connect(config);
}

async function loadAccount(accountName: string, key: string) : Promise<any> {
  const networkId =  NETWORK_ID ??  NetworkId.Test
  const near = await connection(accountName, key, networkId)
  return await near.account(accountName)
}

export async function deploy(request: any, reply: any): Promise<any> {
  const body = await (request.body as any)
  const id = createId(HASH_LENGTH)

  const DESTINATION_PATH = `./assembly/index-${id}.ts`
  const OUTPUT_PATH = `./build/release/index-${id}.wasm`
  const OUTPUT_OPTION = '--outFile'

  const dest = fs.createWriteStream(DESTINATION_PATH)

  pump(Readable.from([body]), dest, async function(error) {
    if (error) {
      fs.unlinkSync(DESTINATION_PATH)
      return reply
      .send(error.message)
      .code(StatusCodes.BAD_REQUEST)
    }

    try {
      asb([DESTINATION_PATH, OUTPUT_OPTION, OUTPUT_PATH], (error: any) => {
        if (error) {
          fs.unlinkSync(DESTINATION_PATH)
          throw error
        }
      })
      //TODO: Handle exception during IO
      const binaryData = await fs.promises.readFile(OUTPUT_PATH)
      const headers = (request.headers as any)
      const {accountid, key} = headers
      const account = await loadAccount(accountid, key)
      const deployment = await account.deployContract(binaryData)


      await fs.promises.unlink(DESTINATION_PATH)
      await fs.promises.unlink(OUTPUT_PATH)


      process.on('uncaughtException', error => {
        fs.unlinkSync(DESTINATION_PATH)
        console.error(error, 'Uncaught Exception thrown')
        process.exit(1);
      })

      return reply
      .send({wasm: binaryData.toString(), deployment: deployment})
      .code(StatusCodes.CREATED)
    } catch (error) {
      return reply
      .send(error)
      .code(StatusCodes.BAD_REQUEST)
    }
  })
}
