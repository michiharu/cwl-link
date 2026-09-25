import * as zlib from 'zlib';
import { Context, CloudWatchLogsEvent, CloudWatchLogsDecodedData } from 'aws-lambda';

/** Options for filtering logs. */
export type FilterOptions = {
  /** You can filter by string array. */
  terms?: string[];
  /**
   * You can provide the absolute or relative time(ms).
   * - if you provide unix timestamp, it is treated as absolute time.
   * - if you provide negative number, it is treated as relative time.
   */
  start?: number;
  /** You can provide unix timestamp. */
  end?: number;
};

/**
 * Create a link for CloudWatch Logs.
 *
 * @param {string} region
 * @param {string} logGroup
 * @param {string} [logEvents] optional parameter
 * @param {string[]} [options] optional parameter for filtering logs
 * @return {*} a link for CloudWatch Logs.
 */
export const create = (region: string, logGroup: string, logEvents?: string, options: FilterOptions = {}): string => {
  const url = new URL(`https://${region}.console.aws.amazon.com/cloudwatch/home`);
  url.searchParams.set('region', region);

  const group = encodeURIComponent(encodeURIComponent(logGroup)).replace(/%/g, '$');
  const groupPart = `logsV2:log-groups/log-group/${group}`
  if (!logEvents) {
    // return logGroup link
    url.hash = groupPart;
    return url.toString();
  }

  const event = encodeURIComponent(encodeURIComponent(logEvents)).replace(/%/g, '$');
  const eventPart = `log-events/${event}`;

  const filters: string[] = [];
  const { terms, start, end } = options;
  if (Array.isArray(terms) && terms.length !== 0)
    filters.push(`filterPattern=${terms.map((t) => encodeURIComponent(`"${t}"`)).join('+')}`);
  if (typeof start === 'number') filters.push(`start=${start}`);
  if (typeof end === 'number') filters.push(`end=${end}`);

  if (filters.length === 0) {
    // return logEvents link
    url.hash = `${groupPart}/${eventPart}`;
    return url.toString();
  }

  // return logEvent link filtered by terms
  const filter = encodeURIComponent(`?${filters.join('&')}`).replace(/%/g, '$');
  url.hash = `${groupPart}/${eventPart}${filter}`;
  return url.toString();
};

/**
 * Create a link for CloudWatch Logs from a context of AWS Lambda.
 *
 * @param {Context} context a context of AWS Lambda.
 * @return {*} a link for a Log Event page filtered by request id.
 */
export const fromLambdaContext = (context: Context): string => {
  const region = process.env.AWS_REGION;
  const { logGroupName, logStreamName, awsRequestId } = context;
  return create(region, logGroupName, logStreamName, { terms: [awsRequestId] });
};

/**
 * gunzipAsync is a promise wrapper of zlib.gunzip.
 *
 * @param {Buffer} compressed
 * @returns decompressed
 */
export const gunzipAsync = (src: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    zlib.gunzip(src, function (e, binary) {
      if (e) reject(e);
      resolve(binary);
    });
  });
};

/**
 * Decode CloudWatch Logs data.
 *
 * @param {string} data base64 of zipped data.
 * @return {CloudWatchLogsDecodedData} CloudWatch Logs decoded data.
 */
export const decodeCloudWatchLogsData = async (data: string): Promise<CloudWatchLogsDecodedData> => {
  const compressed = Buffer.from(data, 'base64');
  const decompressed = await gunzipAsync(compressed);
  const utf8 = decompressed.toString('utf-8');
  const cleaned = utf8.replace(/[\u0000-\u001F]+/g, '');
  return JSON.parse(cleaned) as CloudWatchLogsDecodedData;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read the request id from a Lambda log line in the JSON log format.
 *
 * Only the `requestId` field and the `record.requestId` field (platform events) are read.
 *
 * @param {string} message a message of a log event.
 * @return {string | undefined} the request id, or undefined if the message is not such a JSON log line.
 */
const requestIdFromJson = (message: string): string | undefined => {
  if (!message.trimStart().startsWith('{')) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined;

  const { requestId, record } = parsed as { requestId?: unknown; record?: { requestId?: unknown } | null };
  for (const candidate of [requestId, record?.requestId]) {
    if (typeof candidate === 'string' && UUID_PATTERN.test(candidate)) return candidate;
  }
  return undefined;
};

/**
 * Extract the request id from a Lambda log line, in either the text or the JSON log format.
 *
 * Tries, in order:
 * - the `requestId` or `record.requestId` field of a JSON log line (Lambda JSON log format)
 * - a `START` / `END` / `REPORT` platform line (`START RequestId: <id> ...`)
 * - the second tab-separated field of a text log line (`timestamp\trequestId\tLEVEL\tmessage`)
 *
 * The message body is never searched, so an unrelated UUID in it is not picked up.
 *
 * @param {string} message a message of a log event.
 * @return {string | undefined} the request id, or undefined if none is found.
 */
const extractRequestId = (message: string): string | undefined => {
  const json = requestIdFromJson(message);
  if (json !== undefined) return json;

  const platform = message.match(/^(?:START|END|REPORT) RequestId: ([0-9a-f-]{36})/i)?.[1];
  if (platform !== undefined && UUID_PATTERN.test(platform)) return platform;

  const field = message.split('\t')[1];
  if (field !== undefined && UUID_PATTERN.test(field)) return field;

  return undefined;
};

/**
 * Create a link for CloudWatch Logs from CloudWatchLogsDecodedData.
 *
 * The request id is read from the Lambda log line prefix of the first log event
 * (or from its `requestId` field in the JSON log format), not from the message body.
 * If no request id is found, the link is not filtered.
 *
 * @param {CloudWatchLogsDecodedData} data CloudWatch Logs decoded data.
 * @return {*} a link for a Log Event page filtered by request id.
 */
export const fromCloudWatchLogsData = (data: CloudWatchLogsDecodedData): string => {
  const region = process.env.AWS_REGION;
  const { logGroup, logStream, logEvents } = data;
  const requestId = extractRequestId(logEvents[0].message);
  if (requestId === undefined) return create(region, logGroup, logStream);
  return create(region, logGroup, logStream, { terms: [requestId] });
};

/**
 * Create a link for CloudWatch Logs from a event of AWS Lambda triggered by Subscription Filters.
 *
 * @param {CloudWatchLogsEvent} event a event of AWS Lambda triggered by Subscription Filters.
 * @return {*} a link for a Log Event page filtered by request id.
 */
export const fromLambdaEventTriggeredBySubscriptionFilters = async (event: CloudWatchLogsEvent): Promise<string> => {
  const decoded = await decodeCloudWatchLogsData(event.awslogs.data);
  return fromCloudWatchLogsData(decoded);
};
