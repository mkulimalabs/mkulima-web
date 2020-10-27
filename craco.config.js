const CracoLessPlugin = require('craco-less')

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#7546C9', '@font-family': 'Noto Sans' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
