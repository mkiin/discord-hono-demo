```markdown
# guide
# 特徴

*   **直感的なAPI** - Honoに影響を受けており、馴染みやすく使いやすいインターフェースを提供
*   **軽量** - 依存関係ゼロ、パフォーマンス最適化
*   **型安全** - TypeScriptのネイティブサポート

## サーバー型Bot と サーバーレスBot

| 特徴        | サーバー型Bot                     | サーバーレスBot                     |
| :---------- | :-------------------------------- | :-------------------------------- |
| できること  | 全て                              | コマンドへの返答<br>REST API でできること |
| できないこと | -                                 | 常時接続系ができない              |
| スケーリング | 色々する必要がある                | 自動スケール                      |
| コスト      | 無料：ダウンタイム有り<br>大規模：高額になりやすい | 無料：ダウンタイム無し<br>大規模：低コストにしやすい |
| ライブラリ  | Discord.js<br>Discord.py<br>Discordeno etc… | DiscordHono<br>…?（他を知らない）    |

### できること、できないこと

*   **サーバー型Bot**
    *   全てできる
*   **サーバーレスBot**
    *   コマンドへの返答や REST API でできることはできる
    *   常時接続系ができない
    *   サーバーレスBot は常時接続（VCに接続したり、コメントを監視して返答したり）ができません。
    *   これがサーバーレスBot の一番のデメリットです。
    *   逆に常時接続する予定がなければ、サーバーレスBot を検討する余地があると思います。

### スケーリング

*   **サーバー型Bot**
    *   色々対応する必要がある
*   **サーバーレスBot**
    *   自動スケール
    *   サーバーレスBot はスケーリングについて、特に考えることがないです

### コスト

*   **サーバー型Bot**
    *   無料：ダウンタイム有り
    *   大規模：高額になりやすい
*   **サーバーレスBot**
    *   無料：ダウンタイム無し
    *   大規模：低コストにしやすい
    *   サーバーレスBot は常時稼働しているわけではないため、低コストにしやすいです。
    *   無料利用でも、ほとんどのサービスでダウンタイムがありません。（正確には、ダウンタイムが気にならないほど速いです）

## 参考資料

*   [interaction-kit](https://github.com/IanMitchell/interaction-kit?tab=readme-ov-file#http)
*   [discordeno/rest](https://github.com/discordeno/discordeno/tree/main/packages/rest#discordeno-rest)

## 開発の方向性

### 優先的に対応する内容

*   Cloudflare Workers での動作
*   Discord Interactions の受信と応答

### 優先度は低いが、少しずつ対応する内容

*   Cloudflare 以外の環境での動作
*   REST API へのリクエストとレスポンス

# Tips

## `npm run register` でエラー

コマンド登録の成否とは関係なく、 `register.js` を実行できない場合のエラー。

次の修正を検討してみてください。(いずれか、または複合)

*   `package.json`
    ```json
    "type": "module",
    ```
*   `tsconfig.json` (いずれかを選択)
    ```json
    "moduleResolution": "Node",
    ```
    ```json
    "moduleResolution": "Bundler",
    ```
*   `register.ts`
    *   他のファイルからインポートするときに `.js` を付ける
    ```typescript
    import { commands } from './commands.js'
    ```
*   環境のアップデート
    *   Node v23.6.0 または Bun を利用する

**ノート**

このエラーは、デプロイするコード `index.ts` と登録するコード `register.ts` を、異なる TS コンパイラ環境で実行するため発生すると考えています。

### どうしてもエラーを解決できないとき

*   **ファイル分割を諦める**
    *   `register.ts` を `commands.ts` 等に分割しない
*   **コマンド登録用のURLエンドポイントを生やす**
    *   Hono 等を使いルーティングし、登録用URLを作成する
    *   念のため、ベーシック認証等をかける

## `npm run dev` で開発したい時

本番は、 Cloudflare Workers などのプラットフォームにデプロイするが、開発をローカルで行いたい場合、こちらを参考にしてください。

**ライブラリの開発者としては、 `npm run dev` はおすすめしていません。（明確な意図があれば問題ありません）**
代わりに次のいずれかを検討してください。

*   開発用の Bot アカウントを作成する
*   本番用 Bot に、開発サーバーだけ利用可能な、開発用コマンドを登録する

## `wrangler dev` でエラー

開発環境で、コマンド登録用のURLエンドポイントにアクセスしたときに発生するエラー。

次の修正をしてみてください。

1.  `.env` ファイルを `.dev.vars` ファイルにリネーム
2.  `.gitignore` に `.dev.vars` を追加（なければ）

**ノート**

このエラーは、 `wrangler dev` が `.env` ファイルを読み込めず、環境変数が見つからないため発生するエラーです。

## URL 登録時の Validation error

Discord ダッシュボードの `INTERACTIONS ENDPOINT URL` に URL を登録する際のエラー。

次の修正をしてみてください。

*   登録する URL の `_` （アンダーバー）を `-` （ハイフン）に変更
    *   `aaa_bbb.user.workers.dev` -> `aaa-bbb.user.workers.dev`

**参考**

## いくつかの環境による tips (β)

**注意**

これらのコードはまだ検証できていません。

### Hono

```typescript
import { Hono } from 'hono'
import { DiscordHono } from 'discord-hono'

const discord = new DiscordHono()
discord.command('hello', c => c.res('Discord World'))

const hono = new Hono()
hono.get('/', c => c.text('Hono World'))
hono.mount('/interaction', discord.fetch)

export default hono

// ブラウザ
// https://YOUER_DOMAIN.com -> Hono World が表示される

// Discord Bot
// /hello -> Discord World が返答される

// Discord Interaction Endpoint
// https://YOUER_DOMAIN.com/interaction を登録
```

### Deno Deploy

```typescript
import { DiscordHono } from 'npm:discord-hono'

const app = new DiscordHono()
app.command('ping', c => c.res('Pong!!'))

Deno.serve(app.fetch)
```

### Fastly Compute

```typescript
import { env } from 'fastly:env'
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono({
  discordEnv: () => ({
    APPLICATION_ID: env('DISCORD_APPLICATION_ID'),
    PUBLIC_KEY: env('DISCORD_PUBLIC_KEY'),
    TOKEN: env('DISCORD_TOKEN'),
  }),
}).command('ping', c => c.res('Pong!!'))

addEventListener('fetch', event =>
  event.respondWith(app.fetch(event.request, undefined, event)),
)
```

# Interactions

## `DiscordHono`

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono()
app.command('ping', c => c.res('Pong!!'))

export default app
```

### `.command()`

```typescript
import { DiscordHono, Command } from 'discord-hono'

const commands = [
  new Command('ping', 'Pong を返答'),
  new Command('image', 'Image を返答'),
]
const app = new DiscordHono()
  .command('ping', c => c.res('Pong!!'))
  .command('image', c => c.res('Image!!'))
```

`Command()` の第1引数と `.command()` の第1引数を一致させてください。
一致した `.command()` の第2引数が実行されます。

第1引数に `''` を指定すると、キャッチオールパターンとして機能します。

### `.component()`

```typescript
import { DiscordHono, Components, Button } from 'discord-hono'

const app = new DiscordHono()
  .command('components', c =>
    c.res({
      content: 'まだボタンはクリックされていない',
      components: new Components().row(
        new Button('button-1', 'ボタン'),
        new Button('button-2', '2つ目'),
      ),
    }),
  )
  .component('button-1', c => c.resUpdate('ボタン がクリックされた'))
  .component('button-2', c => c.resUpdate('2つ目 がクリックされた'))
```

コンポーネント要素 `Button()` の第1引数と `.component()` の第1引数を一致させてください。
一致した `.component()` の第2引数が実行されます。

第1引数に `''` を指定すると、キャッチオールパターンとして機能します。

### `.autocomplete()`

```typescript
import { DiscordHono, Command, Option, Autocomplete } from 'discord-hono'

const commands = [
  new Command('hello', 'command').options(
    new Option('option', 'selector').autocomplete().required(),
  ),
]
const app = new DiscordHono().autocomplete(
  'hello',
  // 選択肢生成ハンドラ
  c =>
    c.resAutocomplete(
      new Autocomplete(c.focused?.value).choices(
        { name: 'world', value: 'world!!!' },
        { name: 'hi', value: 'hi!' },
      ),
    ),
  // 実行ハンドラ
  c => c.res(c.var.option),
)
```

コマンドの `Option()` に `.autocomplete()` を付与してください。
`Command()` の第1引数と `.autocomplete()` の第1引数を一致させてください。
一致した `.autocomplete()` の第2引数が選択肢生成用のハンドラ、第3引数が実行用のハンドラです。

`.autocomplete()` の第3引数は `.command()` の第2引数と同じです。

### `.modal()`

```typescript
import { DiscordHono, Modal, TextInput } from 'discord-hono'

const app = new DiscordHono()
  .command('modal', c =>
    c.resModal(
      new Modal('modal-1', 'モーダル タイトル')
        .row(new TextInput('text-1', 'テキスト'))
        .row(new TextInput('text-2', '2つ目')),
    ),
  )
  .modal('modal-1', c => c.res('モーダルが送信された'))
```

`Modal()` の第1引数と `.modal()` の第1引数を一致させてください。
一致した `.modal()` の第2引数が実行されます。

第1引数に `''` を指定すると、キャッチオールパターンとして機能します。

### `.cron()`

```typescript
import { DiscordHono, _channels_$_messages } from 'discord-hono'

const app = new DiscordHono()
  .cron('0 0 * * *', async c => {
    await c.rest.post(_channels_$_messages, ['CHANNEL_ID'], {
      content: '毎日投稿',
    })
  })
  .cron('', async c => { // キャッチオール
    await c.rest.post(_channels_$_messages, ['CHANNEL_ID'], {
      content: '他のCronトリガーの投稿',
    })
  })
```

`wrangler.toml`
```toml
name = "example"
main = "src/index.ts"
compatibility_date = "2024-02-08"
[triggers]
crons = [ "0 * * * *", "0 0 * * *" ]
```

`.cron()` の第1引数と `wrangler.toml` の `crons` を一致させてください。
一致した `.cron()` の第2引数が実行されます。

第1引数に `''` を指定すると、キャッチオールパターンとして機能します。

### `.fetch()`

こちらを参照してください: [Hono - Fetch](https://hono.dev/api/hono#fetch)
できるだけ Hono の `fetch()` と同じようになるようにしています。

### `.scheduled()`

`export default app` を使っていれば、`.scheduled()` は含まれています。 (Cloudflare Workers の Scheduled Handler)

## 初期オプション (`new DiscordHono(options)`)

### `verify`

Cloudflare の環境であれば、使う必要はありません。

*   **discord-interactions**
    ```typescript
    import { DiscordHono } from 'discord-hono'
    import { verifyKey } from 'discord-interactions'

    const app = new DiscordHono({ verify: verifyKey })
    ```

*   **discord-verify**
    ```typescript
    import { DiscordHono } from 'discord-hono'
    import { verify, PlatformAlgorithm } from 'discord-verify'

    const app = new DiscordHono({
      verify: (...args) =>
        verify(...args, crypto.webcrypto.subtle, PlatformAlgorithm.OldNode), // 環境に応じて調整
    })
    ```

### `discordEnv`

Example と同じような環境変数 (`DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_TOKEN`) であれば、使う必要はありません。
環境変数を別の名前で保存したときや、Cloudflare 以外の環境の時に利用します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono({
  discordEnv: env => ({
    APPLICATION_ID: env.MY_APP_ID, // 例: 別の名前の環境変数
    PUBLIC_KEY: env.MY_PUBLIC_KEY,
    TOKEN: env.MY_TOKEN,
  }),
})
```

## Context

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono()
  .command('ping', c => c.res('Pong!!'))
  .command('hello', c => c.res('world!!'))
```

`app.command()`, `app.component()`, `app.modal()`, `app.cron()` の第2引数(ハンドラ)で Context (`c`) を受け取ることできます。

### `.env` `.event` `.executionCtx` `.set()` `.get()` `.var`

こちらを参照してください: [Hono - Context](https://hono.dev/api/context)
できるだけ Hono と同じになるようにしています。

### `.var` について

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono()
  .command('ping', c => c.res(c.var.OPTION_NAME)) // コマンドオプションの値
  .component('button', c => c.res(c.var.custom_id)) // コンポーネントの custom_id
  .modal('modal', c => c.res(c.var.custom_id + c.var.TEXTINPUT_CUSTOM_ID)) // モーダルの custom_id + テキスト入力の値
```

デフォルトで次の値が含まれています。

*   `c.var.OPTION_NAME`: コマンドオプションの値 (`command`, `autocomplete`)
*   `c.var.custom_id`: `custom_id` の値 (`component`, `modal`)
*   `c.var.TEXTINPUT_CUSTOM_ID`: テキストインプットの値 (`modal`)

### `.waitUntil()`

`c.waitUntil = c.executionCtx.waitUntil`

非同期処理をリクエストのレスポンス完了後も実行させたい場合に使います。
[Cloudflare Workers - waitUntil](https://developers.cloudflare.com/workers/runtime-apis/fetch-event/#waituntil)

### `get: req`

*(command, component, autocomplete, modal)*

インタラクションのリクエスト(`Request`オブジェクト)そのままです。

### `get: interaction`

*(command, component, autocomplete, modal)*

```typescript
c.interaction = JSON.parse(await c.req.text())
```

パースされたインタラクションオブジェクトです。
[Discord API Documentation - Interaction Object](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-structure)を参照してください。

### `get: key`

ハンドラーのトリガーとなった文字列です。
*   `.command()` -> コマンド名
*   `.component()` -> コンポーネントの `custom_id`
*   `.modal()` -> モーダルの `custom_id`
*   `.autocomplete()` -> コマンド名
*   `.cron()` -> `wrangler.toml` の `crons` の値

### `get: sub`

*(command, autocomplete)*

サブコマンドやサブコマンドグループの情報。

```typescript
import { DiscordHono, Command, SubCommand, SubGroup, Option } from 'discord-hono'

const commands = [
  new Command('slash', 'slash description').options(
    new SubCommand('sub1', 'サブコマンド 1'),
    new SubGroup('group', 'サブコマンドグループ description').options(
      new SubCommand('sub2', 'サブコマンド 2').options(
        new Option('text', 'テキスト'),
      ),
      new SubCommand('sub3', 'サブコマンド 3'),
    ),
  ),
]
const app = new DiscordHono().command('slash', c => {
  switch (c.sub.string) {
    case 'sub1':
      return c.res('sub1') // /slash sub1
    case 'group sub2':
      return c.res('g-sub2: ' + c.var.text) // /slash group sub2 text:...
    default: // group sub3 など
      return c.res(c.sub.group + '-' + c.sub.command) // /slash group sub3 -> group-sub3
  }
})
```

*   `c.sub.group`: `SubGroup` の第一引数
*   `c.sub.command`: `SubCommand` の第一引数
*   `c.sub.string`: `(c.sub.group ? c.sub.group + ' ' : '') + c.sub.command`

### `get: focused`

*(autocomplete)*

```typescript
import { DiscordHono, Autocomplete } from 'discord-hono'

const app = new DiscordHono().autocomplete('hello', c => {
  console.log(c.focused?.name) // フォーカス中のオプション名
  console.log(c.focused?.value) // フォーカス中のオプションの現在の入力値
  return c.resAutocomplete(/* ... */)
})
```

フォーカスされているオプションのオブジェクト。
[Discord API Documentation - Interaction Object - Application Command Option Structure](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-application-command-interaction-data-option-structure)

### `get: cronEvent`

*(cron)*

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().cron('', c => console.log(c.cronEvent.cron)) // 例: "0 * * * *"
```

Cloudflare Workers の `scheduled()` の第一引数の `event` オブジェクトです。
[Cloudflare Workers - ScheduledEvent](https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/)

### `get: rest`

`c.rest = createRest(c.env.DISCORD_TOKEN)`
Discord REST API を叩くためのクライアントインスタンスです。詳細は[REST API](#rest-api)セクションを参照。

## Response Methods

### `.res()`

*(command, component, modal)*

インタラクションに対する即時応答。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono()
  .command('ping', c => c.res('Pong!!')) // 文字列で応答
  .command('hello', c => c.res({ content: 'World!!' })) // データオブジェクトで応答
```

*   第1引数: `string` または [APIInteractionResponseCallbackData](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-data-structure)
*   第2引数: `FileData` または `FileData[]` (`FileData = { blob: Blob, name: 'file.name' }`)

### `.resDefer()`

*(command, component, modal)*

応答を遅延させることを Discord に通知します。3秒以内に応答できない重い処理を行う場合に使用します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().command('heavy', c =>
  c.resDefer(async ctx => { // ctx は c と同じ Context オブジェクト
    // 時間のかかる処理...
    await new Promise(resolve => setTimeout(resolve, 5000))
    await ctx.followup('処理完了!') // 後続処理で followup を使用
  }),
)
```

引数に関数を渡すと、その関数が非同期で実行されます。

### `.resUpdate()`

*(component)*

インタラクション元のメッセージを更新します。ボタンクリックなどでメッセージ内容を変える場合に使用します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().component('button', c =>
  c.resUpdate('ボタンがクリックされました！'), // メッセージ内容を更新
)
```

*   第1引数: `string` または [APIInteractionResponseCallbackData](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-data-structure)
*   第2引数: `FileData` または `FileData[]`

### `.resDeferUpdate()`

*(component)*

メッセージの更新を遅延させることを通知します。`.resDefer()` のメッセージ更新版です。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().component('button', c =>
  c.resDeferUpdate(async ctx => {
    // 時間のかかる処理...
    await ctx.followup('メッセージ更新完了!') // 更新は followup で行う
  }),
)
```

### `.resAutocomplete()`

*(autocomplete)*

オートコンプリートの選択肢を返します。

```typescript
import { DiscordHono, Autocomplete } from 'discord-hono'

const app = new DiscordHono().autocomplete(
  'hello',
  // 選択肢生成ハンドラ
  c =>
    c.resAutocomplete(
      new Autocomplete(c.focused?.value).choices(
        { name: 'world', value: 'world!!!' },
        { name: 'hi', value: 'hi!' },
      ),
    ),
  // 実行ハンドラ (省略可能)
  c => c.res(c.var.option),
)
```

*   引数: `Autocomplete` インスタンス または [APIApplicationCommandAutocompleteInteractionResponseCallbackData](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-autocomplete)

### `.resModal()`

*(command, component)*

モーダルダイアログを表示します。

```typescript
import { DiscordHono, Modal, TextInput } from 'discord-hono'

const app = new DiscordHono().command('profile', c =>
  c.resModal(
    new Modal('profile-modal', 'プロフィール入力').row(
      new TextInput('name', '名前'),
    ),
  ),
)
```

*   引数: `Modal` インスタンス または [APIModalInteractionResponseCallbackData](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-modal)

### `.resActivity()`

*(command, component, modal)*

アクティビティを起動します。（アクティビティが有効になっているアプリでのみ使用可能）

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().command('activity', c => c.resActivity(/* activity options */))
```

### `.followup()`

*(command, component, modal)*

`.resDefer()` または `.resDeferUpdate()` の後に、メッセージを送信または編集します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().command('defer-example', c =>
  c.resDefer(async ctx => {
    const blob = await fetch('https://example.com/image.png').then(res => res.blob())
    await ctx.followup(
      'これがフォローアップメッセージです', // 文字列 or データオブジェクト
      { blob: blob, name: 'image.png' } // ファイルデータ (任意)
    )
  }),
)
```

*   第1引数: `string` または [APIInteractionResponseCallbackData](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-data-structure)
*   第2引数: `FileData` または `FileData[]`

### `.followupDelete()`

*(command, component, modal)*

`.resDefer()` または `.resDeferUpdate()` の後に送信されたフォローアップメッセージを削除します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono().component('delete-button', c =>
  c.resDeferUpdate(async ctx => {
      await ctx.followupDelete() // 元のメッセージを削除
  })
)
```

### `.ephemeral()` `.suppressEmbeds()` `.suppressNotifications()`

*(command, component, modal)*

レスポンスにメッセージフラグを追加します。`.res()` などの応答メソッドの前にチェーンして呼び出します。

```typescript
import { DiscordHono } from 'discord-hono'

const app = new DiscordHono()
app.command('secret', c =>
  c.ephemeral() // この応答はあなただけに表示されます
   .res('秘密のメッセージです。')
)
app.command('no-embed', c =>
  c.suppressEmbeds() // このメッセージの埋め込みを展開しません
   .res('https://example.com')
)
app.command('silent', c =>
  c.suppressNotifications() // このメッセージの通知を抑制します (プッシュ通知など)
   .res('静かなメッセージ。')
)
```

*   `.ephemeral()`: `MessageFlags.Ephemeral` (64)
*   `.suppressEmbeds()`: `MessageFlags.SuppressEmbeds` (4)
*   `.suppressNotifications()`: `MessageFlags.SuppressNotifications` (4096)

[Discord API Documentation - Message Flags](https://discord.com/developers/docs/resources/channel#message-object-message-flags)

# REST API

Discord の REST API を利用する方法は主に4つあります。

1.  **`c.rest`**: Contextオブジェクトから利用できる組み込みのRESTクライアント。
2.  **`createRest(token)`**: 独立したRESTクライアントを作成。`c.rest` と内部的には同じ。
3.  **別のライブラリ**: `@discordjs/rest` や `discordeno/rest` など。
4.  **自分で `fetch()`**: 標準の `fetch` API を使用。

1と2は `discord-hono` に含まれる機能です。REST API は基本的に独立しているため、どの実装方法でも問題ありません。

## `c.rest` について

`createRest()` を利用する場合は置き換えてください。

**変数 (ドキュメントPath)**

```typescript
import { DiscordHono, _channels_$_messages } from 'discord-hono' // パス定数をインポート

const app = new DiscordHono().command('post', async c => {
  const channel_id = 'YOUR_CHANNEL_ID'
  try {
    const message = await c.rest.post( // Method: POST
      _channels_$_messages,          // Path: /channels/{channel.id}/messages
      [channel_id],                  // Path Parameters: [channel.id]
      { content: 'this is rest' }     // Body Parameters
    )
    return c.res(`メッセージを投稿しました: ${message.id}`)
  } catch (e) {
    console.error(e)
    return c.res('メッセージの投稿に失敗しました')
  }
})
```

*   **第一引数**: HTTPメソッド (`'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`)
*   **第二引数**: エンドポイントパスの定数 ([discord-hono/src/rest/typed.ts](https://github.com/discord-hono/discord-hono/blob/main/src/rest/typed.ts) に定義)
*   **第三引数**: パス内の `{}` で囲まれた変数部分を配列で入力 (例: `/users/{user.id}` なら `[userId]`)
*   **第四引数以降**: リクエストボディやクエリパラメータなどのデータ ([Discord APIドキュメント](https://discord.com/developers/docs/reference#rest-api-endpoints)参照)

**対応状況 (2024年時点、目安)**

*   Receiving and Responding: ✅
*   Application Commands: ✅
*   Application: ✅
*   Application Role Connection Metadata: ✅
*   Audit Log: ✅
*   Auto Moderation: ✅
*   Channel: ✅
*   Emoji: ✅
*   Entitlement: ✅
*   Guild: ✅
*   Guild Scheduled Event: ✅
*   Guild Template: ✅
*   Invite: ✅
*   Messages: ✅
*   Poll: ✅
*   SKU: ✅
*   Soundboard: ✅
*   Stage Instance: ✅
*   Sticker: ⌛ (対応中または一部)
*   Subscription: ✅
*   User: ✅
*   Voice: ✅
*   Webhook: ✅

**ノート**

REST の型定義が間違っている場合があります。 Issue などで報告いただけると助かります。

# TypeScript

## 環境変数と型の設定

```typescript
import { DiscordHono } from 'discord-hono'

// 環境変数の型定義 (Cloudflare Workers Bindings など)
type Env = {
  Bindings: {
    DISCORD_APPLICATION_ID: string
    DISCORD_PUBLIC_KEY: string
    DISCORD_TOKEN: string
    DB: D1Database // 例: D1データベース
  }
}

const app = new DiscordHono<Env>() // ジェネリクスでEnv型を指定

app.command('hello', async c => {
  const db = c.env.DB // c.env で型安全にアクセス
  // 何かしらの処理
  const result = await db.prepare('SELECT ...').first()
  return c.res(`world!! DB result: ${result}`)
})

export default app
```

## `.var` Types

`c.var` に含まれる値の型を定義できます。

```typescript
import { DiscordHono } from 'discord-hono'

type Env = {
  // .var に含まれる変数の型
  Variables: {
    // コマンドオプション (Option の第1引数)
    OPTION_NAME?: string
    // モーダルのテキスト入力 (TextInput の第1引数)
    TEXTINPUT_CUSTOM_ID?: string
    // コンポーネント/モーダルの custom_id
    custom_id?: string
  }
}

const app = new DiscordHono<Env>()
  .command('ping', c => c.res(c.var.OPTION_NAME)) // string | undefined
  .modal('modal', c => c.res(c.var.TEXTINPUT_CUSTOM_ID)) // string | undefined
```

## Init Options

`DiscordHono` の初期化オプションに型を適用します。

```typescript
import type { InitOptions } from 'discord-hono'
import { DiscordHono } from 'discord-hono'

type Env = { /* ... */ }

// InitOptions に Env 型を適用
const options: InitOptions<Env> = {
  discordEnv: env => ({ /* ... */ }),
  verify: /* ... */,
}
const app = new DiscordHono<Env>(options)
```

## Context Types

各ハンドラの Context (`c`) に型を適用できます。

```typescript
import type {
  CommandContext,
  ComponentContext,
  AutocompleteContext,
  ModalContext,
  CronContext,
  Env, // Env型をインポート (またはここで定義)
} from 'discord-hono'
import {
  DiscordHono,
  Components,
  Button,
  Modal,
  TextInput,
  Autocomplete,
  Command, // Commandなどをインポート
} from 'discord-hono'

// 環境変数の型定義
type MyEnv = Env & { // discord-hono の Env を継承しても良い
  Bindings: {
    DB: D1Database
  }
}

// 各ハンドラの型定義
const commandHandler = async (c: CommandContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  return c.res({
    components: new Components().row(new Button('button', 'Yo!!')),
  })
}

const componentHandler = async (c: ComponentContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  return c.resModal(
    new Modal('modal', 'これはモーダル').row(
      new TextInput('id', '何か入力して'),
    ),
  )
}

const modalHandler = async (c: ModalContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  return c.res('モーダルが送信された')
}

const autocompleteHandler = async (c: AutocompleteContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  return c.resAutocomplete(new Autocomplete().choices())
}

const autocompleteCommandHandler = async (c: CommandContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  return c.res('オートコンプリートコマンド')
}

const cronHandler = async (c: CronContext<MyEnv>) => {
  const db = c.env.DB
  // 何かしらの処理
  console.log(`Cron executed: ${c.cronEvent.cron}`)
}

// アプリケーションの初期化とルーティング
const app = new DiscordHono<MyEnv>()
  .command('hey', commandHandler)
  .component('button', componentHandler)
  .modal('modal', modalHandler)
  .autocomplete('autocomplete', autocompleteHandler, autocompleteCommandHandler)
  .cron('0 * * * *', cronHandler) // cronスケジュールとハンドラを紐付け

export default app
```

# builder

コマンド、コンポーネント、モーダル、埋め込みなどを構築するためのクラスです。

## `Command`

アプリケーションコマンドを定義します。

```typescript
import { Command } from 'discord-hono'

const commands = [
  new Command('name', 'description'), // スラッシュコマンドの基本形
  new Command('ping', 'pong を返答'),
]
```

`Command` の第1引数（コマンド名）については、[Discord API ドキュメント - Application Command Names](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-naming)を確認してください。

### Method (Chainable)

```typescript
import { Command, Option } from 'discord-hono'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10'

const commands = [
  new Command('userinfo', 'ユーザー情報を表示')
    .type(ApplicationCommandType.User) // ユーザーコマンド (デフォルト: CHAT_INPUT)
    // .type(ApplicationCommandType.Message) // メッセージコマンド
    // .id('...') // 既存コマンドID (通常不要)
    // .application_id('...') // アプリケーションID (通常不要)
    // .guild_id('...') // ギルドID (ギルドコマンドの場合)
    .name_localizations({ ja: 'ユーザー情報' })
    .description_localizations({ ja: 'ユーザーの情報を表示します' })
    // .options( // CHAT_INPUT コマンドのみ
    //   new Option('user', '対象ユーザー').type(ApplicationCommandOptionType.User).required(),
    // )
    .default_member_permissions('0') // デフォルト権限 (文字列形式のビットフィールド)
    .dm_permission(false) // DMでの利用可否 (デフォルト: true)
    // .default_permission() // 非推奨
    .nsfw(false) // NSFWコマンドか
    .integration_types([0, 1]) // インテグレーションタイプ (0: Guild Install, 1: User Install)
    .contexts([0, 1, 2]), // 利用可能コンテキスト (0: Guild, 1: Bot DM, 2: Private Channel)
    // .version('...') // バージョンID (通常不要)
    // .handler(c => { /* ... */ }) // createFactoryで使用
]
```

詳細は [Discord API ドキュメント - Application Command Object](https://discord.com/developers/docs/interactions/application-commands#application-command-object) を参照してください。

### Subcommands

スラッシュコマンド (`CHAT_INPUT`) はサブコマンドやサブコマンドグループを持つことができます。

```typescript
import { Command, SubGroup, SubCommand, Option } from 'discord-hono'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'

const commands = [
  new Command('config', '設定コマンド').options(
    // サブコマンド
    new SubCommand('show', '現在の設定を表示'),
    // サブコマンドグループ
    new SubGroup('set', '設定を変更').options(
      new SubCommand('prefix', 'プレフィックスを設定').options(
        new Option('value', '新しいプレフィックス').type(ApplicationCommandOptionType.String).required(),
      ),
      new SubCommand('language', '言語を設定').options(
        new Option('lang', '言語コード').type(ApplicationCommandOptionType.String)
          .choices(
            { name: 'Japanese', value: 'ja' },
            { name: 'English', value: 'en' },
          ).required(),
      ),
    ),
  ),
]
```

*   `Command.options()` には `SubCommand` または `SubGroup` を渡します。
*   `SubGroup.options()` には `SubCommand` のみを渡します。
*   `SubCommand.options()` には `Option` を渡します（後述）。

[Discord API ドキュメント - Subcommands and Subcommand Groups](https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups)

## `Option`

スラッシュコマンド (`CHAT_INPUT`) のオプションを定義します。`Command.options()` または `SubCommand.options()` 内で使用します。

```typescript
import { Command, Option } from 'discord-hono'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'

const commands = [
  new Command('greet', '挨拶をする').options(
    // String オプション (デフォルト)
    new Option('message', '挨拶のメッセージ'),
    // Channel オプション
    new Option('channel', '送信先のチャンネル').type(ApplicationCommandOptionType.Channel),
    // Integer オプション
    new Option('times', '繰り返す回数').type(ApplicationCommandOptionType.Integer),
  ),
]
```

`type()` でオプションの型を指定します。指定しない場合は `String` (`ApplicationCommandOptionType.String`) になります。
利用可能な型は `ApplicationCommandOptionType` を参照してください。

### Method (Chainable)

```typescript
import { Command, Option } from 'discord-hono'
import { ApplicationCommandOptionType, ChannelType } from 'discord-api-types/v10'

const commands = [
  new Command('search', '検索').options(
    new Option('query', '検索クエリ')
      .type(ApplicationCommandOptionType.String) // 型指定
      .name_localizations({ ja: '検索語' })
      .description_localizations({ ja: '検索したい内容' })
      .required() // 必須オプションにする (true)
      // .required(false) // 任意オプションにする
      .choices( // STRING, INTEGER, NUMBER 型のみ
        { name: 'Google', value: 'google_search' },
        { name: 'Bing', value: 'bing_search' },
      )
      .min_length(3) // STRING 型のみ
      .max_length(100) // STRING 型のみ
      .autocomplete(), // STRING, INTEGER, NUMBER 型のみ (有効にすると .choices() は無視される)
  ),
  new Command('ban', 'ユーザーをBAN').options(
      new Option('duration', '期間(日数)')
        .type(ApplicationCommandOptionType.Integer)
        .min_value(1) // INTEGER, NUMBER 型のみ
        .max_value(365), // INTEGER, NUMBER 型のみ
  ),
  new Command('logchannel', 'ログチャンネル設定').options(
      new Option('channel', '設定するチャンネル')
        .type(ApplicationCommandOptionType.Channel)
        .channel_types([ChannelType.GuildText]), // CHANNEL 型のみ (テキストチャンネルのみ許可)
  )
]
```

詳細は [Discord API ドキュメント - Application Command Option Structure](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure) を参照してください。
オプションの型によって使用できないメソッドがあります。

## `Components`

メッセージコンポーネント (Action Row) を構築します。

```typescript
import { DiscordHono, Components, Button } from 'discord-hono'

const app = new DiscordHono().command('component', c =>
  c.res({
    content: 'ボタンがあります:',
    components: new Components() // Components インスタンスを作成
      .row( // 1行目 (Action Row)
        new Button('button-1', 'ボタン A'), // ボタンを追加
        new Button('button-2', 'ボタン B'),
      )
      .row( // 2行目 (Action Row)
        new Button('button-3', 'ボタン C'),
      ),
  }),
)
```

### `.row()`

Action Row を追加します。1つの `.row()` に最大5つのコンポーネント (Button, Select など) を配置できます。

```typescript
import { Components, Button, Select } from 'discord-hono'

const components = new Components()
  .row( // 1行目: ボタン
    new Button('b1', '1'),
    new Button('b2', '2'),
    new Button('b3', '3'),
    new Button('b4', '4'),
    new Button('b5', '5'),
  )
  .row( // 2行目: セレクトメニュー
    new Select('select-1') // セレクトメニューを追加
      .options(
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
      ),
  )
```

## `Button` 要素

ボタンコンポーネントを作成します。

```typescript
import { Components, Button } from 'discord-hono'
import { ButtonStyle } from 'discord-api-types/v10'

const components = new Components().row(
  // 通常のボタン (Primary スタイル)
  new Button('unique-id-1', 'ラベル'), // 第1引数: custom_id, 第2引数: label

  // スタイル指定 (Secondary)
  new Button('unique-id-2', 'ボタン', ButtonStyle.Secondary),

  // リンクボタン
  new Button('https://example.com', 'リンクを開く', ButtonStyle.Link), // 第1引数: URL, 第3引数: Link

  // SKUボタン (非推奨？)
  // new Button('sku_id', '購入', ButtonStyle.Premium),
)
```

*   `unique-id` (`custom_id`): `app.component()` で識別するために使います。**`;` は使用できません。**
*   第3引数: ボタンのスタイル ([`ButtonStyle`](https://discord.com/developers/docs/interactions/message-components#button-object-button-styles))。デフォルトは `Primary`。
*   スタイルが `Link` の場合、第1引数はURLになります。

### Method (Chainable)

```typescript
import { Components, Button } from 'discord-hono'
import { ButtonStyle } from 'discord-api-types/v10'

const components = new Components().row(
  new Button('click-me', 'クリックして！', ButtonStyle.Success)
    // .custom_id('override-id') // 通常は第一引数で指定
    .emoji({ name: '🎉' }) // Unicode絵文字 or { id, name, animated }
    .disabled(), // ボタンを無効化 (true)
    // .disabled(false) // ボタンを有効化
)
```

*   `.custom_id()`: `unique-id` を含めて **99文字** までです。（Discord APIの制限は100文字ですが、内部処理で1文字使うため）
[Discord API ドキュメント - Button Object](https://discord.com/developers/docs/interactions/message-components#button-object)

### 簡単な emoji の設定

ラベルの代わりに配列を使うと、絵文字＋ラベルを簡単に設定できます。

```typescript
import { Components, Button } from 'discord-hono'

const components = new Components().row(
  new Button('confirm', ['✅', '確認'], ButtonStyle.Success),
  new Button('cancel', ['❌', 'キャンセル'], ButtonStyle.Danger),
)
```

## `Select` 要素 (Select Menu)

セレクトメニューコンポーネントを作成します。

```typescript
import { Components, Select } from 'discord-hono'
import { ComponentType } from 'discord-api-types/v10'

const components = new Components().row(
  // String Select (デフォルト)
  new Select('string-select'),

  // User Select
  new Select('user-select', ComponentType.UserSelect),

  // Role Select
  new Select('role-select', ComponentType.RoleSelect),

  // Mentionable Select (User + Role)
  new Select('mentionable-select', ComponentType.MentionableSelect),

  // Channel Select
  new Select('channel-select', ComponentType.ChannelSelect),
)
```

*   `unique-id` (`custom_id`): `app.component()` で識別するために使用されます。**`;` は使用できません。**
*   第2引数: セレクトメニューのタイプ ([`ComponentType`](https://discord.com/developers/docs/interactions/message-components#component-object-component-types))。デフォルトは `StringSelect`。

### Method (Chainable)

```typescript
import { Components, Select } from 'discord-hono'
import { ComponentType, ChannelType } from 'discord-api-types/v10'

const components = new Components().row(
  new Select('fruit-select') // String Select
    // .custom_id('override-id') // 通常は第一引数で指定
    .options( // String Select のみ必須
      { label: 'Apple', value: 'apple', description: '赤い果物', emoji: { name: '🍎' } },
      { label: 'Banana', value: 'banana', default: true }, // デフォルト選択
      { label: 'Orange', value: 'orange' },
    )
    .placeholder('果物を選んでください')
    .min_values(1) // 最小選択数 (デフォルト: 1)
    .max_values(1) // 最大選択数 (デフォルト: 1, String Select で複数選択可能にする場合は変更)
    .disabled(), // 無効化
    // .disabled(false) // 有効化
)
.row(
  new Select('text-channel-select', ComponentType.ChannelSelect)
    .channel_types([ChannelType.GuildText]) // Channel Select のみ (テキストチャンネルのみ選択可)
    .placeholder('テキストチャンネルを選択')
    .default_values([ // User, Role, Mentionable, Channel のみ (デフォルト選択のIDリスト)
      { id: 'channel-id-1', type: 'channel' },
    ])
    .max_values(5), // 複数選択を許可
)
```

*   `.custom_id()`: `unique-id` を含めて **99文字** までです。
*   タイプによって使用できないメソッドがあります。
[Discord API ドキュメント - Select Menu Object](https://discord.com/developers/docs/interactions/message-components#select-menu-object)

## `Autocomplete`

オートコンプリートの応答を構築します。`.resAutocomplete()` の引数として使用します。

```typescript
import { Autocomplete } from 'discord-hono'

// c は AutocompleteContext
return c.resAutocomplete(
  // 初期化の引数はユーザーの現在の入力値 (オプショナル)
  new Autocomplete(c.focused?.value)
    .choices( // 選択肢の配列 (最大25個)
      { name: '候補1 (表示名)', value: 'value1 (実際の値)' },
      { name: '候補2', value: 2 }, // value は string or number
      { name: '候補3', value: 'value3' },
    ),
)
```

`Autocomplete` は、初期化時に渡された検索ワード (`c.focused?.value`) に基づいて、`.choices()` で与えられた選択肢の中から部分一致するものだけをフィルタリングして返却します。 (クライアント側でフィルタリングする場合や独自ロジックを使いたい場合は、第一引数を省略できます)

## `Modal`

モーダルダイアログを構築します。`.resModal()` の引数として使用します。

```typescript
import { Modal, TextInput } from 'discord-hono'

const modal = new Modal('unique-id', 'モーダルタイトル') // 第1引数: custom_id, 第2引数: title
  .row( // 1行目 (Action Row)
    new TextInput('custom_id_1', 'テキストラベル1'), // TextInputを追加
  )
  .row( // 2行目 (Action Row)
    new TextInput('custom_id_2', 'テキストラベル2'),
  )
```

*   `unique-id` (`custom_id`): `app.modal()` で識別するために使用されます。

### `.row()`

Action Row を追加します。モーダルの `.row()` には `TextInput` のみ配置できます。1つの `.row()` に1つの `TextInput` を配置します。

```typescript
import { Modal, TextInput } from 'discord-hono'

const modal = new Modal('feedback-modal', 'フィードバック')
  .row(new TextInput('title', '件名'))
  .row(new TextInput('details', '詳細', 'Multi')) // 第3引数でスタイル指定
```

### `TextInput`

テキスト入力コンポーネントを作成します。`Modal.row()` 内で使用します。

```typescript
import { Modal, TextInput } from 'discord-hono'

type Style = 'Single' | 'Multi' // 'Single': 1行入力, 'Multi': 複数行入力

const modal = new Modal('register-modal', 'ユーザー登録')
  .row(
    // 1行入力 (デフォルト)
    new TextInput('username', 'ユーザー名'),
  )
  .row(
    // 複数行入力
    new TextInput('bio', '自己紹介', 'Multi' as Style),
  )
```

*   第1引数: `custom_id` (`c.var` で値を取得する際に使用)
*   第2引数: `label` (入力欄の上に表示されるテキスト)
*   第3引数: スタイル (`'Single'` または `'Multi'`)。デフォルトは `'Single'`。

### Method (Chainable)

```typescript
import { Modal, TextInput } from 'discord-hono'

const modal = new Modal('article-modal', '記事投稿').row(
  new TextInput('content', '本文', 'Multi')
    .min_length(10) // 最小文字数
    .max_length(2000) // 最大文字数
    .required() // 必須入力にする (true)
    // .required(false) // 任意入力にする
    .value('デフォルトのテキスト') // 初期値
    .placeholder('ここに記事を入力してください...'), // プレースホルダー
)
```

[Discord API ドキュメント - Text Input Object](https://discord.com/developers/docs/interactions/message-components#text-input-object)

## `Embed`

埋め込みメッセージ (Embed) を構築します。`.res()` や `.followup()` の `embeds` プロパティで使用します。

```typescript
import { DiscordHono, Embed } from 'discord-hono'

const app = new DiscordHono().command('embed', c =>
  c.res({
    embeds: [ // embeds は配列
      new Embed()
        .title('これがタイトルです')
        .description('これが説明文です。\n改行もできます。')
        .color(0x00ff00), // 16進数カラーコード (例: 緑)
    ],
  }),
)
```

### Method (Chainable)

```typescript
import { Embed } from 'discord-hono'

const embed = new Embed()
  .title('埋め込みタイトル')
  // .type('rich') // 通常は 'rich' (デフォルト)
  .description('埋め込みの説明文。\nマークダウンが使えます: **太字**, *斜体*, [リンク](https://example.com)')
  .url('https://example.com') // タイトル部分に設定されるURL
  .timestamp(new Date()) // フッターに表示されるタイムスタンプ (ISO8601形式 or Dateオブジェクト)
  .color(0x3498db) // 色 (16進数)
  .footer({ // フッター情報
    text: 'フッターテキスト',
    icon_url: 'https://example.com/footer_icon.png',
    // proxy_icon_url: '...'
  })
  .image({ // メイン画像
    url: 'https://example.com/main_image.png',
    // proxy_url: '...', height: ..., width: ...
  })
  .thumbnail({ // 右上のサムネイル画像
    url: 'https://example.com/thumbnail.png',
    // proxy_url: '...', height: ..., width: ...
  })
  // .video({ url: '...', proxy_url: '...', height: ..., width: ... }) // 動画 (通常はURLプレビューで自動生成)
  // .provider({ name: '...', url: '...' }) // プロバイダー情報 (通常はURLプレビューで自動生成)
  .author({ // 著者情報
    name: '著者名',
    url: 'https://example.com/author', // 著者名に設定されるURL
    icon_url: 'https://example.com/author_icon.png',
    // proxy_icon_url: '...'
  })
  .fields([ // フィールド (インライン表示可能)
    { name: 'フィールド1タイトル', value: 'フィールド1内容', inline: true },
    { name: 'フィールド2タイトル', value: 'フィールド2内容', inline: true },
    { name: 'フィールド3タイトル (非インライン)', value: 'フィールド3内容' }, // inline: false (デフォルト)
  ])
```

[Discord API ドキュメント - Embed Object](https://discord.com/developers/docs/resources/channel#embed-object)

# helper 関数

開発を補助するための便利な関数です。

## `register`

アプリケーションコマンドを Discord に登録または更新します。通常 `register.ts` で使用します。

`register.ts`
```typescript
import { Command, Option, register } from 'discord-hono'

// 登録したいコマンドの配列を作成
const commands = [
  new Command('ping', 'pong を返答'),
  new Command('image', '画像ファイルを返答').options(
    new Option('text', 'テキスト付で').required(),
  ),
  // ... 他のコマンド
]

// register 関数を呼び出し
register(
  commands, // 登録するコマンドの配列
  process.env.DISCORD_APPLICATION_ID!, // アプリケーションID
  process.env.DISCORD_TOKEN!,          // Botトークン
  // process.env.DISCORD_TEST_GUILD_ID, // テスト用ギルドID (任意)
)

console.log('コマンドを登録しました。')
```

*   **第1引数**: `Command` インスタンスの配列。
*   **第2引数**: Discord アプリケーションID (環境変数などから取得)。
*   **第3引数**: Discord Bot トークン (環境変数などから取得)。
*   **第4引数 (任意)**: テスト用ギルド (サーバー) ID。指定すると、そのギルドに対してのみ即座にコマンドが登録/更新されます (開発時に便利)。指定しない場合はグローバルコマンドとして登録され、反映に最大1時間かかることがあります。

**コマンドを全て削除する場合:**

第1引数に空の配列を渡します。

```typescript
register(
  [], // 空の配列
  process.env.DISCORD_APPLICATION_ID!,
  process.env.DISCORD_TOKEN!,
  // process.env.DISCORD_TEST_GUILD_ID, // ギルドコマンドを削除する場合は指定
)
console.log('コマンドを削除しました。')
```

## `createFactory`

コマンド、コンポーネント、モーダルなどのハンドラをファイルごとに分割しやすくするためのファクトリ関数です。型定義(`Env`)の共有や、ハンドラと定義の関連付けを容易にします。

**基本的な使い方:**

1.  **ファクトリの作成 (`src/init.ts` など)**
    ```typescript
    // src/init.ts
    import { createFactory } from 'discord-hono'
    import type { Env as HonoEnv } from 'hono' // 必要に応じて Hono の Env も

    // アプリケーション全体で使う環境変数や変数の型を定義
    export type Env = HonoEnv & { // Hono の Env を継承すると便利
      Bindings: {
        DISCORD_APPLICATION_ID: string
        DISCORD_PUBLIC_KEY: string
        DISCORD_TOKEN: string
        DB: D1Database // 例: D1 データベース
      }
      Variables: {
        userId?: string // 例: ミドルウェアでセットする変数
      }
    }

    // ファクトリを作成し、エクスポート
    export const factory = createFactory<Env>()
    ```

2.  **ハンドラの定義 (`src/handlers/` など)**
    ```typescript
    // src/handlers/hello-world.ts
    import { Command } from 'discord-hono'
    import { factory } from '../init.js' // ファクトリをインポート (.js を忘れずに)

    // factory.command() を使ってコマンド定義とハンドラを紐付ける
    export const command_hello = factory.command(
      new Command('hello', 'response world'), // コマンド定義
      async c => { // ハンドラ (Context の型は Env が適用される)
        const user = c.var.userId ?? c.interaction?.member?.user?.id ?? '不明なユーザー'
        return c.res(`Hello ${user}!`)
      }
    )

    // src/handlers/buttons.ts
    import { Button, Components } from 'discord-hono'
    import { factory } from '../init.js'

    // ボタン定義とハンドラ
    export const component_button1 = factory.component(
      new Button('btn-1', 'ボタン1'),
      c => c.resUpdate('ボタン1が押されました！')
    )

    // モーダル定義とハンドラ (例)
    // export const modal_feedback = factory.modal(...)
    ```

3.  **ハンドラの集約とロード (`src/index.ts`)**
    ```typescript
    // src/index.ts
    import * as handlers from './handlers' // handlers ディレクトリ内のエクスポートをまとめてインポート
    import { factory } from './init' // ファクトリをインポート

    const app = factory
      .discord() // DiscordHono インスタンスを取得 (型適用済み)
      .loader(Object.values(handlers)) // handlers 内の factory で作成された定義をロード

    // ミドルウェアなどの追加 (Hono と同様)
    app.use('*', async (c, next) => {
      // 例: ユーザーIDをセット
      // c.set('userId', c.interaction?.member?.user?.id)
      await next()
    })

    export default app
    ```

4.  **コマンド登録 (`src/register.ts`)**
    ```typescript
    // src/register.ts
    import { register } from 'discord-hono'
    import * as handlers from './handlers/index.js' // .js を忘れずに

    // handlers から コマンド定義 (.command プロパティを持つもの) を抽出
    const commands = Object.values(handlers)
      .filter(e => e && typeof e === 'object' && 'command' in e) // factory.command()で作られたオブジェクトをフィルタリング
      .map(e => e.command) // Command オブジェクトを取得

    register(
      commands,
      process.env.DISCORD_APPLICATION_ID!,
      process.env.DISCORD_TOKEN!,
      process.env.DISCORD_TEST_GUILD_ID, // 開発用にギルドIDを指定
    )

    console.log('Commands registered.')
    ```

5.  **ハンドラのエクスポート (`src/handlers/index.ts`)**
    ```typescript
    // src/handlers/index.ts
    // 各ハンドラファイルをエクスポートしてまとめる
    export * from './hello-world.js'
    export * from './buttons.js'
    // ... 他のハンドラファイル
    ```

**コンポーネント要素を使い回すとき:**

同じ定義のコンポーネント (ボタンなど) を複数の場所で使いたいが、`custom_id` やラベルなどを動的に変更したい場合があります。その際は、元の定義をコピーしてから変更し、`.toJSON()` でオブジェクトに変換して使用します。

```typescript
// src/handlers/pagination.ts (抜粋)
import { Button, Command, type CommandContext, type ComponentContext, Components, Embed } from 'discord-hono'
import { type Env, factory } from '../init.js'

// ページネーションボタンのベース定義 (custom_id は後で設定)
const component_page_base = factory.component(
  new Button('page', '', 'Secondary'), // custom_id は空 or プレースホルダー
  c => { // ハンドラ (custom_id からページ番号などを取得して処理)
    try {
      const [page, content]: [number, string] = JSON.parse(c.var.custom_id ?? '[]')
      if (typeof page !== 'number' || typeof content !== 'string') throw new Error('Invalid custom_id')
      return c.resUpdate(pageContent(c, page, content)) // pageContent でメッセージ更新
    } catch (e) {
      console.error('Failed to parse pagination custom_id:', e)
      return c.resUpdate({ content: 'エラーが発生しました。', components: [] }) // エラー時
    }
  }
)

// ページ内容を生成する関数
const pageContent = (
  c: CommandContext<Env> | ComponentContext<Env, 'Button'>,
  page: number,
  content: string,
) => {
  const maxPage = 5 // 例: 最大ページ数
  const embed = new Embed().title('ページネーション').description(`${content}\nページ: ${page} / ${maxPage}`)

  const components = new Components().row(
    // component_page_base をコピーして custom_id やラベル、無効状態を設定
    component_page_base.component // Button インスタンスを取得
      .emoji('⬅️').label('前へ')
      .custom_id(JSON.stringify([page - 1, content])) // custom_id を動的に設定
      .disabled(page <= 1) // 最初のページでは無効
      .toJSON(), // ★ オブジェクトに変換

    component_page_base.component
      .emoji('➡️').label('次へ')
      .custom_id(JSON.stringify([page + 1, content]))
      .disabled(page >= maxPage) // 最後のページでは無効
      .toJSON(), // ★ オブジェクトに変換
  )
  return { embeds: [embed], components }
}

// ページネーションコマンド
export const command_page = factory.command(
  new Command('page', 'ページネーションの例'),
  c => c.res(pageContent(c, 1, 'これがコンテンツです。')), // 初期ページ表示
)

// ★注意: component_page_base 自体も handlers/index.ts で export する必要あり
// export { component_page_base } // ただし、直接は使わないので名前を変えるかコメントアウト推奨
```

`.toJSON()` を使わずに同じ `component_page_base.component` を複数回使うと、最後の設定が全てに適用されてしまい、意図しない動作になります。`.toJSON()` で各ボタンを独立したオブジェクトにすることが重要です。

## `retry429`

Discord API のレートリミット (HTTP 429 Too Many Requests) が発生した場合に、指定された回数だけリトライするヘルパー関数です。

```typescript
import { retry429, Rest, _channels_$_messages } from 'discord-hono'

const token = process.env.DISCORD_TOKEN!
const channel_id = 'YOUR_CHANNEL_ID'

const manyPosts = async () => {
  const rest = new Rest(token)
  console.log('Start posting 10 messages...')
  for (let i = 0; i < 10; i++) {
    try {
      // retry429 で API 呼び出しをラップ
      await retry429(
        // 第1引数: 実行したい非同期関数 (API呼び出し)
        () => rest.post(_channels_$_messages, [channel_id], { content: `Message ${i + 1}` }),
        // 第2引数 (任意): 最大リトライ回数 (デフォルト: 3)
        5,
        // 第3引数 (任意): リトライ待機時間 (ミリ秒, デフォルト: 5000)
        3000,
      )
      console.log(`Posted message ${i + 1}`)
    } catch (e) {
      console.error(`Failed to post message ${i + 1} after retries:`, e)
      // 必要に応じてエラー処理
      break // エラーが発生したらループを抜けるなど
    }
    // レートリミットを避けるために少し待機 (任意)
    // await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log('Finished posting.')
}

manyPosts()
```

短時間に大量のAPIリクエストを行う可能性がある場合（例: 大規模なサーバーへのメッセージ送信、大量のロール付与など）に役立ちます。

# コード例

## 実例リポジトリ

*   **シンプルな Example**: discord-hono の基本的な使い方
    *   [https://github.com/luisfun/discord-hono-example](https://github.com/luisfun/discord-hono-example)
*   **AI で遊ぶ**: Cloudflare AI を利用したテキスト生成・画像生成ボット
    *   [https://github.com/luisfun/discord-bot-cloudflare-ai](https://github.com/luisfun/discord-bot-cloudflare-ai)
*   **Web サイトのニュースを配信**: Cloudflare D1, Browser Rendering, Cron を利用した定期的な情報配信ボット
    *   [https://github.com/luisfun/discord-bot-hoyo-news](https://github.com/luisfun/discord-bot-hoyo-news)

## ページネーション

インタラクション（ボタン）を使ってメッセージの内容を切り替える例です。`createFactory` を使わない場合のシンプルな実装です。

**`index.ts`**
```typescript
import {
  DiscordHono,
  CommandContext,
  ComponentContext,
  Button,
  Components,
  Embed,
  Command, // Command, Option をインポート
  Option,
} from 'discord-hono'
import type { Env as HonoEnv } from 'hono'

// 環境変数と変数の型 (必要に応じて)
type Env = HonoEnv & {
  Bindings: {
    // ... 環境変数
  }
  Variables: {
    content?: string // コマンドオプション 'content' の値
    custom_id?: string // コンポーネントの custom_id
  }
}

// ページの内容とボタンを生成する関数
const pageContent = (
  c: CommandContext<Env> | ComponentContext<Env, 'Button'>, // 型を結合
  page: number,
  content: string,
): { embeds: Embed[]; components: Components } => { // 戻り値の型を明記
  ///// Process (例: DBアクセスなど) /////
  // const db = c.env.DB

  ///// Response Build /////
  const maxPage = 3 // 最大ページ数
  const embed = new Embed()
    .title('ページネーションの例')
    .description(`${content}\nページ: ${page} / ${maxPage}`)
    .setColor(0x7289da)

  // ボタンの custom_id にページ番号と内容を JSON 文字列として埋め込む
  const prevCustomId = JSON.stringify([page - 1, content])
  const nextCustomId = JSON.stringify([page + 1, content])

  const components = new Components().row(
    new Button('page', ['⬅️', '前へ'], 'Secondary') // 第1引数を共通の 'page' に
      .custom_id(prevCustomId) // 前ページの情報をセット
      .disabled(page <= 1), // 最初のページでは無効化
    new Button('page', ['➡️', '次へ'], 'Secondary')
      .custom_id(nextCustomId) // 次ページの情報をセット
      .disabled(page >= maxPage), // 最後のページでは無効化
  )
  return { embeds: [embed], components }
}

// DiscordHono アプリケーション
const app = new DiscordHono<Env>()
  // /page コマンドハンドラ
  .command('page', c => {
    const content = c.var.content ?? 'デフォルトのコンテンツ'
    // 最初のページ (page=1) を表示
    return c.res(pageContent(c, 1, content))
  })
  // ボタン ('page' custom_id) のインタラクションハンドラ
  .component('page', c => {
    try {
      // custom_id からページ番号と内容をパース
      const arr: [number, string] = JSON.parse(c.var.custom_id ?? '[]')
      if (typeof arr[0] !== 'number' || typeof arr[1] !== 'string') {
        throw new Error('Invalid custom_id format')
      }
      const [page, content] = arr
      // 対応するページのコンテンツでメッセージを更新
      return c.resUpdate(pageContent(c, page, content))
    } catch (e) {
      console.error('Pagination error:', e)
      // エラーが発生したらユーザーに通知 (ephemeral)
      return c.ephemeral().res({ content: 'ページの読み込みに失敗しました。', components: [] })
    }
  })

export default app

// register.ts で登録するコマンド定義
export const commands = [
  new Command('page', 'ページネーションの例を表示します。').options(
    new Option('content', '表示するコンテンツ').type(3).required(), // String 型, 必須
  ),
]
```

**`register.ts`**
```typescript
import { register } from 'discord-hono'
// index.ts からコマンド定義をインポート (または直接定義)
import { commands } from './index' // 仮に index.ts にある場合

register(
  commands,
  process.env.DISCORD_APPLICATION_ID!,
  process.env.DISCORD_TOKEN!,
  process.env.DISCORD_TEST_GUILD_ID, // 開発用に指定推奨
)
console.log('Pagination command registered.')
```

**解説:**

1.  `/page` コマンドが実行されると、`pageContent` 関数を使って初期ページ (1ページ目) の Embed とボタンを含むメッセージを返します (`.res()`)。
2.  ボタンがクリックされると、`.component('page', ...)` ハンドラがトリガーされます。
3.  ハンドラは、クリックされたボタンの `custom_id` (JSON文字列) をパースして、要求されたページ番号 (`page`) とコンテンツ (`content`) を取得します。
4.  取得した情報を使って `pageContent` 関数を再度呼び出し、新しい Embed とボタンを生成します。
5.  生成された内容で元のメッセージを更新します (`.resUpdate()`)。
6.  エラー処理: `custom_id` のパースに失敗した場合などに備え、`try...catch` でエラーを捕捉し、ユーザーに一時的なメッセージで通知します (`.ephemeral().res()`)。

## 正規表現ルーティング (Component/Modal)

`.component()` や `.modal()` の第一引数 (key) は通常完全一致ですが、正規表現や他のカスタムロジックでハンドラを振り分けたい場合の高度な例です。

**ノート:**
通常は、`custom_id` に識別子とデータを `JSON.stringify` などで含め、共通のハンドラ内でパースして処理を分岐する方がシンプルで推奨されます (ページネーションの例を参照)。
以下の方法は、非常に複雑なルーティングが必要な場合にのみ検討してください。

```typescript
import type { Env, ComponentHandler, ModalHandler } from 'discord-hono' // 型をインポート
import { DiscordHono, Button, Components } from 'discord-hono' // 必要なものをインポート

// 型定義 (例)
type MyEnv = Env & { /* ... */ }

// カスタムロジックを持つ Map クラス
class CustomMap<
  E extends MyEnv, // 環境の型
  // ハンドラの型 (ComponentHandler または ModalHandler)
  H extends ComponentHandler<E, any> | ModalHandler<E>,
> extends Map<string | RegExp, H> { // キーは string または RegExp
  override get = (key: string): H => { // マッチするハンドラを返す get メソッドをオーバーライド
    // 1. 完全一致を試す
    if (super.has(key)) {
      return super.get(key)!
    }

    ///// カスタムロジック: 正規表現でのマッチング /////
    for (const [k, v] of this) { // Map 内の全エントリを走査
      if (k instanceof RegExp && k.test(key)) { // キーが正規表現で、かつ入力キーにマッチしたら
        return v! // 対応するハンドラを返す
      }
    }
    ///// カスタムロジックここまで /////

    // 3. キャッチオール (キーが '') のハンドラを探す
    if (super.has('')) {
      return super.get('')!
    }

    // 4. どのハンドラにもマッチしなかった場合エラー
    throw new Error(`Handler is missing for key: ${key}`)
  }
}

const app = new DiscordHono<MyEnv>()

// キャッチオール Component ハンドラ
app.component('', c => { // 第1引数を '' にして全ての component インタラクションを捕捉
  // カスタム Map を作成
  const map = new CustomMap<MyEnv, ComponentHandler<MyEnv, any>>()

  // ハンドラを登録
  map.set('user-profile', c => c.resUpdate('ユーザープロファイルを表示します')) // 完全一致
  map.set(/^edit-item:\d+$/, c => { // 正規表現: edit-item:(数字)
    const itemId = c.key.split(':')[1] // custom_id (c.key) から ID を取得
    return c.resUpdate(`アイテム ID: ${itemId} を編集します`)
  })
  map.set(/^delete-(user|post)-\d+$/, c => { // 正規表現: delete-(user または post)-(数字)
      const match = c.key.match(/^delete-(user|post)-(\d+)$/)
      const type = match?.[1]
      const id = match?.[2]
      return c.resUpdate(`${type} ID: ${id} を削除します`)
  })
  map.set('', c => c.ephemeral().res('不明なボタンです。')) // デフォルト (どのパターンにもマッチしない場合)

  // マップから適切なハンドラを取得して実行
  try {
    const handler = map.get(c.key) // c.key (custom_id) でハンドラを検索
    return handler(c) // 取得したハンドラを実行
  } catch (e) {
    console.error(e)
    return c.ephemeral().res('エラーが発生しました。')
  }
})

// --- 使用例 ---
app.command('test-regex', c => {
  return c.res({
    content: '正規表現ルーティングのテストボタン',
    components: new Components()
      .row(new Button('user-profile', 'プロファイル')) // 'user-profile' にマッチ
      .row(new Button('edit-item:123', 'アイテム編集')) // /^edit-item:\d+$/ にマッチ
      .row(new Button('delete-post-456', '投稿削除')) // /^delete-(user|post)-\d+$/ にマッチ
      .row(new Button('unknown-button', '不明なボタン')), // '' (デフォルト) にマッチ
  })
})

// 同様に app.modal('', ...) でモーダルにも適用可能

export default app
```

**解説:**

1.  `CustomMap` クラスは `Map` を継承し、`get` メソッドをオーバーライドします。
2.  `get` メソッドは、まずキー (`custom_id`) での完全一致を試みます。
3.  見つからない場合、Map 内のキーが正規表現 (`RegExp`) であれば、入力キー (`custom_id`) に対して `test()` を実行し、マッチすればそのハンドラを返します。
4.  それでも見つからなければ、キーが `''` (空文字列) のキャッチオールハンドラを探します。
5.  `app.component('', ...)` のようにキャッチオールハンドラを登録し、その中で `CustomMap` インスタンスを作成します。
6.  `map.set()` を使って、文字列キーや正規表現キーに対応するハンドラを登録します。
7.  `map.get(c.key)` で `custom_id` にマッチするハンドラを取得し、実行します。
8.  エラー処理 (`try...catch`) で、ハンドラが見つからない場合や実行時エラーに対応します。

この方法は柔軟ですが、正規表現の管理が複雑になる可能性があるため、注意して使用してください。
```