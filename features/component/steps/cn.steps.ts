import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import { cn } from '../../lib/utils';

let result = '';

When('I merge classes {string} and {string}', function (a: string, b: string) {
  result = cn(a, b);
});

Then('the class string is {string}', function (expected: string) {
  assert.equal(result, expected);
});
