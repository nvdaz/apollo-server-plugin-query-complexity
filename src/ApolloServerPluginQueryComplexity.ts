import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { separateOperations } from 'graphql';
import { ComplexityEstimator, getComplexity } from 'graphql-query-complexity';

export interface Options {
  estimators: ComplexityEstimator[];
  maximumComplexity: number;
}

export default function plugin(options: Options): ApolloServerPlugin {
  return {
    requestDidStart({ schema }) {
      return {
        didResolveOperation({ request, document }) {
          const complexity = getComplexity({
            schema,
            query: request.operationName
              ? separateOperations(document)[request.operationName]
              : document,
            estimators: options.estimators,
            variables: request.variables,
          });

          if (complexity > options.maximumComplexity) {
            throw new Error(
              `Query is too complex. Requested complexity ${complexity} is greater than ${options.maximumComplexity}.`
            );
          }
        },
      };
    },
  };
}
