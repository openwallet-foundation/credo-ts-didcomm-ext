---
'@credo-ts/didcomm-media-sharing': patch
'@credo-ts/didcomm-shorten-url': patch
'@credo-ts/didcomm-user-profile': patch
---

Add a drizzle record bundle under the `/drizzle` subpath, for use with `@credo-ts/drizzle-storage`. The bundles are `didcommMediaSharingBundle`, `didcommShortenUrlBundle`, and `didcommUserProfileBundle`. Each package ships the SQLite and Postgres migrations, and exports the React Native SQLite migrations under `/drizzle/migrations/sqlite`. `@credo-ts/drizzle-storage` and `drizzle-orm` are optional peer dependencies, so an agent that uses Askar storage needs no change.
