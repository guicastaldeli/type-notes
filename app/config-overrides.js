module.exports = function override(config, env) {
  config.resolve.fallback = {
    fs: false,
    path: false,
    crypto: false
  };
  
  console.log("React app rewired is working!");
  return config;
};