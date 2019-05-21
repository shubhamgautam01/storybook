import path from 'path';
import { ProgressPlugin, DllPlugin, NormalModuleReplacementPlugin } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import coreJsAutoUpgradePlugin from './coreJsAutoUpgradePlugin';

const resolveLocal = dir => path.join(__dirname, dir);

const r = resolveLocal('../../../node_modules');
const out = resolveLocal('../../core/dll');

export default ({ entry, provided = [] }) => ({
  name: 'storybook-ui',
  mode: 'production',

  entry,
  output: {
    path: out,
    filename: '[name]_dll.js',
    library: '[name]_dll',
  },
  externals: provided,

  module: {
    rules: [
      {
        test: /\.(mjs|jsx?|tsx?)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: `.cache/storybook-dll`,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    shippedProposals: true,
                    useBuiltIns: 'usage',
                    corejs: 3,
                    modules: false,
                    targets: {
                      browsers: ['Chrome >= 52', 'Explorer 11'],
                    },
                  },
                ],
                '@babel/preset-typescript',
                '@babel/preset-react',
                '@babel/preset-flow',
              ],
              plugins: [
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-syntax-dynamic-import',
                ['babel-plugin-emotion', { sourceMap: true, autoLabel: true }],
                'babel-plugin-macros',
                '@babel/plugin-transform-react-constant-elements',
                'babel-plugin-add-react-displayname',
              ],
            },
          },
        ],
        exclude: [/node_modules\/(?!(@storybook|react-helmet-async))/, /dist/],
      },
    ],
  },

  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    mainFields: ['source', 'module', 'main'],
    modules: ['node_modules', path.join(__dirname, '../../../node_modules')],
  },

  plugins: [
    new ProgressPlugin(),
    new DllPlugin({
      context: r,
      path: `${out}/[name]-manifest.json`,
      name: '[name]_dll',
    }),
    coreJsAutoUpgradePlugin(require),
    // new NormalModuleReplacementPlugin(/react-helmet-async/, resource => {
    //   const originalRequest = resource.request;
    //   console.log(resource);
    // }),
  ],
  optimization: {
    concatenateModules: true,
    portableRecords: true,
    namedModules: true,
    moduleIds: 'named',
    chunkIds: 'named',
    minimizer: [
      new TerserPlugin({
        cache: true,
        sourceMap: true,
        terserOptions: {
          mangle: false,
          keep_fnames: true,
        },
        extractComments: {
          condition: /^\**!|@preserve|@license|@cc_on/i,
          filename: file => file.replace('.js', '.LICENCE'),
          banner: licenseFile => `License information can be found in ${licenseFile}`,
        },
      }),
    ],
  },
  performance: {
    hints: false,
  },
});
