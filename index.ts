import { server } from './app'

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
