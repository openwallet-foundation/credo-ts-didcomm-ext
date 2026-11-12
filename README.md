# credo-ts-didcomm-ext

DIDComm Extension modules for [Credo](https://github.com/openwallet-foundation/credo-ts).

## Packages

| Package                                                       | Description                                        |
| ------------------------------------------------------------- | -------------------------------------------------- |
| [@credo-ts/didcomm-action-menu](packages/action-menu)         | DIDComm Action Menu protocol                       |
| [@credo-ts/didcomm-calls](packages/calls)                     | DIDComm WebRTC calls protocol                      |
| [@credo-ts/didcomm-drpc](packages/drpc)                       | DIDComm DRPC protocol                              |
| [@credo-ts/didcomm-media-sharing](packages/media-sharing)     | DIDComm Media Sharing protocol                     |
| [@credo-ts/didcomm-mrtd](packages/mrtd)                       | DIDComm Machine Readable Travel Documents protocol |
| [@credo-ts/didcomm-question-answer](packages/question-answer) | DIDComm Question Answer protocol                   |
| [@credo-ts/didcomm-reactions](packages/reactions)             | DIDComm Message Reactions protocol                 |
| [@credo-ts/didcomm-receipts](packages/receipts)               | DIDComm Message Receipts protocol                  |
| [@credo-ts/didcomm-shorten-url](packages/shorten-url)         | DIDComm Shorten URL protocol                       |
| [@credo-ts/didcomm-user-profile](packages/user-profile)       | DIDComm User Profile protocol                      |

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

To migrate, replace the old package name with the new package name in your `package.json` and in your imports. The module API did not change. The `@credo-ts` packages need Credo 0.7.2 or a later 0.7 release. If you are still on Credo 0.6, keep using the `@2060.io` packages.

## Migration from the Credo repository

The Action Menu, DRPC, and Question Answer modules moved from the [Credo repository](https://github.com/openwallet-foundation/credo-ts) to this repository. The package names changed, and the exported names now carry the `DidComm` prefix. The protocol behavior and the stored records did not change.

| Old name                    | New name                            |
| --------------------------- | ----------------------------------- |
| `@credo-ts/action-menu`     | `@credo-ts/didcomm-action-menu`     |
| `@credo-ts/drpc`            | `@credo-ts/didcomm-drpc`            |
| `@credo-ts/question-answer` | `@credo-ts/didcomm-question-answer` |

To migrate:

1. Replace the old package name with the new package name in your `package.json` and in your imports.
2. Add the `DidComm` prefix to every imported class, enum, type, and event type. For example, `ActionMenuModule` is now `DidCommActionMenuModule`, `DrpcApi` is now `DidCommDrpcApi`, and `QuestionAnswerEventTypes.QuestionAnswerStateChanged` is now `DidCommQuestionAnswerEventTypes.DidCommQuestionAnswerStateChanged`.
3. If you compare event type strings instead of the enum members, update the strings. They carry the prefix too, for example `DidCommDrpcRequestStateChanged`.

Some names did not change: the API option types without a protocol name, such as `CreateMenuOptions`, and the DRPC validators `isValidDrpcRequest` and `isValidDrpcResponse`. The question-answer model `ValidResponse` is now `DidCommQuestionAnswerValidResponse`.

### Drizzle storage

The `action-menu`, `drpc`, and `question-answer` bundles of `@credo-ts/drizzle-storage` decode the stored records into the classes of the old packages. Do not combine them with the new packages. Each new package provides its own bundle under the `/drizzle` subpath. Replace the old bundle with the new one:

| Old bundle                                                              | New bundle                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `actionMenuBundle` from `@credo-ts/drizzle-storage/action-menu`         | `didcommActionMenuBundle` from `@credo-ts/didcomm-action-menu/drizzle`         |
| `drpcBundle` from `@credo-ts/drizzle-storage/drpc`                      | `didcommDrpcBundle` from `@credo-ts/didcomm-drpc/drizzle`                      |
| `questionAnswerBundle` from `@credo-ts/drizzle-storage/question-answer` | `didcommQuestionAnswerBundle` from `@credo-ts/didcomm-question-answer/drizzle` |
