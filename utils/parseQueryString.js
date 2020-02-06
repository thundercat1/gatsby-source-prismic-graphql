export function parseQueryString(qs = '', delimiter = '&') {
  return new Map(qs.split(delimiter).map(item => {
    const [key, ...value] = item.split('=').map(part => decodeURIComponent(part.trim()));
    return [key, value.join('=')];
  }));
}