import { ApolloClient } from 'apollo-boost';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { getIntrospectionQueryResultData } from './getIntrospectionQueryResultData';
import { PrismicLink } from './index';
let client = undefined;
export const getApolloClient = async ({
  repositoryName
}) => {
  if (!client) {
    const introspectionQueryResultData = await getIntrospectionQueryResultData({
      repositoryName
    });
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData
    });
    client = new ApolloClient({
      cache: new InMemoryCache({
        fragmentMatcher
      }),
      link: PrismicLink({
        uri: `https://${repositoryName}.prismic.io/graphql`,
        credentials: 'same-origin'
      })
    });
  }

  return client;
};