import fastify from 'fastify'
import * as fs from 'fs'
import pump from 'pump'
import {StatusCodes} from 'http-status-codes'
const server = fastify()
const asb = require("asbuild").main
import { randomBytes } from 'crypto'
import { Readable } from 'stream'

export const HEX = 'hex'
const HASH_LENGTH = 3
function createId(length: number): string {
  return randomBytes(length).toString(HEX)
}



server.get('/ping', async (request, reply) => {
  return 'pong\n'
})


server.post('/compile', async (request, reply) => {
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

    asb([DESTINATION_PATH, OUTPUT_OPTION, OUTPUT_PATH])
    //TODO: Handle exception during IO
    const binaryData = await fs.promises.readFile(OUTPUT_PATH)
    await fs.promises.unlink(DESTINATION_PATH)
    await fs.promises.unlink(OUTPUT_PATH)

    return reply
    .send(binaryData.toString())
    .code(StatusCodes.CREATED)
  })

})

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
