import * as zlib from 'zlib';
import { CloudWatchLogsDecodedData, CloudWatchLogsEvent, Context } from 'aws-lambda';
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
  test(`create('region', '') returns the log groups link`, () => {
    expect(cwllink.create('region', '')).toBe(`${base}#logsV2:log-groups`);
  });

  test(`create('region', '', 'LOG_EVENT', { terms: ['REQUEST_ID'] }) returns the log groups link`, () => {
    expect(cwllink.create('region', '', 'LOG_EVENT', { terms: ['REQUEST_ID'] })).toBe(`${base}#logsV2:log-groups`);
  });

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

describe('cwllink.create() console domain', () => {
  const link = (host: string, region: string) =>
    `https://${region}.${host}/cloudwatch/home?region=${region}#logsV2:${groupPart}`;

  test(`create('cn-north-1', 'LOG_GROUP') uses console.amazonaws.cn`, () => {
    expect(cwllink.create('cn-north-1', 'LOG_GROUP')).toBe(
      `https://cn-north-1.console.amazonaws.cn/cloudwatch/home?region=cn-north-1#logsV2:${groupPart}`
    );
  });

  test(`create('cn-north-1', '') uses console.amazonaws.cn`, () => {
    expect(cwllink.create('cn-north-1', '')).toBe(
      'https://cn-north-1.console.amazonaws.cn/cloudwatch/home?region=cn-north-1#logsV2:log-groups'
    );
  });

  test(`create('cn-northwest-1', 'LOG_GROUP') uses console.amazonaws.cn`, () => {
    expect(cwllink.create('cn-northwest-1', 'LOG_GROUP')).toBe(link('console.amazonaws.cn', 'cn-northwest-1'));
  });

  test(`create('us-gov-west-1', 'LOG_GROUP') uses console.amazonaws-us-gov.com`, () => {
    expect(cwllink.create('us-gov-west-1', 'LOG_GROUP')).toBe(
      `https://us-gov-west-1.console.amazonaws-us-gov.com/cloudwatch/home?region=us-gov-west-1#logsV2:${groupPart}`
    );
  });

  test(`create('us-gov-east-1', 'LOG_GROUP') uses console.amazonaws-us-gov.com`, () => {
    expect(cwllink.create('us-gov-east-1', 'LOG_GROUP')).toBe(link('console.amazonaws-us-gov.com', 'us-gov-east-1'));
  });

  test(`create('us-east-1', 'LOG_GROUP') keeps console.aws.amazon.com`, () => {
    expect(cwllink.create('us-east-1', 'LOG_GROUP')).toBe(link('console.aws.amazon.com', 'us-east-1'));
  });

  test(`create('ap-northeast-1', 'LOG_GROUP') keeps console.aws.amazon.com`, () => {
    expect(cwllink.create('ap-northeast-1', 'LOG_GROUP')).toBe(link('console.aws.amazon.com', 'ap-northeast-1'));
  });

  test(`create('cn-north-1', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] }) keeps the hash unchanged`, () => {
    const url = new URL(cwllink.create('cn-north-1', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] }));
    expect(url.host).toBe('cn-north-1.console.amazonaws.cn');
    expect(url.hash).toBe(`#logsV2:${groupPart}/${eventPart}$3F${termPart()}`);
  });
});

process.env.AWS_REGION = 'region';

const otherBase = `https://other.console.aws.amazon.com/cloudwatch/home?region=other`;
const regionError = 'cwl-link: region could not be resolved. Pass the region argument or set AWS_REGION.';

/** Run fn with AWS_REGION unset, and restore it after fn (or the promise it returns) settles. */
const withoutAwsRegion = async (fn: () => unknown): Promise<void> => {
  const saved = process.env.AWS_REGION;
  delete process.env.AWS_REGION;
  try {
    await fn();
  } finally {
    if (saved === undefined) delete process.env.AWS_REGION;
    else process.env.AWS_REGION = saved;
  }
};

describe('cwllink.fromLambdaContext()', () => {
  const context: Pick<Context, 'logGroupName' | 'logStreamName' | 'awsRequestId'> = {
    logGroupName: 'LOG_GROUP',
    logStreamName: 'LOG_EVENT',
    awsRequestId: termId,
  };

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

  test(`fromLambdaContext(context, 'other') uses the argument over AWS_REGION`, () => {
    expect(cwllink.fromLambdaContext(context as Context, 'other')).toBe(
      `${otherBase}#logsV2:${groupPart}/${eventPart}$3F${termPart()}`
    );
  });

  test(`fromLambdaContext(context, 'us-gov-west-1') links to the GovCloud console`, () => {
    expect(cwllink.fromLambdaContext(context as Context, 'us-gov-west-1')).toBe(
      `https://us-gov-west-1.console.amazonaws-us-gov.com/cloudwatch/home?region=us-gov-west-1#logsV2:${groupPart}/${eventPart}$3F${termPart()}`
    );
  });

  test('fromLambdaContext(context) throws when AWS_REGION is not set', async () => {
    await withoutAwsRegion(() => {
      expect(() => cwllink.fromLambdaContext(context as Context)).toThrow(regionError);
    });
  });

  test(`fromLambdaContext(context, 'region') works when AWS_REGION is not set`, async () => {
    await withoutAwsRegion(() => {
      expect(cwllink.fromLambdaContext(context as Context, 'region')).toBe(
        `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart()}`
      );
    });
  });
});

describe('cwllink.decodeCloudWatchLogsData()', () => {
  test('contains Japanese', async () => {
    // Buffer.from(zlib.gzipSync(`{"message":"こんにちは。"}`)).toString('base64');
    const data = 'H4sIAAAAAAAAE6tWyk0tLk5MT1WyUnrcOPlx0+THjasfNy583Lj+cUOTUi0Allde1iAAAAA=';
    expect(await cwllink.decodeCloudWatchLogsData(data)).toEqual({ message: 'こんにちは。' });
  });
});

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

describe('cwllink.fromCloudWatchLogsData()', () => {
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

  test(`fromCloudWatchLogsData(data, 'other') uses the argument over AWS_REGION`, () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\t${uuid4}\tERROR\n`);
    const link = cwllink.fromCloudWatchLogsData(decoded, 'other');
    expect(link).toBe(`${otherBase}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
  });

  test('fromCloudWatchLogsData(data) throws when AWS_REGION is not set', async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\t${uuid4}\tERROR\n`);
    await withoutAwsRegion(() => {
      expect(() => cwllink.fromCloudWatchLogsData(decoded)).toThrow(regionError);
    });
  });

  test('fromCloudWatchLogsData(data) with empty logEvents returns the log stream link', () => {
    const decoded = { ...createDecodedData(''), logEvents: [] };
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}`);
  });

  test('fromCloudWatchLogsData(data) with empty logEvents still throws when AWS_REGION is not set', async () => {
    const decoded = { ...createDecodedData(''), logEvents: [] };
    await withoutAwsRegion(() => {
      expect(() => cwllink.fromCloudWatchLogsData(decoded)).toThrow(regionError);
    });
  });

  test('fromCloudWatchLogsData(data) with CONTROL_MESSAGE returns the log group link', () => {
    const decoded = {
      ...createDecodedData('CWL CONTROL MESSAGE: Checking health of destination Firehose.'),
      messageType: 'CONTROL_MESSAGE',
    };
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:${groupPart}`);
  });

  test('fromCloudWatchLogsData(data) with a real CONTROL_MESSAGE payload returns the log groups link', () => {
    const decoded: CloudWatchLogsDecodedData = {
      messageType: 'CONTROL_MESSAGE',
      owner: 'CloudwatchLogs',
      logGroup: '',
      logStream: '',
      subscriptionFilters: [],
      logEvents: [
        { id: '', timestamp: 1510109208016, message: 'CWL CONTROL MESSAGE: Checking health of destination Firehose.' },
      ],
    };
    const link = cwllink.fromCloudWatchLogsData(decoded);
    expect(link).toBe(`${base}#logsV2:log-groups`);
  });
});

describe('cwllink.fromLambdaEventTriggeredBySubscriptionFilters()', () => {
  test(`fromLambdaEventTriggeredBySubscriptionFilters(event, 'region') forwards the region`, async () => {
    const uuid4 = '01234567-89ab-cdef-0123-456789abcdef';
    const decoded = createDecodedData(`2025-03-01T-00:00:00.000Z\t${uuid4}\tERROR\n`);
    const data = Buffer.from(zlib.gzipSync(JSON.stringify(decoded))).toString('base64');
    const event: CloudWatchLogsEvent = { awslogs: { data } };
    await withoutAwsRegion(async () => {
      const link = await cwllink.fromLambdaEventTriggeredBySubscriptionFilters(event, 'region');
      expect(link).toBe(`${base}#logsV2:${groupPart}/${eventPart}$3F${termPart(uuid4)}`);
    });
  });

  test('fromLambdaEventTriggeredBySubscriptionFilters(event) with CONTROL_MESSAGE returns the log group link', async () => {
    const decoded = {
      ...createDecodedData('CWL CONTROL MESSAGE: Checking health of destination Firehose.'),
      messageType: 'CONTROL_MESSAGE',
    };
    const data = Buffer.from(zlib.gzipSync(JSON.stringify(decoded))).toString('base64');
    const event: CloudWatchLogsEvent = { awslogs: { data } };
    const link = await cwllink.fromLambdaEventTriggeredBySubscriptionFilters(event);
    expect(link).toBe(`${base}#logsV2:${groupPart}`);
  });
});
