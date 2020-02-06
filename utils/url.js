import URLPattern from 'url-pattern';
export default {
  parse(pattern, urlPathname) {
    const urlP = new URLPattern(pattern);
    return urlP.match(urlPathname) || {};
  },

  build(pattern, params = {}) {
    return Object.keys(params).reduce((acc, key) => {
      return acc.replace(`:${key}`, params[key]);
    }, pattern);
  },

  extractFixURL(urlPattern) {
    var regex = /^(\/.*)*\/(:uid)/;
    const matched = urlPattern.match(regex);

    if (matched) {
      const [, fixURL] = matched;
      return fixURL;
    }
  }

};