import assert from 'assert';
import { ApolloServer } from '@apollo/server';
import { directiveEstimator, simpleEstimator } from 'graphql-query-complexity';
import ApolloServerPluginQueryComplexity, {
  QueryComplexityError,
} from '../ApolloServerPluginQueryComplexity';
import { GraphQLFormattedError } from 'graphql';

const formatError = jest.fn(
  (formattedError: GraphQLFormattedError, error: unknown) => formattedError,
);

const typeDefs = `#graphql
  directive @complexity(
    value: Int!
    multipliers: [String!]
  ) on FIELD_DEFINITION

  type Query {
    a: String!
    b: String!
    c(n: Int!): String! @complexity(value: 1, multipliers: ["n"])
  }
`;

const resolvers = {
  Query: {
    a() {
      return 'a';
    },
    b() {
      return 'b';
    },
    c() {
      return 'c';
    },
  },
};

const testServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
  plugins: [
    ApolloServerPluginQueryComplexity({
      estimators: [directiveEstimator(), simpleEstimator()],
      maximumComplexity: 1,
    }),
  ],
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ApolloServerPluginQueryComplexity', () => {
  it('returns an apollo server plugin', async () => {
    const instance = ApolloServerPluginQueryComplexity({
      estimators: [],
      maximumComplexity: 1,
    });

    expect(instance).toHaveProperty('requestDidStart');

    // @ts-ignore
    expect(await instance.requestDidStart({})).toHaveProperty(
      'didResolveOperation',
    );
  });

  it('throws given invalid options', () => {
    // @ts-expect-error
    expect(() => ApolloServerPluginQueryComplexity()).toThrowError();

    // @ts-expect-error
    expect(() => ApolloServerPluginQueryComplexity({})).toThrowError();

    expect(() =>
      // @ts-expect-error
      ApolloServerPluginQueryComplexity({ estimators: [] }),
    ).toThrowError();

    expect(() =>
      ApolloServerPluginQueryComplexity({
        estimators: [],
        // @ts-expect-error
        maximumComplexity: '1',
      }),
    ).toThrowError();

    expect(() =>
      ApolloServerPluginQueryComplexity({
        estimators: [],
        maximumComplexity: 0,
      }),
    ).toThrowError();
  });

  it('allows normal non-complex queries', async () => {
    const response = await testServer.executeOperation<{ a: String }>({
      query: `#graphql
        query Q {
          a
        }
      `,
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single'); // coerce result type

    expect(response.body.singleResult.data).toMatchObject({ a: 'a' });
    expect(response.body.singleResult.errors).toBeUndefined();
  });

  it('disallows normal complex queries', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query Q {
          a
          b
        }
      `,
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toBeUndefined();
    expect(response.body.singleResult.errors).not.toBeUndefined();
  });

  it('allows complex queries with variables', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query Q($n: Int!) {
          c(n: $n)
        }
      `,
      variables: {
        n: 1,
      },
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toMatchObject({ c: 'c' });
    expect(response.body.singleResult.errors).toBeUndefined();
  });

  it('disallows complex queries with variables', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query Q($n: Int!) {
          c(n: $n)
        }
      `,
      variables: {
        n: 100,
      },
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toBeUndefined();
    expect(response.body.singleResult.errors).not.toBeUndefined();
  });

  it('allows non-complex queries with multiple operations', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query A {
          a
        }
        query B {
          a
          b
        }
      `,
      operationName: 'A',
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toMatchObject({ a: 'a' });
    expect(response.body.singleResult.errors).toBeUndefined();
  });

  it('disallows non-complex queries with multiple operations', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query A {
          a
        }
        query B {
          a
          b
        }
      `,
      operationName: 'B',
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toBeUndefined();
    expect(response.body.singleResult.errors).not.toBeUndefined();
  });

  it('throws a QueryComplexityError', async () => {
    const response = await testServer.executeOperation({
      query: `#graphql
        query Q {
          a
          b
        }
      `,
    });

    expect(response.body.kind).toBe('single');
    assert(response.body.kind === 'single');

    expect(response.body.singleResult.data).toBeUndefined();
    expect(response.body.singleResult.errors).toHaveLength(1);
    expect(formatError).toHaveBeenCalledTimes(1);
    expect(formatError).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: 'QUERY_TOO_COMPLEX',
        }),
      }),
      expect.any(QueryComplexityError),
    );
  });
});
