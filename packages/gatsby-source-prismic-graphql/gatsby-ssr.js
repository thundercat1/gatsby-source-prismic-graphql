"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _react = _interopRequireDefault(require("react"));

exports.onRenderBody = function (_ref, options) {
  var setHeadComponents = _ref.setHeadComponents;
  var components = [_react.default.createElement("script", {
    key: "prismic-config",
    dangerouslySetInnerHTML: {
      __html: "\n            window.prismic = {\n              endpoint: 'https://".concat(options.repositoryName, ".prismic.io/api/v2',\n            };\n            window.prismicGatsbyOptions = ").concat(JSON.stringify(options), ";\n          ")
    }
  })];

  if (options.omitPrismicScript !== true) {
    components.push(_react.default.createElement("script", {
      key: "prismic-script",
      type: "text/javascript",
      src: "//static.cdn.prismic.io/prismic.min.js"
    }));
  }

  setHeadComponents(components);
};