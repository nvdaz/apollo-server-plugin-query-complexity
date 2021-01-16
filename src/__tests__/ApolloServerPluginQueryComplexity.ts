import { ApolloServer, gql } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { directiveEstimator, simpleEstimator } from 'graphql-query-complexity';
import ApolloServerPluginQueryComplexity from '../ApolloServerPluginQueryComplexity';

const server = new ApolloServer({
  typeDefs: gql`
    directive @complexity(
      value: Int!
      multipliers: [String!]
    ) on FIELD_DEFINITION

    type Query {
      a: String!
      b: String!
      c(n: Int!): String! @complexity(value: 1, multipliers: ["n"])
    }
  `,
  resolvers: {
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
  },
  plugins: [
    ApolloServerPluginQueryComplexity({
      estimators: [directiveEstimator(), simpleEstimator()],
      maximumComplexity: 1,
    }),
  ],
});

const { query } = createTestClient(server);

describe('ApolloServerPluginQueryComplexity', () => {
  it('returns an apollo server plugin', () => {
    // @ts-ignore
    const instance = ApolloServerPluginQueryComplexity({});

    expect(instance).toHaveProperty('requestDidStart');

    // @ts-ignore
    expect(instance.requestDidStart({})).toHaveProperty('didResolveOperation');
  });

  it('allows normal non-complex queries', async () => {
    const result = await query({
      query: gql`
        query Q {
          a
        }
      `,
    });

    expect(result.data).toMatchObject({ a: 'a' });
    expect(result.errors).toBeUndefined();
  });

  it('disallows normal complex queries', async () => {
    const result = await query({
      query: gql`
        query Q {
          a
          b
        }
      `,
    });

    expect(result.data).toBeUndefined();
    expect(result.errors).not.toBeUndefined();
  });

  it('allows complex queries with variables', async () => {
    const result = await query({
      query: gql`
        query Q($n: Int!) {
          c(n: $n)
        }
      `,
      variables: {
        n: 1,
      },
    });

    expect(result.data).toMatchObject({ c: 'c' });
    expect(result.errors).toBeUndefined();
  });

  it('disallows complex queries with variables', async () => {
    const result = await query({
      query: gql`
        query Q($n: Int!) {
          c(n: $n)
        }
      `,
      variables: {
        n: 100,
      },
    });

    expect(result.data).toBeUndefined();
    expect(result.errors).not.toBeUndefined();
  });

  it('allows non-complex queries with multiple operations', async () => {
    const result = await query({
      query: gql`
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

    expect(result.data).toMatchObject({ a: 'a' });
    expect(result.errors).toBeUndefined();
  });

  it('disallows non-complex queries with multiple operations', async () => {
    const result = await query({
      query: gql`
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

    expect(result.data).toBeUndefined();
    expect(result.errors).not.toBeUndefined();
  });
});
