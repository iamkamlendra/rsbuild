import { rspack } from '@rspack/core';
import { LOCAL_ORIGINS_REGEX } from '../src/config';
import {
  isClientCompiler,
  setupServerHooks,
} from '../src/server/compilationMiddleware';
import { formatRoutes, printServerURLs } from '../src/server/helper';

test('formatRoutes', () => {
  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
        foo: 'src/index.ts',
        bar: 'src/index.ts',
      },
      '/',
      undefined,
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/',
    },
    {
      entryName: 'foo',
      pathname: '/foo',
    },
    {
      entryName: 'bar',
      pathname: '/bar',
    },
  ]);

  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
        foo: 'src/index.ts',
      },
      '/',
      '/hello',
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/hello/',
    },
    {
      entryName: 'foo',
      pathname: '/hello/foo',
    },
  ]);

  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
        foo: 'src/index.ts',
      },
      '/',
      '/hello/',
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/hello/',
    },
    {
      entryName: 'foo',
      pathname: '/hello/foo',
    },
  ]);

  expect(
    formatRoutes(
      {
        foo: 'src/index.ts',
        bar: 'src/index.ts',
        index: 'src/index.ts',
      },
      '/',
      undefined,
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/',
    },
    {
      entryName: 'foo',
      pathname: '/foo',
    },
    {
      entryName: 'bar',
      pathname: '/bar',
    },
  ]);

  expect(
    formatRoutes(
      {
        foo: 'src/index.ts',
      },
      '/',
      undefined,
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'foo',
      pathname: '/foo',
    },
  ]);

  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
        foo: 'src/index.ts',
        bar: 'src/index.ts',
      },
      '/',
      'html',
      undefined,
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/html/',
    },
    {
      entryName: 'foo',
      pathname: '/html/foo',
    },
    {
      entryName: 'bar',
      pathname: '/html/bar',
    },
  ]);

  expect(
    formatRoutes(
      {
        index: 'src/index.ts',
      },
      '/',
      'html',
      'nested',
    ),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/html/index',
    },
  ]);
});

test('printServerURLs', () => {
  let message: string | null;

  message = printServerURLs({
    port: 3000,
    protocol: 'http',
    urls: [
      {
        url: 'http://localhost:3000',
        label: 'local',
      },
      {
        url: 'http://192.168.0.1:3000/',
        label: 'network',
      },
    ],
    routes: [
      {
        entryName: 'index',
        pathname: '/',
      },
    ],
  });

  expect(message!).toMatchInlineSnapshot(`
    "  ➜ local     http://localhost:3000/
      ➜ network   http://192.168.0.1:3000/
    "
  `);

  message = printServerURLs({
    port: 3000,
    protocol: 'http',
    urls: [
      {
        url: 'http://localhost:3000',
        label: 'local',
      },
      {
        url: 'http://192.168.0.1:3000/',
        label: 'network',
      },
    ],
    routes: [
      {
        entryName: 'index',
        pathname: '/',
      },
      {
        entryName: 'foo',
        pathname: '/html/foo',
      },
      {
        entryName: 'bar',
        pathname: '/bar',
      },
    ],
  });

  expect(message!).toMatchInlineSnapshot(`
    "  ➜ local
      - index    http://localhost:3000/
      - foo      http://localhost:3000/html/foo
      - bar      http://localhost:3000/bar

      ➜ network
      - index    http://192.168.0.1:3000/
      - foo      http://192.168.0.1:3000/html/foo
      - bar      http://192.168.0.1:3000/bar
    "
  `);

  message = printServerURLs({
    port: 3000,
    protocol: 'http',
    urls: [],
    routes: [],
  });

  expect(message).toEqual(null);
});

describe('test dev server', () => {
  test('should setupServerHooks correctly', () => {
    const compiler = rspack({
      target: 'web',
    });
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      (tap) => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeTruthy();
  });
  test('should not setupServerHooks when compiler is server', () => {
    const compiler = rspack({
      target: 'node',
    });
    const onDoneFn = vi.fn();
    const onInvalidFn = vi.fn();

    setupServerHooks(compiler, {
      onDone: onDoneFn,
      onInvalid: onInvalidFn,
    });

    const isOnDoneRegistered = compiler.hooks.done.taps.some(
      (tap) => tap.fn === onDoneFn,
    );

    expect(isOnDoneRegistered).toBeFalsy();
  });

  test('check isClientCompiler', () => {
    expect(isClientCompiler(rspack({}))).toBeTruthy();

    expect(
      isClientCompiler(
        rspack({
          target: ['web', 'es5'],
        }),
      ),
    ).toBeTruthy();

    expect(
      isClientCompiler(
        rspack({
          target: 'node',
        }),
      ),
    ).toBeFalsy();

    expect(
      isClientCompiler(
        rspack({
          target: ['node'],
        }),
      ),
    ).toBeFalsy();
  });
});

test('local origins regex', () => {
  expect(LOCAL_ORIGINS_REGEX.test('http://localhost:3000')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('http://foo.localhost:3000')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('http://127.0.0.1:3000')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('http://[::1]:3000')).toBeTruthy();

  // HTTPS protocols
  expect(LOCAL_ORIGINS_REGEX.test('https://localhost:3000')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('https://127.0.0.1:8080')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('https://foo.localhost:3000')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('https://[::1]:3000')).toBeTruthy();

  // Without port
  expect(LOCAL_ORIGINS_REGEX.test('http://localhost')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('https://127.0.0.1')).toBeTruthy();
  expect(LOCAL_ORIGINS_REGEX.test('http://[::1]')).toBeTruthy();

  // Multi-level subdomains
  expect(
    LOCAL_ORIGINS_REGEX.test('http://test.dev.localhost:8000'),
  ).toBeTruthy();

  // High port
  expect(LOCAL_ORIGINS_REGEX.test('http://localhost:65535')).toBeTruthy();

  // Invalid cases
  expect(LOCAL_ORIGINS_REGEX.test('http://example.com')).toBeFalsy();
  expect(LOCAL_ORIGINS_REGEX.test('http://192.168.1.1:3000')).toBeFalsy();
  expect(LOCAL_ORIGINS_REGEX.test('ftp://localhost:21')).toBeFalsy();
  expect(LOCAL_ORIGINS_REGEX.test('localhost')).toBeFalsy(); //
});
