import React from 'react';
import { WrapPage } from './WrapPage';
export const withPreview = (render, query, fragments = []) => {
  if (typeof window === 'undefined') {
    return render;
  }

  if (!render) {
    return null;
  }

  const RenderComponent = ({
    data
  }) => render(data);

  const rootQuery = `${query.source}${fragments.map(fragment => fragment && fragment.source ? fragment.source : '').join(' ')}`;
  return data => <WrapPage data={data} pageContext={{
    rootQuery
  }} options={window.prismicGatsbyOptions || {}}>
      <RenderComponent />
    </WrapPage>;
};