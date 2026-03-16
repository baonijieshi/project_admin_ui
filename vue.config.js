const { defineConfig } = require('@vue/cli-service');
const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,

  pages: {
    index: {
      entry: 'src/main.js',
      title: '快牛项目管理平台',
    },
  },

  devServer: {
    port: 8080,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if (error?.message?.includes('ResizeObserver loop')) return false;
          return true;
        },
      },
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src'),
      },
    },
  },
});
