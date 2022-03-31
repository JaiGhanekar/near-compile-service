import { server } from '../app'

//Temporary test net key for the test
const ACCOUNT =  'nearby-example3.testnet'
const KEY = 'ed25519:3Z8bURjqNY4Ndo3mSeu3sRNQuNWhf1MkwRDKBy3Z8UHhZMi6CG9W9wHcQiNBCKa3nU3NCKtATsFvxeGzXyAMzuQ8'
const TIMEOUT_MS = 10000
jest.setTimeout(TIMEOUT_MS)
describe('Deploy endpoint builds and deploys to near', () => {
  test('It should take in valid typescript and use assembly script build and then deploy the smart contract', async () => {
    const response = await server.inject({
      url: '/deploy',
      method: 'POST',
      headers: {'Content-Type': 'text/plain', 'accountid': ACCOUNT, key: KEY},
      payload: `export function hello(): string {return "hello world"}`
    })
    console.log('status code: ', response.statusCode)
    expect(response.statusCode).toEqual(200)

  })
})
