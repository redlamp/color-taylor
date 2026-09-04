/*
 * Types for the unit runner. bun test is the runner for *.test.ts under src/ -
 * see package.json "test:unit" - and tsconfig includes src, so the "bun:test"
 * module has to resolve for typecheck as well as at run time.
 */
/// <reference types="bun-types" />
