import React from 'react';

exports.onRenderBody = ({
  setHeadComponents
}, options) => {
  const accessToken = options.previews ? null : options.accessToken;
  const components = [<script key="prismic-config" dangerouslySetInnerHTML={{
    __html: `
            window.prismic = {
              endpoint: 'https://${options.repositoryName}.prismic.io/api/v2',
            };
            window.prismicGatsbyOptions = ${JSON.stringify({ ...options,
      accessToken
    })};
          `
  }} />];

  if (options.omitPrismicScript !== true) {
    components.push(<script key="prismic-script" type="text/javascript" src="//static.cdn.prismic.io/prismic.min.js" />);
  }

  setHeadComponents(components);
};