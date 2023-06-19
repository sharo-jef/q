import { readFile } from 'node:fs/promises';

import csv from 'async-csv';
import ltsv from 'ltsv';
import YAML from 'yaml';

export const readFromFile = filename => {
  try {
    return readFile(filename, 'utf-8');
  } catch {
    throw new Error(`Could not read from file: ${filename}`);
  }
};

export const readFromStdin = async () => {
  process.stdin.setEncoding('utf-8');
  let text = '';
  for await (const chunk of process.stdin) {
    text += chunk;
  }
  return text;
};

export const parseData = async (rawData, format = 'auto', cast = false) => {
  // eslint-disable-next-line no-param-reassign
  format = format.toLowerCase();
  let data = '';
  if (format === 'auto') {
    try {
      data = JSON.stringify(JSON.parse(rawData));
    } catch {
      try {
        const indexOfComma = rawData.indexOf(',');
        if (indexOfComma !== -1 && indexOfComma < rawData.indexOf('\n')) {
          data = JSON.stringify(await csv.parse(rawData, { columns: true, delimiter: ',', cast }));
        } else {
          throw new Error();
        }
      } catch {
        try {
          data = JSON.stringify(ltsv.parse(rawData));
        } catch {
          try {
            data = JSON.stringify(YAML.parse(rawData));
          } catch {
            throw new Error('Could not parse');
          }
        }
      }
    }
  } else if (format === 'json' || format === 'yaml' || format === 'yml') {
    data = JSON.stringify(YAML.parse(rawData));
  } else if (format === 'csv') {
    data = JSON.stringify(await csv.parse(rawData, { columns: true }));
  } else if (format === 'ltsv') {
    data = JSON.stringify(ltsv.parse(rawData));
  } else {
    throw new Error(`Invalid input format: ${format}`);
  }
  return data;
};

// eslint-disable-next-line no-shadow
export const format = (result, outputFormat = '', header = false, compact = false) => {
  // eslint-disable-next-line no-param-reassign
  outputFormat = outputFormat.toLowerCase();
  try {
    // eslint-disable-next-line no-param-reassign
    result = JSON.parse(result);
  } catch {
    return result;
  }
  if (outputFormat === 'json') {
    if (compact) {
      return JSON.stringify(result);
    }
    return JSON.stringify(result, void 0, 2);
  }
  if (outputFormat === 'yaml' || outputFormat === 'yml') {
    return YAML.stringify(result);
  }
  if (outputFormat === 'csv') {
    return csv.stringify(result, { header });
  }
  if (outputFormat === 'ltsv') {
    return ltsv.stringify(result);
  }
  throw new Error(`Invalid format: ${outputFormat}`);
};
