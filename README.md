# Near Compiler Service
This service is a dependency used by https://github.com/JaiGhanekar/Nearby and is based on [fastify](https://github.com/fastify/fastify/blob/main/README.md#quick-start)

#Endpoints
There is one endpoint for this service `deploy` which accepts near smart contracts and compiles them using [asbuild](https://www.npmjs.com/package/asbuild).
After compilation the web assembly data is deployed to the Near blockchain using the [near sdk](https://github.com/near/near-api-js)


# Example Request
```
Account - The accountid of the near wallet
Key - Near key acquired from a signin
{
  url: '/deploy',
  method: 'POST',
  headers: {'Content-Type': 'text/plain', 'accountid': ACCOUNT, key: KEY},
  payload: `export function hello(): string {return "hello world"}`
}
```


# Building and Serving
The following command can be used to build and serve the project.
`npm run build && npm run start`

# Testing
The service is tested using `jest` and `fastify`. An example test can be found in the  `/tests` directory. The tests can be run with `npm run test`

# Deployments:
The service can be found at the following endpoints:
* Testnet: https://near-compiler-service-testnet.onrender.com
* Mainnet: https://near-compiler-service.onrender.com


**Note**:
 Testnet is slower than mainnet.
