# Q

Query various data.

## Input format

- JSON
- YAML
- CSV
- LTSV

## Output format

- JSON
- YAML
- CSV
- LTSV

## Usage

```bash
$ cat hoge.csv
author,title
hoge,hogehoge
fuga,fugafuga
$ cat hoge.csv | q
[
  {
    "author": "hoge",
    "title": "hogehoge"
  },
  {
    "author": "fuga",
    "title": "fugafuga"
  }
]
$ cat hoge.csv | q -f yaml
- author: hoge
  title: hogehoge
- author: fuga
  title: fugafuga

$ cat hoge.csv | q -f csv -H
author,title
hoge,hogehoge
fuga,fugafuga

$ cat hoge.csv | q -f ltsv
author:hoge     title:hogehoge
author:fuga     title:fugafuga
$ cat hoge.csv | q '.[].author'
"hoge"
"fuga"
$ q '.[].author' hoge.csv
"hoge"
"fuga"
$ q -r '.[].author' hoge.csv
hoge
fuga
$ q 'SELECT author' hoge.csv
[
  {
    "author": "hoge"
  },
  {
    "author": "fuga"
  }
]
$ q -r 'SELECT author WHERE title = "hogehoge" | .[].author' hoge.csv
hoge
$ q -r .author package.json
sharo_jef
$ q 'SELECT author, type' package.json -f csv -H
author,type
sharo_jef,module

```

## Installation

```bash
npm i -g @sharo-jef/q
```
