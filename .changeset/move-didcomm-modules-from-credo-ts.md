---
'@credo-ts/didcomm-action-menu': minor
'@credo-ts/didcomm-drpc': minor
'@credo-ts/didcomm-question-answer': minor
---

Move the Action Menu, DRPC, and Question Answer modules from the Credo repository to the Credo DIDComm extensions repository. Rename the packages from `@credo-ts/action-menu`, `@credo-ts/drpc`, and `@credo-ts/question-answer` to `@credo-ts/didcomm-action-menu`, `@credo-ts/didcomm-drpc`, and `@credo-ts/didcomm-question-answer`. All exported names now carry the `DidComm` prefix, for example `DidCommActionMenuModule`, `DidCommDrpcApi`, and `DidCommQuestionAnswerRecord`. The event type values carry the prefix too. The stored record types did not change. Update the package name in `package.json` and in imports, and add the prefix to the imported names.

Each package now provides its drizzle record bundle under the `/drizzle` subpath, for example `didcommDrpcBundle` from `@credo-ts/didcomm-drpc/drizzle`. The bundle replaces the `action-menu`, `drpc`, and `question-answer` bundles of `@credo-ts/drizzle-storage`. The bundle names, the table names, and the migrations did not change, so existing databases keep working. The `@credo-ts/drizzle-storage` and `drizzle-orm` packages are optional peer dependencies.
