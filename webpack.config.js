const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = () => ([{
            name: "Installer",
            context: __dirname,
            devtool: false,
            resolve: {
                extensions: [".js", ".json"]
            },
            module: {
                rules: []
            },
            target: "async-node",
            externals: [],
            optimization: {
                splitChunks: false,
                minimizer: [
                    new TerserPlugin({
                        parallel: true,
                        extractComments: false,
                        terserOptions: {
                            format: {
                                comments: false,
                            },
                        },
                    })
                ]
            },
            output: {
                hashFunction: "xxhash64",
                libraryTarget: "commonjs2",
                path: path.resolve(__dirname, "dist"),
                filename: "install.js",
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.browser": undefined,
                    "process.env.BUNDLE": true,
                    "typeof window": "'undefined'",
                }),
                new webpack.optimize.LimitChunkCountPlugin({
                    maxChunks: 1
                }),
                new ESLintPlugin({
                    failOnError: true,
                    failOnWarning: true,
                }),
            ],
            node: {
                __dirname: false,
            }
        }
    ]);
