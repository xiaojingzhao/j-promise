# j-promise

[![Coverage Status](https://coveralls.io/repos/github/xiaojingzhao/j-promise/badge.svg)](https://coveralls.io/github/xiaojingzhao/j-promise)

通过 promise A+ 测试的 promise~

## node version > v11

因为这里的实现用了 queueMicroTask，所以在 node 中使用的时候，请确保你的 node 版本支持这个 api

## test

Run test

```
yarn test
```

Generate a reporter

```
yarn test > report.log 2>&1
```
