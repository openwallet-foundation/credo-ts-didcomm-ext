# credo-ts-didcomm-ext

DIDComm Extension modules for [Credo](https://github.com/openwallet-foundation/credo-ts).

## Packages

| Package                                                   | Description                                        |
| --------------------------------------------------------- | -------------------------------------------------- |
| [@credo-ts/didcomm-calls](packages/calls)                 | DIDComm WebRTC calls protocol                      |
| [@credo-ts/didcomm-media-sharing](packages/media-sharing) | DIDComm Media Sharing protocol                     |
| [@credo-ts/didcomm-mrtd](packages/mrtd)                   | DIDComm Machine Readable Travel Documents protocol |
| [@credo-ts/didcomm-reactions](packages/reactions)         | DIDComm Message Reactions protocol                 |
| [@credo-ts/didcomm-receipts](packages/receipts)           | DIDComm Message Receipts protocol                  |
| [@credo-ts/didcomm-shorten-url](packages/shorten-url)     | DIDComm Shorten URL protocol                       |
| [@credo-ts/didcomm-user-profile](packages/user-profile)   | DIDComm User Profile protocol                      |

## Migration from the `@2060.io` scope

This repository was transferred from [2060.io](https://github.com/2060-io) to the OpenWallet Foundation. The packages moved from the `@2060.io` scope to the `@credo-ts` scope.

| Old name                                  | New name                          |
| ----------------------------------------- | --------------------------------- |
| `@2060.io/credo-ts-didcomm-calls`         | `@credo-ts/didcomm-calls`         |
| `@2060.io/credo-ts-didcomm-media-sharing` | `@credo-ts/didcomm-media-sharing` |
| `@2060.io/credo-ts-didcomm-mrtd`          | `@credo-ts/didcomm-mrtd`          |
| `@2060.io/credo-ts-didcomm-reactions`     | `@credo-ts/didcomm-reactions`     |
| `@2060.io/credo-ts-didcomm-receipts`      | `@credo-ts/didcomm-receipts`      |
| `@2060.io/credo-ts-didcomm-shorten-url`   | `@credo-ts/didcomm-shorten-url`   |
| `@2060.io/credo-ts-didcomm-user-profile`  | `@credo-ts/didcomm-user-profile`  |

To migrate, replace the old package name with the new package name in your `package.json` and in your imports. The module API did not change.

## Development

```sh
pnpm install
pnpm validate
pnpm test
```

Releases use [release-please](https://github.com/googleapis/release-please). A release pull request is created for each package when a commit with a `feat` or `fix` type lands on `main`. The release workflow publishes the package to npm with [trusted publishing](https://docs.npmjs.com/trusted-publishers).
