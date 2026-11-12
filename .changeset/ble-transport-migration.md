---
'@credo-ts/didcomm-transport-ble': minor
---

Move the BLE transport package to the Credo DIDComm extensions repository and rename it from `@credo-ts/transport-ble` to `@credo-ts/didcomm-transport-ble`. Update installation commands and imports to use the new package name.

This release requires Credo 0.7.x and React Native 0.73.4 or newer. Transports now use the `@credo-ts/didcomm` interfaces and are registered through `agent.didcomm`. The package now publishes ESM with TypeScript declarations.

The transport has not yet been tested with Credo 0.7.x and may be unstable or not work as expected.
