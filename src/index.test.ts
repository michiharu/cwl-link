import { CloudWatchLogsDecodedData, Context } from 'aws-lambda';
import * as cwllink from './index';

const base = `https://region.console.aws.amazon.com/cloudwatch/home?region=region`;
const groupId = 'LOG_GROUP';
const groupPart = `log-groups/log-group/${groupId}`;
const eventId = 'LOG_EVENT';
const eventPart = `log-events/${eventId}`;
const termId = 'REQUEST_ID';
const termPart = (id: string = termId) => `filterPattern$3D$2522${id}$2522`;
const startPart = 'start$3D1649602800000';
const startRelativePart = 'start$3D-3600000';
const endPart = 'end$3D1649689199000';

describe('cwllink.create()', () => {
  test(`create('region', 'LOG_GROUP')`, () => {
    expect(cwllink.create('region', 'LOG_GROUP')).toBe(`${base}#logsV2:${groupPart}`);
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT')`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT')).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: [] })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: [] })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { start: undefined })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { start: undefined })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', {})`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', {})).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: [], start })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: [], start: 1_649_602_800_000 })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${startPart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart()}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { start: 1_649_602_800_000 })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { start: 1_649_602_800_000 })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${startPart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { start: -3_600_000 })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { start: -3_600_000 })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${startRelativePart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { end: 1_649_689_199_000 })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { end: 1_649_689_199_000 })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${endPart}`
    );
  });

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { terms, start, end })`, () => {
    const options: cwllink.FilterOptions = {
      terms: [termId],
      start: 1_649_602_800_000,
      end: 1_649_689_199_000,
    };
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', options)).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart()}$26${startPart}$26${endPart}`
    );
  });
});

process.env.AWS_REGION = 'region';
describe('cwllink.fromLambdaContext()', () => {
  test('fromLambdaContext(context)', () => {
    const context: Pick<Context, 'logGroupName' | 'logStreamName' | 'awsRequestId'> = {
      logGroupName: 'LOG_GROUP',
      logStreamName: 'LOG_EVENT',
      awsRequestId: termId,
    };
    expect(cwllink.fromLambdaContext(context as Context)).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart()}`
    );
  });
});

describe('cwllink.decodeCloudWatchLogsData()', () => {
  test('contains Japanese', async () => {
    // Buffer.from(zlib.gzipSync(`{"message":"こんにちは。"}`)).toString('base64');
    const data = 'H4sIAAAAAAAAE6tWyk0tLk5MT1WyUnrcOPlx0+THjasfNy583Lj+cUOTUi0Allde1iAAAAA=';
    expect(await cwllink.decodeCloudWatchLogsData(data)).toEqual({ message: 'こんにちは。' });
  });
});

describe('cwllink.fromCloudWatchLogsData()', () => {
  const createDecodedData = (message: string): CloudWatchLogsDecodedData => {
    return {
      messageType: 'DATA_MESSAGE',
      owner: 'owner-id',
      logGroup: groupId,
      logStream: eventId,
      subscriptionFilters: ['abcd1234'],
      logEvents: [
        {
          id: 'abcd1234',
          timestamp: 0,
          message: message,
        },
      ],
    };
  };

  test('init error log', async () => {
    const decoded = createDecodedData('2025-03-01T-00:00:00.000Z\tundefined\tERROR\n');
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('request error log', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\t${uuid4}\tERROR\n`);
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('init error log with an unrelated UUID in the body', async () => {
    const other = 'fedcba98-7654-3210-fedc-ba9876543210';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\tundefined\tERROR\tfailed to load ${other}\n`);
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('request log with another UUID in the body', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const other = 'fedcba98-7654-3210-fedc-ba9876543210';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\t${uuid4}\tINFO\torder ${other} created\n`);
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('START line', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(`START RequestId: ${uuid4} Version: $LATEST\n`);
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('REPORT line', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(
      `REPORT RequestId: ${uuid4}\tDuration: 1.00 ms\tBilled Duration: 1 ms\tMemory Size: 128 MB\n`
    );
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('non-hex UUID-like id is ignored', async () => {
    const decoded = createDecodedData('2025-03-01T-00:00:00.000Z\tzzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz\tERROR\n');
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('plain message without tabs', async () => {
    const decoded = createDecodedData('hello world');
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('JSON log with requestId', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const other = 'fedcba98-7654-3210-fedc-ba9876543210';
    const decoded = createDecodedData(
      JSON.stringify({
        timestamp: '2025-03-01T00:00:00.000Z',
        level: 'ERROR',
        requestId: uuid4,
        message: `failed for user ${other}`,
      })
    );
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('JSON platform event with record.requestId', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(
      JSON.stringify({
        time: '2025-03-01T00:00:00.000Z',
        type: 'platform.start',
        record: { requestId: uuid4, version: '$LATEST' },
      })
    );
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('JSON log without requestId', async () => {
    const other = 'fedcba98-7654-3210-fedc-ba9876543210';
    const decoded = createDecodedData(
      JSON.stringify({ timestamp: '2025-03-01T00:00:00.000Z', level: 'ERROR', message: `init failed ${other}` })
    );
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('JSON log with a non-UUID requestId', async () => {
    const decoded = createDecodedData(
      JSON.stringify({ timestamp: '2025-03-01T00:00:00.000Z', level: 'ERROR', requestId: 'not-a-uuid' })
    );
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('malformed JSON starting with {', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData('{"requestId": "' + uuid4);
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });
});
