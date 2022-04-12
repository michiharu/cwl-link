# cwl-link(CloudWatch Logs Link)

`cwl-link` creates a link for CloudWatch Logs.

## Installation

`cwl-link` is available as an npm package.

```bash
// with npm
npm install cwl-link

// with yarn
yarn add cwl-link
```

## Usage

### AWS Lambda function handler

```typescript
// ES5 example
const cwllink = require('cwl-link');
// ES6+ example
import cwllink from 'cwl-link';

exports.handler =  async function(event, context) {
  // This is a link for a Log Event page filtered by request id.
  const link = cwllink.fromLambdaContext(context);
}
```

### Other Node.js runtime environment

```typescript
// ES5 example
const cwllink = require('cwl-link');
// ES6+ example
import cwllink from 'cwl-link';

const region = '...';
const logGroupName = '...';
const logGroupLink = cwllink.create(region, logGroupName);

const logEventName = '...';
const logEventLink = cwllink.create(region, logGroupName, logEventName);

const terms = ['...'];
const filteredByTermsLink = cwllink.create(region, logGroupName, logEventName, { terms });

const start = 1_649_602_800_000; // unix time(ms): 2022-04-12 00:00:00
const filteredByStartLink = cwllink.create(region, logGroupName, logEventName, { start });

const end = 1_649_689_199_000; // unix time(ms): 2022-04-12 23:59:59
const filteredByEndLink = cwllink.create(region, logGroupName, logEventName, { end });
const filteredByStartAndEndLink = cwllink.create(region, logGroupName, logEventName, { start, end });

const start = -3_600_000; // in the last hour(ms):
const filteredByRelativeStartLink = cwllink.create(region, logGroupName, logEventName, { start });
```

## Type aliases

### FilterOptions

Ƭ **FilterOptions**: `Object`

Options for filtering logs.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `end?` | `number` | You can provide unix timestamp. |
| `start?` | `number` | You can provide the absolute or relative time(ms). - if you provide unix timestamp, it is treated as absolute time. - if you provide negative number, it is treated as relative time. |
| `terms?` | `string`[] | You can filter by string array. |

#### Defined in

[index.ts:4](https://github.com/michiharu/cwl-link/blob/bd277a7/src/index.ts#L4)

## Functions

### create

▸ **create**(`region`, `logGroup`, `logEvents?`, `options?`): `string`

Create a link for CloudWatch Logs.

#### Parameters

| Name | Type |
| :------ | :------ |
| `region` | `string` |
| `logGroup` | `string` |
| `logEvents?` | `string` |
| `options` | `FilterOptions` |

#### Returns

`string`

a link for CloudWatch Logs.

#### Defined in

[index.ts:26](https://github.com/michiharu/cwl-link/blob/bd277a7/src/index.ts#L26)

___

### fromLambdaContext

▸ **fromLambdaContext**(`context`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `Context` |

#### Returns

`string`

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:63](https://github.com/michiharu/cwl-link/blob/bd277a7/src/index.ts#L63)
