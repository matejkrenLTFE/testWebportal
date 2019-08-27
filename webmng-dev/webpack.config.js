/* jshint maxstatements: false */
/* jslint browser:true, node:true*/
/* eslint es6:0, no-undefined:0, control-has-associated-label:0  */

const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const build = (process.argv.indexOf("-p") !== -1)
    ? "prod"
    : "dev"; // prod|dev build

module.exports = {
    //entry: "./src/main.js",
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
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            })
        },
                {
            test: /\.(eot|woff|woff2|ttf|svg|png)$/,
            use: ["file-loader"]
        }]
    },
    plugins: [
        new ExtractTextPlugin("bundle.css")
    ]
};
