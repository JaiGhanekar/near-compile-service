import fastify from 'fastify'
import * as fs from 'fs'
import pump from 'pump'
import {StatusCodes} from 'http-status-codes'
const server = fastify()
const asb = require("asbuild").main
import { randomBytes } from 'crypto'
import { Readable } from 'stream'
import * as nearAPI from 'near-api-js'

export const HEX = 'hex'
const HASH_LENGTH = 3
function createId(length: number): string {
  return randomBytes(length).toString(HEX)
}

async function connection(accountName: string, key: string): Promise<nearAPI.Near> {
  const { keyStores, connect, KeyPair } = nearAPI;

  const keyStore = new keyStores.InMemoryKeyStore()
  keyStore.setKey('testnet', accountName, KeyPair.fromString(key))
  const config = {
    networkId: "testnet",
    keyStore,
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
    headers: {}
  }

  return connect(config);
}

async function loadAccount(accountName: string, key: string) : Promise<any> {
  const near = await connection(accountName, key)
  return await near.account(accountName)
}

server.register(require('fastify-cors'), {
  origin: (origin: any, cb: any) => {
    cb(null, true)
  }
})


server.get('/ping', async (request, reply) => {
  return 'pong\n'
})


server.post('/deploy', async (request, reply) => {
  const body = await (request.body as any)
  const id = createId(HASH_LENGTH)


  const DESTINATION_PATH = `./assembly/index-${id}.ts`
  const OUTPUT_PATH = `./build/release/index-${id}.wasm`
  const OUTPUT_OPTION = '--outFile'

  const dest = fs.createWriteStream(DESTINATION_PATH)

  pump(Readable.from([body]), dest, async function(error) {
    if (error) {
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
})
server.setErrorHandler(function (error: any, _: any, reply: any) {
  // // Log error
  this.log.error(error)
  // Send error response
  reply.status(StatusCodes.BAD_REQUEST).send(error)
})

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
