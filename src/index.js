import { GraphQLServer, PubSub } from "graphql-yoga";
const { PrismaClient } = require("@prisma/client");

import { resolvers } from "./resolvers/index";

const prisma = new PrismaClient();
const pubsub = new PubSub();

const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      request,
    };
  },
});

const options = {
  port: 8000,
  endpoint: "/graphql",
  subscriptions: "/subscriptions",
  playground: "/playground",
};

server.start(() => {
  console.log("The server is up!");
});
