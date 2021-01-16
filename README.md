# apollo-server-plugin-query-complexity

> Apollo Server plugin that limits query complexity.

Apollo Server does not provide request variables to validation rules such as graphql-query-complexity. This plugin serves the same purpose but is compatible with operation variables.

## Installation

```sh
yarn add apollo-server-plugin-query-complexity graphql-query-complexity graphql
```

## Usage

```ts
import ApolloServer from 'apollo-server';
import ApolloServerPluginQueryComplexity from 'apollo-server-plugin-query-complexity';
import { directiveEstimator, simpleEstimator } from 'graphql-query-complexity';

const server = new ApolloServer({
  typeDefs: gql`
    directive @complexity(
      value: Int!
      multipliers: [String!]
    ) on FIELD_DEFINITION

    type Query {
      a: String! # Complexity of 1
      b(n: Int!): String! @complexity(value: 1, multipliers: ["n"]) # Complexity of variable "n"
    }
  `,
  resolvers: {},
  plugins: [
    ApolloServerPluginQueryComplexity({
      estimators: [directiveEstimator(), simpleEstimator()],
      maximumComplexity: 1,
    }),
  ],
});
```

## Credit

[TypeGraphQL Example](https://github.com/MichalLytek/type-graphql/blob/d50861399d8ea6b32328d667e38ff1562e270366/examples/query-complexity/index.ts)
