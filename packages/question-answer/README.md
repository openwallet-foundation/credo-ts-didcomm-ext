<p align="center">
  <br />
  <img
    alt="Credo Logo"
    src="https://github.com/openwallet-foundation/credo-ts/blob/c7886cb8377ceb8ee4efe8d264211e561a75072d/images/credo-logo.png"
    height="250px"
  />
</p>
<h1 align="center"><b>Credo Question Answer Module</b></h1>
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
    <a href="https://www.npmjs.com/package/@credo-ts/didcomm-question-answer"
    ><img
      alt="@credo-ts/didcomm-question-answer version"
      src="https://img.shields.io/npm/v/@credo-ts/didcomm-question-answer"
  /></a>

</p>
<br />

Question Answer module for [Credo](https://github.com/openwallet-foundation/credo-ts.git). Implements [Aries RFC 0113](https://github.com/hyperledger/aries-rfcs/blob/1795d5c2d36f664f88f5e8045042ace8e573808c/features/0113-question-answer/README.md).

### Quick start

In order for this module to work, we have to inject it into the agent to access agent functionality. See the example for more information.

### Example of usage

```ts
import { DidCommQuestionAnswerModule } from '@credo-ts/didcomm-question-answer'

const agent = new Agent({
  config: {
    /* config */
  },
  dependencies: agentDependencies,
  modules: {
    questionAnswer: new DidCommQuestionAnswerModule(),
    /* other custom modules */
  },
})

await agent.initialize()

// To send a question to a given connection
await agent.modules.questionAnswer.sendQuestion(connectionId, {
  question: 'Do you want to play?',
  validResponses: [{ text: 'Yes' }, { text: 'No' }],
})

// Questions and Answers are received as DidCommQuestionAnswerStateChangedEvent

// To send an answer related to a given question answer record
await agent.modules.questionAnswer.sendAnswer(questionAnswerRecordId, 'Yes')
```

### Drizzle storage

The package provides a drizzle record bundle for [`@credo-ts/drizzle-storage`](https://github.com/openwallet-foundation/credo-ts/tree/main/packages/drizzle-storage) under the `/drizzle` subpath. Install `@credo-ts/drizzle-storage` and `drizzle-orm`, and register the bundle together with the `didcomm` bundle:

```ts
import { didcommQuestionAnswerBundle } from '@credo-ts/didcomm-question-answer/drizzle'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'

const storage = new DrizzleStorageModule({
  database,
  bundles: [didcommBundle, didcommQuestionAnswerBundle],
})
```

Pass the subpath to the `--bundle` option of the drizzle-storage CLI to apply the migrations:

```sh
pnpm drizzle-storage --bundle core --bundle didcomm --bundle @credo-ts/didcomm-question-answer/drizzle migrate --dialect sqlite --database-url "file:./agent.db"
```

In React Native, import the SQLite migrations from `@credo-ts/didcomm-question-answer/drizzle/migrations/sqlite` and pass them to `applyReactNativeMigrations`.

The bundle replaces the `question-answer` bundle of `@credo-ts/drizzle-storage`. The bundle name, the table name, and the migrations did not change, so an existing database keeps working.
