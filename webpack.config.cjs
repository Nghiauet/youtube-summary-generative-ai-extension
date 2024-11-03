/** @type {import('webpack').Configuration} */

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
    mode: 'production',
    entry: {
        content: './content.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        fallback: {
            "path": false,
            "os": false,
            "crypto": false,
            "stream": false,
            "buffer": false
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY)
        })
    ]
};