import { StaticQuery } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';
import { WrapPage } from './components/WrapPage'; // Fixes proptypes warning for StaticQuery

if (StaticQuery && typeof StaticQuery === 'object' && StaticQuery.propTypes) {
  StaticQuery.propTypes.query = PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
    id: PropTypes.string,
    source: PropTypes.string
  })]);
}

export const wrapPageElement = ({
  element,
  props
}, options) => {
  if (props.pageContext.rootQuery || props.pageContext.prismicPreviewPage) {
    return <WrapPage key={props.location.key} options={options} {...props}>
        {element}
      </WrapPage>;
  }

  return element;
};