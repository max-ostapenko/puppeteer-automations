# Highlight the updates in the Chrome flag experiments

## Description

Google Chrome has a lot of running experiments. It's hard to identify the changes when something new is released or being turned ON by default. This script highlights the updates in the experiments after the recent update.

## How it works

The script compares the current state of the experiments with the previous one. The state is stored in the `flags.json` file and the differences can be stored in a repository. You can also highlight the updates in the experiments.

Before the first run, [adjust the location](https://github.com/max-ostapenko/chrome_flags_diff/blob/3457aabde304e5ae88ad59326f3377001aac78c7/script.js#L9) to your instance of Google Chrome.

## Install

```js
npm install
```

## Run

```js
npm start && git diff
```
