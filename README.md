# apollo-server-plugin-query-complexity

> Apollo Server plugin that limits query complexity.

Apollo Server does not provide request variables to validation rules such as graphql-query-complexity. This plugin serves the same purpose but is compatible with operation variables.

## Installation

```sh
yarn add apollo-server-plugin-query-complexity graphql-query-complexity graphql
```

## Usage

```ts
import { ApolloServer } from '@apollo/server';
import ApolloServerPluginQueryComplexity from 'apollo-server-plugin-query-complexity';
import { directiveEstimator, simpleEstimator } from 'graphql-query-complexity';

const typeDefs = `#graphql
  directive @complexity(
    value: Int!
    multipliers: [String!]
  ) on FIELD_DEFINITION

  type Query {
    a: String! # Complexity of 1
    b(n: Int!): String! @complexity(value: 1, multipliers: ["n"]) # Complexity of variable "n"
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {},
  plugins: [
    ApolloServerPluginQueryComplexity({
      estimators: [directiveEstimator(), simpleEstimator()],
      maximumComplexity: 100,
    }),
  ],
});
```

## Default Error Message

```json
{
  "message": "Query is too complex. Requested complexity 101 is greater than maximum allowed 100.",
  "extensions": {
    "code": "QUERY_TOO_COMPLEX",
    "complexity": 101,
    "maximumComplexity": 100
  }
}
```

## Examples

### Change the error message

```ts
import { ApolloServer } from '@apollo/server';
import ApolloServerPluginQueryComplexity, {
  QueryComplexityError,
} from 'apollo-server-plugin-query-complexity';
import { directiveEstimator, simpleEstimator } from 'graphql-query-complexity';
import { GraphQLFormattedError } from 'graphql';

const typeDefs = `#graphql
  directive @complexity(
    value: Int!
    multipliers: [String!]
  ) on FIELD_DEFINITION

  type Query {
    a: String! # Complexity of 1
    b(n: Int!): String! @complexity(value: 1, multipliers: ["n"]) # Complexity of variable "n"
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers: {},
  plugins: [
    ApolloServerPluginQueryComplexity({
      estimators: [directiveEstimator(), simpleEstimator()],
      maximumComplexity: 100,
    }),
  ],
  formatError: (formattedError: GraphQLFormattedError, error: unknown) => {
    if (error instanceof QueryComplexityError) {
      return {
        message: `Sorry, your request is too complex. Your request had a complexity of ${error.extensions.complexity}, but we limit it to ${error.extensions.maximumComplexity}.`,
        extensions: {
          code: 'QUERY_TOO_COMPLEX',
          complexity: error.extensions.complexity,
          maximumComplexity: error.extensions.maximumComplexity,
        },
      };
    }

    return formattedError;
  },
});
```

## Credit

[TypeGraphQL Example](https://github.com/MichalLytek/type-graphql/blob/d50861399d8ea6b32328d667e38ff1562e270366/examples/query-complexity/index.ts)
