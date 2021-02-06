#! /usr/bin/env node
import chalk from "chalk";
import { getMousePos, getScreenSize, moveMouse } from "robotjs";
import { from, interval, range, zip } from "rxjs";
import { concatMap, delay, map, take } from "rxjs/operators";
import yargs from "yargs";

const error = chalk.bgRed.yellow;
const info = chalk.bgBlue.white;

const BASE_DELAY = 200;

const {
  minNumber,
  maxNumber,
  iterationDelayMultiplier,
  inputDelayMultiplier,
} = yargs(process.argv.slice(2)).options({
  minNumber: {
    type: "number",
    description: "Minimum iteration number",
    alias: "n",
    demandOption: true,
  },
  maxNumber: {
    type: "number",
    description: "Maximum iteration number",
    alias: "m",
    demandOption: true,
  },
  iterationDelayMultiplier: {
    type: "number",
    description: "Iteration delay multiplier",
    alias: "r",
    default: 0.5,
  },
  inputDelayMultiplier: {
    type: "number",
    alias: "i",
    description: "Input delay multiplier",
    default: 10,
  },
}).argv;

function printDimensions(width: number, height: number) {
  console.log(`Screen dimensions: ${info(width)}x${info(height)}`);
}

const { width, height } = getScreenSize();
const keysMap: Record<number | string, { x: number; y: number }> = {};

printDimensions(width, height);

function makeFourNumberBasedNumberAndSubmit(currentNumber: number): string {
  return String(currentNumber).padStart(4, "0").concat("e");
}

interval(BASE_DELAY * inputDelayMultiplier)
  .pipe(take(11))
  .subscribe(
    (x) => {
      if (getMousePos().x === width / 2)
        throw new Error("Couldnt get mouse position");
      if (x <= 9) {
        console.log(`Please hold your mouse over character ${x}`);
        keysMap[x] = getMousePos();
      } else {
        console.log(`Please hold your mouse over the submit button`);
        keysMap.e = getMousePos();
      }
    },
    (e) => {
      console.error(error(e));
    },
    () => {
      range(minNumber, maxNumber)
        .pipe(
          take(maxNumber),
          delay(1000),
          map((iteration) => makeFourNumberBasedNumberAndSubmit(iteration)),
          concatMap((iterationKey) =>
            zip(
              interval(BASE_DELAY * iterationDelayMultiplier),
              from(iterationKey.split(""))
            ).pipe(map(([, key]) => ({ key, iterationKey })))
          )
        )
        .subscribe(({ key, iterationKey }) => {
          console.log(
            info(
              `Currently iteration over:${iterationKey} pressing key ${key} in the sequence`
            )
          );
          const { x, y } = keysMap[
            new RegExp(/\d/).test(key) === true ? parseInt(key, 10) : key
          ];
          moveMouse(x, y);
        });
    }
  );
