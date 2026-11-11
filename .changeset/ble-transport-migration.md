---
'@credo-ts/transport-ble': minor
---

Move the BLE transport package to the Credo DIDComm extensions repository, retaining the `@credo-ts/transport-ble` package name.

This release requires Credo 0.7.x and React Native 0.73.4 or newer. Transports now use the `@credo-ts/didcomm` interfaces and are registered through `agent.didcomm`. The package now publishes ESM with TypeScript declarations.
