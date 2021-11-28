const path = require("path");
const globule = require("globule");

const schemaPath = path.resolve(__dirname, "../graphql/schema");

/** @type {import("apollo").ApolloConfig} */
module.exports = {
    client: {
        service: {
            name: "stash-box",
            localSchemaFile: [
                ...globule.find({
                    src: "**/*.graphql",
                    cwd: schemaPath,
                    prefixBase: true,
                    ignore: "schema.graphql",
                }),
                path.join(schemaPath, "./schema.graphql"),
            ],
        },
        excludes: [
            "**/queries/**/_*",
            "**/mutations/**/_*",
            "**/__tests__/**/*",
            "**/node_modules",
        ],
    },
};
