import { createSchema } from "graphql-yoga";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

export const typeDefs = /* GraphQL */ `
  type Greeting {
    id: Int!
    message: String!
    createdAt: String!
  }

  "A country as classified by the World Bank."
  type Country {
    "ISO 3166-1 alpha-3 code, e.g. GBR"
    code: String!
    "ISO 3166-1 alpha-2 code, e.g. GB"
    iso2Code: String!
    name: String!
    region: String!
    regionCode: String!
    incomeLevel: String!
    incomeLevelCode: String!
    capitalCity: String
    latitude: Float
    longitude: Float
    "Observations for this country, optionally filtered by indicator and year range."
    observations(indicatorCode: String, fromYear: Int, toYear: Int): [Observation!]!
  }

  "A World Bank data series, e.g. GDP per capita."
  type Indicator {
    code: String!
    name: String!
    sourceNote: String
    sourceOrganization: String
    lastFetchedAt: String
    "Number of stored observations for this indicator."
    observationCount: Int!
    "Earliest and latest year with data."
    yearRange: YearRange
  }

  type YearRange {
    min: Int!
    max: Int!
  }

  "One indicator value for one country in one year."
  type Observation {
    id: Int!
    countryCode: String!
    indicatorCode: String!
    year: Int!
    value: Float!
    country: Country!
    indicator: Indicator!
  }

  "Row counts and freshness of the ingested dataset."
  type DataSummary {
    countries: Int!
    indicators: Int!
    observations: Int!
    regions: [String!]!
    incomeLevels: [String!]!
    lastIngestedAt: String
  }

  enum SortOrder {
    ASC
    DESC
  }

  type Query {
    "Simple health-check style query that does not touch the database."
    hello: String!

    "All greetings stored in the SQLite database, newest first."
    greetings: [Greeting!]!

    "Counts and freshness of the World Bank data."
    dataSummary: DataSummary!

    "Countries, optionally filtered by region and/or income level."
    countries(region: String, incomeLevel: String): [Country!]!

    "A single country by ISO3 code."
    country(code: String!): Country

    "All ingested indicators."
    indicators: [Indicator!]!

    "A single indicator by code."
    indicator(code: String!): Indicator

    """
    Observations for an indicator. Filter by country codes and/or year range.
    Results are ordered by year then country code.
    """
    observations(
      indicatorCode: String!
      countryCodes: [String!]
      fromYear: Int
      toYear: Int
    ): [Observation!]!

    """
    Top (or bottom) countries for an indicator in a given year.
    """
    ranking(indicatorCode: String!, year: Int!, limit: Int = 10, order: SortOrder = DESC): [Observation!]!
  }

  type Mutation {
    "Store a new greeting in the database and return it."
    addGreeting(message: String!): Greeting!
  }
`;

type YearArgs = { fromYear?: number | null; toYear?: number | null };

function yearFilter({ fromYear, toYear }: YearArgs): Prisma.IntFilter | undefined {
  if (fromYear == null && toYear == null) return undefined;
  return {
    ...(fromYear != null ? { gte: fromYear } : {}),
    ...(toYear != null ? { lte: toYear } : {}),
  };
}

export const resolvers = {
  Query: {
    hello: () => "Hello, World!",

    greetings: async () => prisma.greeting.findMany({ orderBy: { createdAt: "desc" } }),

    dataSummary: async () => {
      const [countries, indicators, observations, regionRows, incomeRows, latest] = await Promise.all([
        prisma.country.count(),
        prisma.indicator.count(),
        prisma.observation.count(),
        prisma.country.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } }),
        prisma.country.findMany({
          distinct: ["incomeLevel"],
          select: { incomeLevel: true },
          orderBy: { incomeLevel: "asc" },
        }),
        prisma.indicator.findFirst({
          where: { lastFetchedAt: { not: null } },
          orderBy: { lastFetchedAt: "desc" },
          select: { lastFetchedAt: true },
        }),
      ]);
      return {
        countries,
        indicators,
        observations,
        regions: regionRows.map((r) => r.region),
        incomeLevels: incomeRows.map((r) => r.incomeLevel),
        lastIngestedAt: latest?.lastFetchedAt?.toISOString() ?? null,
      };
    },

    countries: async (_p: unknown, args: { region?: string | null; incomeLevel?: string | null }) =>
      prisma.country.findMany({
        where: {
          ...(args.region ? { region: args.region } : {}),
          ...(args.incomeLevel ? { incomeLevel: args.incomeLevel } : {}),
        },
        orderBy: { name: "asc" },
      }),

    country: async (_p: unknown, args: { code: string }) =>
      prisma.country.findUnique({ where: { code: args.code.toUpperCase() } }),

    indicators: async () => prisma.indicator.findMany({ orderBy: { name: "asc" } }),

    indicator: async (_p: unknown, args: { code: string }) =>
      prisma.indicator.findUnique({ where: { code: args.code } }),

    observations: async (
      _p: unknown,
      args: { indicatorCode: string; countryCodes?: string[] | null } & YearArgs,
    ) =>
      prisma.observation.findMany({
        where: {
          indicatorCode: args.indicatorCode,
          ...(args.countryCodes?.length ? { countryCode: { in: args.countryCodes.map((c) => c.toUpperCase()) } } : {}),
          ...(yearFilter(args) ? { year: yearFilter(args) } : {}),
        },
        orderBy: [{ year: "asc" }, { countryCode: "asc" }],
      }),

    ranking: async (
      _p: unknown,
      args: { indicatorCode: string; year: number; limit?: number | null; order?: "ASC" | "DESC" | null },
    ) => {
      const limit = Math.min(Math.max(args.limit ?? 10, 1), 250);
      return prisma.observation.findMany({
        where: { indicatorCode: args.indicatorCode, year: args.year },
        orderBy: { value: args.order === "ASC" ? "asc" : "desc" },
        take: limit,
      });
    },
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

  Country: {
    observations: async (parent: { code: string }, args: { indicatorCode?: string | null } & YearArgs) =>
      prisma.observation.findMany({
        where: {
          countryCode: parent.code,
          ...(args.indicatorCode ? { indicatorCode: args.indicatorCode } : {}),
          ...(yearFilter(args) ? { year: yearFilter(args) } : {}),
        },
        orderBy: [{ indicatorCode: "asc" }, { year: "asc" }],
      }),
  },

  Indicator: {
    lastFetchedAt: (parent: { lastFetchedAt: Date | null }) => parent.lastFetchedAt?.toISOString() ?? null,
    observationCount: (parent: { code: string }) =>
      prisma.observation.count({ where: { indicatorCode: parent.code } }),
    yearRange: async (parent: { code: string }) => {
      const agg = await prisma.observation.aggregate({
        where: { indicatorCode: parent.code },
        _min: { year: true },
        _max: { year: true },
      });
      if (agg._min.year == null || agg._max.year == null) return null;
      return { min: agg._min.year, max: agg._max.year };
    },
  },

  Observation: {
    country: (parent: { countryCode: string }) =>
      prisma.country.findUniqueOrThrow({ where: { code: parent.countryCode } }),
    indicator: (parent: { indicatorCode: string }) =>
      prisma.indicator.findUniqueOrThrow({ where: { code: parent.indicatorCode } }),
  },
};

export const schema = createSchema({ typeDefs, resolvers });
