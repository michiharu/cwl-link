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

### How to import

```typescript
// ES5 example
const cwllink = require('cwl-link');
// ES6+ example
import * as cwllink from 'cwl-link';
```

```typescript
exports.handler = function(event, context) {
  // This is a link for a Log Event page filtered by request id.
  const link = cwllink.fromLambdaContext(context);
}
```

### AWS Lambda triggered by Subscription Filters

```typescript
exports.handler = async function(event, context) {
  const link = await cwllink.fromLambdaEventTriggeredBySubscriptionFilters(event);
}
```

Or you can use decoded data.

```typescript
exports.handler = async function(event, context) {
  const decoded = await cwllink.decodeCloudWatchLogsData(event.awslogs.data);

  // you can use decoded data.

  const link = await cwllink.fromCloudWatchLogsData(decoded);
}
```

### Other Node.js runtime environment

```typescript
const region = '...';
const logGroupName = '...';
const logGroupLink = cwllink.create(region, logGroupName);

const logEventName = '...';
const logEventLink = cwllink.create(region, logGroupName, logEventName);

const terms = ['...'];
const filteredByTermsLink = cwllink.create(region, logGroupName, logEventName, { terms });

const start = 1_649_602_800_000; // unix time(ms): 2022-04-12 00:00:00
const filteredByStartLink = cwllink.create(region, logGroupName, logEventName, { start });
const start = -3_600_000; // in the last hour(ms):
const filteredByRelativeStartLink = cwllink.create(region, logGroupName, logEventName, { start });

const end = 1_649_689_199_000; // unix time(ms): 2022-04-12 23:59:59
const filteredByEndLink = cwllink.create(region, logGroupName, logEventName, { end });

const filteredByMixLink = cwllink.create(region, logGroupName, logEventName, { terms, start, end });
```

These Usages have been tested.

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

[index.ts:5](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L5)

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
| `options` | [`FilterOptions`](modules.md#filteroptions) |

#### Returns

`string`

a link for CloudWatch Logs.

#### Defined in

[index.ts:27](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L27)

___

### decodeCloudWatchLogsData

▸ **decodeCloudWatchLogsData**(`data`): `Promise`<`CloudWatchLogsDecodedData`\>

Decode CloudWatch Logs data.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `string` | base64 of zipped data. |

#### Returns

`Promise`<`CloudWatchLogsDecodedData`\>

CloudWatch Logs decoded data.

#### Defined in

[index.ts:91](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L91)

___

### fromCloudWatchLogsData

▸ **fromCloudWatchLogsData**(`data`): `Promise`<`string`\>

Create a link for CloudWatch Logs from CloudWatchLogsDecodedData.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `CloudWatchLogsDecodedData` | CloudWatch Logs decoded data. |

#### Returns

`Promise`<`string`\>

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:105](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L105)

___

### fromLambdaContext

▸ **fromLambdaContext**(`context`): `string`

Create a link for CloudWatch Logs from a context of AWS Lambda.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `Context` | a context of AWS Lambda. |

#### Returns

`string`

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:64](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L64)

___

### fromLambdaEventTriggeredBySubscriptionFilters

▸ **fromLambdaEventTriggeredBySubscriptionFilters**(`event`): `Promise`<`string`\>

Create a link for CloudWatch Logs from a event of AWS Lambda triggered by Subscription Filters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `CloudWatchLogsEvent` | a event of AWS Lambda triggered by Subscription Filters. |

#### Returns

`Promise`<`string`\>

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:119](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L119)

___

### gunzipAsync

▸ **gunzipAsync**(`src`): `Promise`<`Buffer`\>

gunzipAsync is a promise wapper of zlib.gunzip.

#### Parameters

| Name | Type |
| :------ | :------ |
| `src` | `Buffer` |

#### Returns

`Promise`<`Buffer`\>

decompressed

#### Defined in

[index.ts:76](https://github.com/michiharu/cwl-link/blob/538e650/src/index.ts#L76)
