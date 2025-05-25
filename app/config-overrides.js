module.exports = function override(config, env) {
  config.resolve.fallback = {
    fs: false,
    path: require.resolve('path-browserify'),
    crypto: false,
    stream: false,
    buffer: require.resolve('buffer/'),
    os: false,
  };

  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf) {
      rule.oneOf = rule.oneOf.map(loader => {
        if (loader.type === 'asset/resource' && 
            loader.exclude && 
            Array.isArray(loader.exclude)) {
          loader.exclude.push(/\.wasm$/);
        }
        return loader;
      });
    }
    return rule;
  });

  config.module.rules.push({
    test: /\.wasm$/,
    type: 'javascript/auto',
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'static/wasm/[name].[hash].[ext]',
          mimetype: 'application/wasm'
        }
      }
    ]
  });

  config.experiments = {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    ...config.experiments
  };

  if (!config.resolve.extensions.includes('.wasm')) {
    config.resolve.extensions.push('.wasm');
  }

  return config;
};