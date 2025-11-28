# Code Quality Analysis Report

## Configuration
- **Cognitive Complexity**: ≤ 10
- **Cyclomatic Complexity**: ≤ 10
- **File Size**: ≤ 250 lines
- **Function Size**: ≤ 50 lines

## Summary
- **Files Analyzed**: 103
- **Total Issues**: 7115
- **Errors**: 248
- **Warnings**: 6867

## Issues by Rule
- **@typescript-eslint/no-unused-expressions**: 5077 violation(s)
- **complexity**: 582 violation(s)
- **sonarjs/cognitive-complexity**: 556 violation(s)
- **@typescript-eslint/no-unused-vars**: 431 violation(s)
- **sonarjs/no-duplicate-string**: 147 violation(s)
- **@typescript-eslint/no-require-imports**: 100 violation(s)
- **@typescript-eslint/no-explicit-any**: 68 violation(s)
- **@typescript-eslint/no-this-alias**: 38 violation(s)
- **sonarjs/no-inverted-boolean-check**: 31 violation(s)
- **max-lines-per-function**: 31 violation(s)

## Top Issues

🔴 **@typescript-eslint/no-require-imports** - .next/server/app/_not-found/page.js:1:79
   A `require()` style import is forbidden.

🔴 **@typescript-eslint/no-require-imports** - .next/server/app/_not-found/page.js:1:154
   A `require()` style import is forbidden.

🔴 **@typescript-eslint/no-require-imports** - .next/server/app/_not-found/page.js:1:251
   A `require()` style import is forbidden.

🔴 **@typescript-eslint/no-require-imports** - .next/server/app/_not-found/page.js:1:339
   A `require()` style import is forbidden.

🔴 **@typescript-eslint/no-require-imports** - .next/server/app/_not-found/page.js:1:378
   A `require()` style import is forbidden.

🟡 **@typescript-eslint/no-unused-expressions** - .next/server/app/_not-found/page.js:1:29
   Expected an assignment or function call and instead saw an expression.

🟡 **@typescript-eslint/no-unused-expressions** - .next/server/app/_not-found/page.js:1:915
   Expected an assignment or function call and instead saw an expression.

🟡 **@typescript-eslint/no-unused-expressions** - .next/server/app/_not-found/page.js:1:1362
   Expected an assignment or function call and instead saw an expression.

🟡 **complexity** - .next/server/app/_not-found/page.js:1:2418
   Async function 'L' has a complexity of 42. Maximum allowed is 10.

🟡 **sonarjs/cognitive-complexity** - .next/server/app/_not-found/page.js:1:2433
   Refactor this function to reduce its Cognitive Complexity from 12 to the 10 allowed.

## Files with Most Issues

- **.next/server/chunks/759.js**: 1758 issue(s)
- **.next/static/chunks/c4bc6b85-83ebe55d7d300fac.js**: 851 issue(s)
- **.next/static/chunks/990-43cb8bdcfe1fa02f.js**: 728 issue(s)
- **.next/static/chunks/framework-82fce76e1725f96c.js**: 707 issue(s)
- **.next/static/chunks/573-95d28afc69bf6113.js**: 608 issue(s)
- **.next/static/chunks/polyfills-42372ed130431b0a.js**: 438 issue(s)
- **.next/server/chunks/708.js**: 413 issue(s)
- **.next/static/chunks/main-ff44eb7b8b2aa9a7.js**: 365 issue(s)
- **.next/server/chunks/343.js**: 224 issue(s)
- **.next/server/pages/_error.js**: 211 issue(s)
