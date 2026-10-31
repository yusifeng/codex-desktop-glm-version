import assert from "node:assert/strict";
import fs from "node:fs";
import { AppEventPublisher } from "../src/main/main-app/worker/app-event-publisher.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const publisher = new AppEventPublisher();
const first = [];
const second = [];
const firstSubscription = publisher.subscribe((event) => first.push(event));
const secondSubscription = publisher.subscribe((event) => second.push(event));

publisher.emit("foreground", 123);
equal(first, [{ type: "foreground", at: 123 }]);
equal(second, [{ type: "foreground", at: 123 }]);

firstSubscription.dispose();
firstSubscription.dispose();
publisher.emit("background", 456);
equal(first, [{ type: "foreground", at: 123 }]);
equal(second, [
  { type: "foreground", at: 123 },
  { type: "background", at: 456 },
]);

secondSubscription.dispose();
publisher.emit("ignored", 789);
equal(second.length, 2);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("AppEventPublisher"), true);
equal(main.includes("new AppEventPublisher()"), true);
equal(main.includes("var fe = class"), false);

console.log(`${assertions} main worker app-event publisher assertions passed`);
