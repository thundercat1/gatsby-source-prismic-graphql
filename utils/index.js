import { setContext } from 'apollo-link-context';
import { HttpLink } from 'apollo-link-http';
import Prismic from 'prismic-javascript';
import { parseQueryString } from './parseQueryString';
// @todo should this be configurable?
export const fieldName = 'prismic';
export const typeName = 'PRISMIC'; // keep link resolver function

export let linkResolver = () => '/';
export function registerLinkResolver(link) {
  linkResolver = link;
}
export function getCookies() {
  return parseQueryString(document.cookie, ';');
}
export function getDocumentIndexFromCursor(cursor) {
  return atob(cursor).split(':')[1];
}
export function getCursorFromDocumentIndex(index) {
  return btoa(`arrayconnection:${index}`);
}
export function fetchStripQueryWhitespace(url, ...args) {
  const [hostname, qs = ''] = url.split('?');
  const queryString = parseQueryString(qs);

  if (queryString.has('query')) {
    queryString.set('query', String(queryString.get('query')).replace(/\#.*\n/g, '').replace(/\s+/g, ' '));
  }

  const updatedQs = Array.from(queryString).map(n => n.map(j => encodeURIComponent(j)).join('=')).join('&');
  const updatedUrl = `${hostname}?${updatedQs}`;
  return fetch(updatedUrl, ...args);
}
/**
 * Apollo Link for Prismic
 * @param options Options
 */

export function PrismicLink({
  uri,
  accessToken,
  customRef,
  ...rest
}) {
  const BaseURIReg = /^(https?:\/\/.+?\..+?\..+?)\/graphql\/?$/;
  const matches = uri.match(BaseURIReg);

  if (matches && matches[1]) {
    const prismicClient = Prismic.client(`${matches[1]}/api`, {
      accessToken
    });
    const prismicLink = setContext(async (request, options) => {
      let prismicRef;

      if (typeof window !== 'undefined' && document.cookie) {
        const cookies = getCookies();

        if (cookies.has(Prismic.experimentCookie)) {
          prismicRef = cookies.get(Prismic.experimentCookie);
        } else if (cookies.has(Prismic.previewCookie)) {
          prismicRef = cookies.get(Prismic.previewCookie);
        }
      }

      if (!prismicRef) {
        const api = await prismicClient.getApi();
        prismicRef = api.masterRef.ref;
      }

      const authorizationHeader = accessToken ? {
        Authorization: `Token ${accessToken}`
      } : {}; // if custom ref has been defined, then use that to pull content instead of default master ref

      prismicRef = typeof customRef === 'undefined' || customRef === null ? prismicRef : customRef;
      return {
        headers: { ...options.headers,
          ...authorizationHeader,
          'Prismic-ref': prismicRef
        }
      };
    });
    const httpLink = new HttpLink({
      uri,
      useGETForQueries: true,
      ...rest,
      fetch: fetchStripQueryWhitespace
    });
    return prismicLink.concat(httpLink);
  } else {
    throw new Error(`${uri} isn't a valid Prismic GraphQL endpoint`);
  }
}