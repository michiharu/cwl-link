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

### TypeScript

`cwl-link` ships its own type definitions and does not require `@types/aws-lambda`. The `Context`, `CloudWatchLogsEvent` and `CloudWatchLogsDecodedData` types from `@types/aws-lambda` are accepted as they are.

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

The region is read from `AWS_REGION`, which the Lambda runtime sets, or you can pass it as the second argument (`cwllink.fromLambdaContext(context, 'us-east-1')`). The same applies to `fromCloudWatchLogsData` and `fromLambdaEventTriggeredBySubscriptionFilters`. If neither is available, the function throws.

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

  const link = cwllink.fromCloudWatchLogsData(decoded);
}
```

Subscription filters also deliver a `CONTROL_MESSAGE` payload to check that the destination is reachable. It is not log data, so `fromCloudWatchLogsData` and `fromLambdaEventTriggeredBySubscriptionFilters` return the log group link for it. The payload AWS sends has an empty `logGroup`, so in practice that is the log groups list of the region.

### Other Node.js runtime environment

```typescript
const region = '...';
const logGroupName = '...';
const logGroupsLink = cwllink.create(region, ''); // the log groups list of the region
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

The console host is chosen from the region. `cn-*` regions link to `console.amazonaws.cn`, `us-gov-*` regions link to `console.amazonaws-us-gov.com`, and every other region links to `console.aws.amazon.com`. An empty `logGroup` links to the log groups list of the region instead of a single log group.

These Usages have been tested.

## Type Aliases

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

[index.ts:5](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L5)

___

### LambdaContext

Ƭ **LambdaContext**: `Object`

The fields of an AWS Lambda `Context` that this library reads.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `awsRequestId` | `string` |
| `logGroupName` | `string` |
| `logStreamName` | `string` |

___

### CloudWatchLogsEvent

Ƭ **CloudWatchLogsEvent**: `Object`

The event AWS Lambda receives from a CloudWatch Logs subscription filter.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `awslogs` | `{ data: string }` |

___

### CloudWatchLogsDecodedData

Ƭ **CloudWatchLogsDecodedData**: `Object`

The payload of a CloudWatch Logs subscription filter, after base64 decoding and gunzip.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `logEvents` | `CloudWatchLogsLogEvent`[] |
| `logGroup` | `string` |
| `logStream` | `string` |
| `messageType` | `string` |
| `owner` | `string` |
| `subscriptionFilters` | `string`[] |

___

### CloudWatchLogsLogEvent

Ƭ **CloudWatchLogsLogEvent**: `Object`

A log event inside CloudWatchLogsDecodedData.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `extractedFields?` | `object` |
| `id` | `string` |
| `message` | `string` |
| `timestamp` | `number` |

`extractedFields` maps a field name to `string | undefined`.

## Functions

### create

▸ **create**(`region`, `logGroup`, `logEvents?`, `options?`): `string`

Create a link for CloudWatch Logs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `region` | `string` |  |
| `logGroup` | `string` |  |
| `logEvents?` | `string` | optional parameter |
| `options?` | [`FilterOptions`](modules.md#filteroptions) | optional parameter for filtering logs |

#### Returns

`string`

a link for CloudWatch Logs.

#### Defined in

[index.ts:27](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L27)

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

[index.ts:93](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L93)

___

### fromCloudWatchLogsData

▸ **fromCloudWatchLogsData**(`data`, `region?`): `string`

Create a link for CloudWatch Logs from CloudWatchLogsDecodedData.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `CloudWatchLogsDecodedData` | CloudWatch Logs decoded data. |
| `region?` | `string` | defaults to `AWS_REGION` |

#### Returns

`string`

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:107](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L107)

___

### fromLambdaContext

▸ **fromLambdaContext**(`context`, `region?`): `string`

Create a link for CloudWatch Logs from a context of AWS Lambda.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `context` | `LambdaContext` | a context of AWS Lambda. |
| `region?` | `string` | defaults to `AWS_REGION` |

#### Returns

`string`

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:66](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L66)

___

### fromLambdaEventTriggeredBySubscriptionFilters

▸ **fromLambdaEventTriggeredBySubscriptionFilters**(`event`, `region?`): `Promise`<`string`\>

Create a link for CloudWatch Logs from a event of AWS Lambda triggered by Subscription Filters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `CloudWatchLogsEvent` | a event of AWS Lambda triggered by Subscription Filters. |
| `region?` | `string` | defaults to `AWS_REGION` |

#### Returns

`Promise`<`string`\>

a link for a Log Event page filtered by request id.

#### Defined in

[index.ts:121](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L121)

___

### gunzipAsync

▸ **gunzipAsync**(`src`): `Promise`<`Buffer`\>

gunzipAsync is a promise wrapper of zlib.gunzip.

#### Parameters

| Name | Type |
| :------ | :------ |
| `src` | `Buffer` |

#### Returns

`Promise`<`Buffer`\>

decompressed

#### Defined in

[index.ts:78](https://github.com/michiharu/cwl-link/blob/83997cc/src/index.ts#L78)
