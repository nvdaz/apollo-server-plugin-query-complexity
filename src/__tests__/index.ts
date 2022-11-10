import index, { QueryComplexityError as error } from '..';
import ApolloServerPluginQueryComplexity, {
  QueryComplexityError,
} from '../ApolloServerPluginQueryComplexity';

describe('index', () => {
  it('exports ApolloServerPluginQueryComplexity', () =>
    expect(index).toStrictEqual(ApolloServerPluginQueryComplexity));

  it('exports QueryComplexityError', () =>
    expect(error).toStrictEqual(QueryComplexityError));
});
