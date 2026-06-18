const path = require('path');
const fs = require('fs');
const { library } = require('webpack');

class CopyProfilePanelPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyProfilePanelPlugin', () => {
      const from = path.resolve(__dirname, 'src/main/script/profilePanel');
      const to = path.resolve(__dirname, 'build/profilePanel');

      if (!fs.existsSync(from)) return;

      fs.rmSync(to, { recursive: true, force: true });
      fs.mkdirSync(to, { recursive: true });

      for (const file of fs.readdirSync(from)) {
        fs.copyFileSync(path.join(from, file), path.join(to, file));
      }
    });
  }
}

class CopyCachePanelPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyCachePanelPlugin', () => {
      const from = path.resolve(__dirname, 'src/main/cachePanel');
      const to = path.resolve(__dirname, 'build/cachePanel');

      if (!fs.existsSync(from)) return;

      fs.rmSync(to, { recursive: true, force: true });
      fs.mkdirSync(to, { recursive: true });

      for (const file of fs.readdirSync(from)) {
        fs.copyFileSync(path.join(from, file), path.join(to, file));
      }
    });
  }
}

module.exports = [
  {
    entry: './src/main.ts',
    target: 'electron-main',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    plugins: [new CopyProfilePanelPlugin(), new CopyCachePanelPlugin()],
    resolve: {
      extensions: ['.ts', '.js'],
    },
    externals: {
      keytar: 'commonjs keytar',
      'classic-level': 'commonjs classic-level',
      '@electron-delta/updater': 'commonjs @electron-delta/updater',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.html$/i,
          use: 'html-loader',
        },
      ],
    },
  },
  {
    entry: './src/preload.ts',
    target: 'electron-preload',
    output: {
      filename: 'preload.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/loading/preload.ts',
    target: 'electron-preload',
    output: {
      filename: 'loading_preload.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/prompt/preload.ts',
    target: 'electron-preload',
    output: {
      filename: 'prompt_preload.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/main/script/profilePanelPreload.ts',
    target: 'electron-preload',
    output: {
      filename: 'profilePanelPreload.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/main/cachePanelPreload.ts',
    target: 'electron-preload',
    output: {
      filename: 'cachePanelPreload.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/prompt/render.ts',
    target: 'web',
    output: {
      filename: 'prompt_render.js',
      path: path.resolve(__dirname, 'build'),
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: './src/render.ts',
    target: 'web',
    output: {
      filename: 'render.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'module',
    },
    resolve: {
      extensions: ['.ts', '.js', '.css'],
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    experiments: {
      outputModule: true,
    },
  },
];
