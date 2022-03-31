import fastify from 'fastify'
export const server = fastify()
import { deploy } from './routes'
import { StatusCodes } from 'http-status-codes'


server.register(require('fastify-cors'), {
  origin: (origin: any, cb: any) => {
    cb(null, true)
  }
})


server.get('/ping', async (request, reply) => {
  return 'pong\n'
})


server.post('/deploy', deploy)


server.setErrorHandler(function (error: any, _: any, reply: any) {
  // // Log error
  this.log.error(error)
  // Send error response
  reply.status(StatusCodes.BAD_REQUEST).send(error)
})
