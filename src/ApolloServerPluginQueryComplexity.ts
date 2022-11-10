import assert from 'assert';
import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { ComplexityEstimator, getComplexity } from 'graphql-query-complexity';

export interface Options {
  estimators: ComplexityEstimator[];
  maximumComplexity: number;
}
export class QueryComplexityError extends GraphQLError {
  constructor(complexity: number, maximumComplexity: number) {
    super(
      `Query is too complex. Requested complexity ${complexity} is greater than maximum allowed ${maximumComplexity}.`,
      {
        extensions: {
          code: 'QUERY_TOO_COMPLEX',
          complexity,
          maximumComplexity,
        },
      },
    );
  }
}

export default function plugin(options: Options): ApolloServerPlugin {
  assert(
    typeof options === 'object' && options !== null,
    'options is required',
  );
  assert(
    Array.isArray(options.estimators),
    'options.estimators must be an array.',
  );
  assert(
    typeof options.maximumComplexity === 'number' &&
      options.maximumComplexity > 0,
    'options.maximumComplexity must be a positive number.',
  );

  return {
    async requestDidStart({ schema }) {
      return {
        async didResolveOperation({ request, document }) {
          const complexity = getComplexity({
            schema,
            operationName: request.operationName,
            query: document,
            estimators: options.estimators,
            variables: request.variables,
          });

          if (complexity > options.maximumComplexity) {
            throw new QueryComplexityError(
              complexity,
              options.maximumComplexity,
            );
          }
        },
      };
    },
  };
}
