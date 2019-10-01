/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */
const path = require("path");

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

// const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
    cache: false,
    module: {
        rules: [{
            include: [path.resolve(__dirname, "src")],
            loader: "babel-loader",
            options: {
                plugins: ["syntax-dynamic-import"],
                presets: [
                    ["@babel/preset-env", {
                        modules: false
                    }]
                ]
            },
            test: /\.js$/
        }, {
            test: /\.css$/,
            use: [
                {
                    loader: "style-loader",
                    options: {
                        sourceMap: true
                    }
                }, {
                    loader: "css-loader"
                }
            ]
        }]
    },
    output: {
        chunkFilename: "[name].[chunkhash].js",
        filename: "[name].[chunkhash].js",
        path: path.resolve(__dirname, "webmng")
    },
    mode: "development",

    optimization: {
        splitChunks: {
            cacheGroups: {
                vendors: {
                    priority: -10,
                    test: /[\\\/]node_modules[\\\/]/
                }
            },

            chunks: "async",
            minChunks: 1,
            minSize: 30000,
            name: true
        }
    }
};
