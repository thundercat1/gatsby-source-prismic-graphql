export const getIntrospectionQueryResultData = ({
  repositoryName
}) => new Promise((resolve, reject) => {
  fetch(`https://${repositoryName}.prismic.io/api`).then(r => r.json()).then(data => {
    const ref = data.refs.find(r => r.id === 'master');
    if (!ref) return;
    fetch(`https://${repositoryName}.prismic.io/graphql?query=%7B%20__schema%20%7B%20types%20%7B%20kind%20name%20possibleTypes%20%7B%20name%20%7D%20%7D%20%7D%20%7D`, {
      headers: {
        'prismic-ref': ref.ref
      }
    }).then(result => result.json()).then(result => {
      try {
        const filteredData = result.data.__schema.types.filter(type => type.possibleTypes !== null);

        result.data.__schema.types = filteredData;
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    });
  });
});