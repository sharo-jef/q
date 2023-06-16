import { readFile } from 'node:fs/promises';

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
  const rawData = file ? readFromFile(file) : readFromStdin();
  const data = await parseData(rawData, options?.inputFormat);
  let result = '';
  try {
    const jqOptions = {
      input: 'string',
      slurp: options?.slurp,
      sort: options?.sort,
    };
    result = await jq.run(query, data, jqOptions);
  } catch {
    // if failed or query cannot be parsed
    const parser = new NodeSQLParser.Parser();
    const ast = parser.astify(query);
    ast.from = [{ db: null, table: '__IN_MEMORY_TABLE__', as: null }];
    const sql = parser.sqlify(ast);
    result = JSON.stringify(alasql(sql.replace('`__IN_MEMORY_TABLE__`', '?'), [JSON.parse(data)]));
  }
  if (options.format.toLowerCase() === 'json' && options.raw) {
    console.log(await jq.run('.', result, { input: 'string', raw: true }));
  } else {
    console.log(await format(result, options.format));
  }
};

program
  .version(JSON.parse(await readFile('package.json')).version, '-v, --version')
  .option('-r, --raw', 'Output raw strings, not JSON texts')
  .option('-s, --slurp', 'Read (slurp) all inputs into an array')
  .option('-S, --sort', 'Sort keys of objects on output')
  .option('-i, --input-format <format>', 'Input format (JSON, YAML, CSV, LTSV)')
  .option('-f, --format <format>', 'Output format (JSON, YAML, CSV, LTSV', 'JSON')
  .argument('[query]', 'Query string (SQL or jq)')
  .argument('[file]', 'File name')
  .action(action)
  .parse(process.argv);
