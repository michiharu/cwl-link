import { Context } from 'aws-lambda';
import * as cwllink from './index';

const base = `https://region.console.aws.amazon.com/cloudwatch/home?region=region`;
const groupPart = 'log-groups/log-group/LOG_GROUP';
const eventPart = 'log-events/LOG_EVENT';
const termPart = 'filterPattern$3D$2522REQUEST_ID$2522';
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

  test(`create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] })`, () => {
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', { terms: ['REQUEST_ID'] })).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart}`
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
      terms: ['REQUEST_ID'],
      start: 1_649_602_800_000,
      end: 1_649_689_199_000,
    };
    expect(cwllink.create('region', 'LOG_GROUP', 'LOG_EVENT', options)).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart}$26${startPart}$26${endPart}`
    );
  });
});

process.env.AWS_REGION = 'region';
describe('cwllink.fromLambdaContext()', () => {
  test('fromLambdaContext(context)', () => {
    const context: Pick<Context, 'logGroupName' | 'logStreamName' | 'awsRequestId'> = {
      logGroupName: 'LOG_GROUP',
      logStreamName: 'LOG_EVENT',
      awsRequestId: 'REQUEST_ID',
    };
    expect(cwllink.fromLambdaContext(context as Context)).toBe(
      `${base}#logsV2:${groupPart}/${eventPart}$3F${termPart}`
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
