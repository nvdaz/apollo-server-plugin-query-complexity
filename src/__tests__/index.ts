import index from '..';
import ApolloServerPluginQueryComplexity from '../ApolloServerPluginQueryComplexity';

describe('index', () => {
  it('exports ApolloServerPluginQueryComplexity', () =>
    expect(index).toStrictEqual(ApolloServerPluginQueryComplexity));
});
