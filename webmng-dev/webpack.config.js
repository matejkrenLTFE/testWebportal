/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const build = (process.argv.indexOf("-p") !== -1)
    ? "prod"
    : "dev"; // prod|dev build

module.exports = {
    //entry: "./src/main.js",
    optimization: {
        minimizer: (build === "prod")
            ? [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
            : []
    },
    cache: false,
    entry: (build === "prod")
        ? "./src/main-prod.js"
        : "./src/main.js",
    output: {
        filename: "bundle.js",
        path: path.join(__dirname, "dist")
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, "css-loader"]
        },
                {
            test: /\.(eot|woff|woff2|ttf|svg|png)$/,
            use: ["file-loader"]
        }]
    },
    plugins: [
        // new ExtractTextPlugin("bundle.css"),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // all options are optional
            filename: "bundle.css"
        })
    ]
};
