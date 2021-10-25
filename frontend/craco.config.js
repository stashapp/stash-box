const CracoEsbuildPlugin = require('craco-esbuild');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
module.exports = {
  plugins: [{ plugin: CracoEsbuildPlugin }],
  webpack: {
    plugins: [
      new FilterWarningsPlugin({
        /* Disable harmless warnings */
        exclude: /Critical dependency: the request of a dependency is an expression|Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      }),
    ],
  }
};
