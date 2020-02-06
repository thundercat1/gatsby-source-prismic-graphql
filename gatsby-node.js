import path from 'path';
import { getRootQuery } from 'gatsby-source-graphql-universal/getRootQuery';
import { onCreateWebpackConfig, sourceNodes } from 'gatsby-source-graphql-universal/gatsby-node';
import { fieldName, PrismicLink, typeName } from './utils';
import { createRemoteFileNode } from 'gatsby-source-filesystem';
import pathToRegexp from 'path-to-regexp';
exports.onCreateWebpackConfig = onCreateWebpackConfig;

exports.onCreatePage = ({
  page,
  actions
}) => {
  const rootQuery = getRootQuery(page.componentPath);
  page.context = page.context || {};

  if (rootQuery) {
    page.context.rootQuery = rootQuery;
    actions.createPage(page);
  }
};

exports.sourceNodes = (ref, options) => {
  const opts = {
    fieldName,
    typeName,
    createLink: () => PrismicLink({
      uri: `https://${options.repositoryName}.prismic.io/graphql`,
      credentials: 'same-origin',
      accessToken: options.accessToken,
      customRef: options.prismicRef
    }),
    ...options
  };
  return sourceNodes(ref, opts);
};

function createGeneralPreviewPage(createPage, options) {
  const previewPath = options.previewPath || '/preview';
  createPage({
    path: previewPath.replace(/^\//, ''),
    component: path.resolve(path.join(__dirname, 'components', 'PreviewPage.js')),
    context: {
      prismicPreviewPage: true
    }
  });
}

function createDocumentPreviewPage(createPage, page, lang) {
  const rootQuery = getRootQuery(page.component);
  createPage({
    path: page.path,
    matchPath: process.env.NODE_ENV === 'production' ? undefined : page.match,
    component: page.component,
    context: {
      rootQuery,
      id: '',
      uid: '',
      lang,
      paginationPreviousUid: '',
      paginationPreviousLang: '',
      paginationNextUid: '',
      paginationNextLang: ''
    }
  });
}
/**
 * Create URL paths interpolating `:uid` and `:lang` or `:lang?` with actual values.
 * @param pageOptions - Returned paths are based on the `match` or `path` (if `match`
 * is not present) properties of the `pageOptions` object.
 * @param node - Document node metadata provide the `lang` and `uid` values for the returned path.
 * @param options - The plugin's global options.
 * @param options.defaultLang - `defaultLang` as declared in `PluginOptions`. If `lang` segment is
 * marked optional (`:lang?`) in the page `match` or `path` values and `defaultLang` matches the
 * document's actual language, the language segment of the path will be omitted in the returned path.
 * @param options.shortenUrlLangs - When truthy, the lang used for the path will be limited to 2 characters.
 * @return The path for the document's URL with `lang` and `uid` interpolated as necessary.
 */


function createDocumentPath(pageOptions, node, {
  defaultLang,
  shortenUrlLangs
}) {
  const pathKeys = [];
  const pathTemplate = pageOptions.match || pageOptions.path;
  pathToRegexp(pathTemplate, pathKeys);
  const langKey = pathKeys.find(key => key.name === 'lang');
  const isLangOptional = !!(langKey && langKey.optional);
  const toPath = pathToRegexp.compile(pathTemplate);
  const documentLang = node._meta.lang;
  const isDocumentLangDefault = documentLang === defaultLang;
  const shouldExcludeLangInPath = isLangOptional && isDocumentLangDefault;
  const displayedLang = shortenUrlLangs ? documentLang.slice(0, 2) : documentLang;
  const lang = shouldExcludeLangInPath ? null : displayedLang;
  const params = { ...node._meta,
    lang
  };
  const path = toPath(params);
  return path === '' ? '/' : path;
}

function createDocumentPages(createPage, edges, options, page) {
  // Cycle through each document returned from query...
  edges.forEach(({
    cursor,
    node
  }, index) => {
    const previousNode = edges[index - 1] && edges[index - 1].node;
    const nextNode = edges[index + 1] && edges[index + 1].node; // ...and create the page

    createPage({
      path: createDocumentPath(page, node, options),
      component: page.component,
      context: {
        rootQuery: getRootQuery(page.component),
        ...node._meta,
        cursor,
        paginationPreviousMeta: previousNode ? previousNode._meta : null,
        paginationPreviousUid: previousNode ? previousNode._meta.uid : '',
        paginationPreviousLang: previousNode ? previousNode._meta.lang : '',
        paginationNextMeta: nextNode ? nextNode._meta : null,
        paginationNextUid: nextNode ? nextNode._meta.uid : '',
        paginationNextLang: nextNode ? nextNode._meta.lang : '',
        // pagination helpers for overcoming backwards pagination issues cause by Prismic's 20-document query limit
        lastQueryChunkEndCursor: edges[index - 1] ? edges[index - 1].endCursor : ''
      }
    });
  });
}

const getDocumentsQuery = ({
  documentType,
  sortType
}) => `
  query AllPagesQuery ($after: String, $lang: String, $sortBy: ${sortType}) {
    prismic {
      ${documentType} (
        first: 20
        after: $after
        sortBy: $sortBy
        lang: $lang
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          cursor
          node {
            _meta {
              id
              lang
              uid
              type
              alternateLanguages {
                id
                lang
                type
                uid
              }
            }
          }
        }
      }
    }
  }
`;

exports.createPages = async ({
  graphql,
  actions: {
    createPage
  }
}, options) => {
  createGeneralPreviewPage(createPage, options);
  /**
   * Helper that recursively queries GraphQL to collect all documents for the given
   * page type. Once all documents are collected, it creates pages for them all.
   * Prismic GraphQL queries only return up to 20 results per query)
   */

  async function createPagesForType(page, lang, endCursor = '', documents = []) {
    // Prepare and execute query
    const documentType = `all${page.type}s`;
    const sortType = `PRISMIC_Sort${page.type}y`;
    const query = getDocumentsQuery({
      documentType,
      sortType
    });
    const {
      data,
      errors
    } = await graphql(query, {
      after: endCursor,
      lang: lang || null,
      sortBy: page.sortBy
    });

    if (errors && errors.length) {
      throw errors[0];
    }

    const response = data.prismic[documentType];
    const edges = page.filter ? response.edges.filter(page.filter) : response.edges; // Add last end cursor to all edges to enable pagination context when creating pages

    edges.forEach(edge => edge.endCursor = endCursor); // Stage documents for page creation

    documents = [...documents, ...edges];

    if (response.pageInfo.hasNextPage) {
      const newEndCursor = response.pageInfo.endCursor;
      await createPagesForType(page, lang, newEndCursor, documents);
    } else {
      createDocumentPreviewPage(createPage, page, lang);
      createDocumentPages(createPage, documents, options, page);
    }
  } // Prepare to create all the pages


  const pages = options.pages || [];
  const pageCreators = []; // Create pageCreator promises for each page/language combination

  pages.forEach(page => {
    const langs = page.langs || options.langs || options.defaultLang && [options.defaultLang];

    if (langs) {
      langs.forEach(lang => pageCreators.push(createPagesForType(page, lang)));
    } else {
      pageCreators.push(createPagesForType(page));
    }
  }); // Run all pageCreators simultaneously

  await Promise.all(pageCreators);
};

exports.createResolvers = ({
  actions,
  cache,
  createNodeId,
  createResolvers,
  store,
  reporter
}, {
  sharpKeys = [/image|photo|picture/]
}) => {
  const {
    createNode
  } = actions;
  const state = store.getState();
  const [prismicSchema = {}] = state.schemaCustomization.thirdPartySchemas;
  const typeMap = prismicSchema._typeMap;
  const resolvers = {};

  for (const typeName in typeMap) {
    const typeEntry = typeMap[typeName];
    const typeFields = typeEntry && typeEntry.getFields && typeEntry.getFields() || {};
    const typeResolver = {};

    for (const fieldName in typeFields) {
      const field = typeFields[fieldName];

      if (field.type === typeMap.PRISMIC_Json && sharpKeys.some(re => re instanceof RegExp ? re.test(fieldName) : re === fieldName)) {
        typeResolver[`${fieldName}Sharp`] = {
          type: 'File',
          args: {
            crop: {
              type: typeMap.String
            }
          },

          resolve(source, args) {
            const obj = source && source[fieldName] || {};
            const url = args.crop ? obj[args.crop] && obj[args.crop].url : obj.url;

            if (url) {
              return createRemoteFileNode({
                url,
                store,
                cache,
                createNode,
                createNodeId,
                reporter
              });
            }

            return null;
          }

        };
      }
    }

    if (Object.keys(typeResolver).length) {
      resolvers[typeName] = typeResolver;
    }
  }

  if (Object.keys(resolvers).length) {
    createResolvers(resolvers);
  }
};