import { createSchema } from "graphql-yoga";
import { prisma } from "./db.js";

export const typeDefs = /* GraphQL */ `
  type Greeting {
    id: Int!
    message: String!
    createdAt: String!
  }

  type Query {
    """
    Simple health-check style query that does not touch the database.
    """
    hello: String!

    """
    All greetings stored in the SQLite database, newest first.
    """
    greetings: [Greeting!]!
  }

  type Mutation {
    """
    Store a new greeting in the database and return it.
    """
    addGreeting(message: String!): Greeting!
  }
`;

export const resolvers = {
  Query: {
    hello: () => "Hello, World!",
    greetings: async () =>
      prisma.greeting.findMany({ orderBy: { createdAt: "desc" } }),
  },
  Mutation: {
    addGreeting: async (_parent: unknown, args: { message: string }) => {
      const message = args.message.trim();
      if (!message) {
        throw new Error("Greeting message cannot be empty.");
      }
      return prisma.greeting.create({ data: { message } });
    },
  },
  Greeting: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },
};

export const schema = createSchema({ typeDefs, resolvers });
