<p align="center">
  <br />
  <img
    alt="Credo Logo"
    src="https://github.com/openwallet-foundation/credo-ts/blob/c7886cb8377ceb8ee4efe8d264211e561a75072d/images/credo-logo.png"
    height="250px"
  />
</p>
<h1 align="center"><b>Credo DRPC Module</b></h1>
<p align="center">
  <a
    href="https://raw.githubusercontent.com/openwallet-foundation/credo-ts/main/LICENSE"
    ><img
      alt="License"
      src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"
  /></a>
  <a href="https://www.typescriptlang.org/"
    ><img
      alt="typescript"
      src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg"
  /></a>
    <a href="https://www.npmjs.com/package/@credo-ts/didcomm-drpc"
    ><img
      alt="@credo-ts/didcomm-drpc version"
      src="https://img.shields.io/npm/v/@credo-ts/didcomm-drpc"
  /></a>

</p>
<br />

DRPC module for [Credo](https://github.com/openwallet-foundation/credo-ts.git). Implements [Aries RFC 0804](https://github.com/hyperledger/aries-rfcs/blob/ea87d2e37640ef944568e3fa01df1f36fe7f0ff3/features/0804-didcomm-rpc/README.md).

### Quick start

In order for this module to work, we have to inject it into the agent to access agent functionality. See the example for more information.

### Example of usage

```ts
import { DidCommDrpcModule } from '@credo-ts/didcomm-drpc'

const agent = new Agent({
  config: {
    /* config */
  },
  dependencies: agentDependencies,
  modules: {
    drpc: new DidCommDrpcModule(),
    /* other custom modules */
  },
})

await agent.initialize()

// Send a request to the specified connection
const responseListener = await senderAgent.modules.drpc.sendRequest(connectionId, {
  jsonrpc: '2.0',
  method: 'hello',
  id: 1,
})

// Listen for any incoming requests
const { request, sendResponse } = await receiverAgent.modules.drpc.recvRequest()

// Process the received request and create a response
const result =
  request.method === 'hello'
    ? { jsonrpc: '2.0', result: 'Hello world!', id: request.id }
    : { jsonrpc: '2.0', error: { code: DidCommDrpcErrorCode.METHOD_NOT_FOUND, message: 'Method not found' } }

// Send the response back
await sendResponse(result)
```

### Drizzle storage

The package provides a drizzle record bundle for [`@credo-ts/drizzle-storage`](https://github.com/openwallet-foundation/credo-ts/tree/main/packages/drizzle-storage) under the `/drizzle` subpath. Install `@credo-ts/drizzle-storage` and `drizzle-orm`, and register the bundle together with the `didcomm` bundle:

```ts
import { didcommDrpcBundle } from '@credo-ts/didcomm-drpc/drizzle'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'

const storage = new DrizzleStorageModule({
  database,
  bundles: [didcommBundle, didcommDrpcBundle],
})
```

Pass the subpath to the `--bundle` option of the drizzle-storage CLI to apply the migrations:

```sh
pnpm drizzle-storage --bundle core --bundle didcomm --bundle @credo-ts/didcomm-drpc/drizzle migrate --dialect sqlite --database-url "file:./agent.db"
```

In React Native, import the SQLite migrations from `@credo-ts/didcomm-drpc/drizzle/migrations/sqlite` and pass them to `applyReactNativeMigrations`.

The bundle replaces the `drpc` bundle of `@credo-ts/drizzle-storage`. The bundle name, the table name, and the migrations did not change, so an existing database keeps working.
