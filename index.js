#!/usr/bin/env node
import alasql from 'alasql';
import { program } from 'commander';
import jq from 'node-jq';
import NodeSQLParser from 'node-sql-parser';

import {
  format,
  parseData,
  readFromFile,
  readFromStdin,
} from './util.js';

const action = async (query = '.', file = '', options = {}) => {
  const rawData = file ? await readFromFile(file) : await readFromStdin();
  const data = await parseData(rawData, options?.inputFormat);
  let result = '';
  const jqOptions = {
    input: 'string',
    slurp: options?.slurp,
    sort: options?.sort,
  };
  try {
    result = await jq.run(query, data, jqOptions);
  } catch {
    // if failed or query cannot be parsed
    const parser = new NodeSQLParser.Parser();
    const [rawSql, ...jqQuery] = query.split('|');
    const ast = parser.astify(rawSql);
    ast.from = [{ db: null, table: '__IN_MEMORY_TABLE__', as: null }];
    const sql = parser.sqlify(ast).replace('`__IN_MEMORY_TABLE__`', '?');
    const parsedData = JSON.parse(data);
    result = JSON.stringify(alasql(sql, [parsedData instanceof Array ? parsedData : [parsedData]]));
    result = await jq.run(jqQuery.join('|'), result, jqOptions);
  }
  if (options.format.toLowerCase() === 'json' && options.raw) {
    console.log(await jq.run('.', result, { input: 'string', raw: true }));
  } else {
    console.log(await format(result, options.format, options.header));
  }
};

program
  .version('0.0.2', '-v, --version')
  .option('-r, --raw', 'Output raw strings, not JSON texts')
  .option('-s, --slurp', 'Read (slurp) all inputs into an array')
  .option('-S, --sort', 'Sort keys of objects on output')
  .option('-i, --input-format <format>', 'Input format (JSON, YAML, CSV, LTSV)')
  .option('-f, --format <format>', 'Output format (JSON, YAML, CSV, LTSV)', 'JSON')
  .option('-H, --header', 'Enable header (CSV)')
  .argument('[query]', 'Query string (SQL or jq)', value => value, '.')
  .argument('[file]', 'File name')
  .action(action)
  .parse(process.argv);
