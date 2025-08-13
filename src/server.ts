import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { File } from './models/file';
import { Patch } from './models/patch';
import { PatchChain } from './models/patchChain';
import { Repository } from './models/repository';
import { Version } from './models/version';

import { buildSchema, ResolverData } from 'type-graphql';
import { PatchResolver } from './resolvers/patch';
import { PatchChainResolver } from './resolvers/patchChain';
import { FileResolver } from './resolvers/file';
import { RepositoryResolver } from './resolvers/repository';
import { VersionResolver } from './resolvers/version';
import { Container } from 'typedi';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import { startStandaloneServer } from '@apollo/server/standalone';
import { type Context } from "./context";

export const db = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'thaliak',
  entities: [
    File,
    Patch,
    PatchChain,
    Repository,
    Version,
  ],
  synchronize: false,
  logging: true,
});

async function bootstrap() {
  // init db
  await db.initialize();

  Container.set(DataSource, db);

  // build graphql schema
  const schema = await buildSchema({
    // Registry custom, scoped IOC container from resolver data function
    container: ({ context }: ResolverData<Context>) => context.container,
    resolvers: [
      FileResolver,
      PatchResolver,
      PatchChainResolver,
      RepositoryResolver,
      VersionResolver,
    ],
  });

  // init apollo
  const port = parseInt(process.env.PORT ?? '4000');
  const server = new ApolloServer({
    schema,
    // cors: { origin: '*' },
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageProductionDefault({
        footer: false,
        graphRef: "",
        embed: {
          displayOptions: {
            docsPanelState: "open",
            theme: "dark",
            showHeadersAndEnvVars: false,
          }
        },
//         tabs: [
//           {
//             endpoint: 'https://thaliak.xiv.dev/graphql/',
//             query: `query {
//   repositories {
//     id
//     slug
//     name
//     description
//     latestVersion {
//       versionString
//       firstOffered
//       lastOffered
//     }
//   }
// }
// `,
//           },
//         ],
      }),
    ],
  });

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      const requestId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER); // uuid-like
      const container = Container.of(requestId.toString()); // Get scoped container
      const context = { requestId, container }; // Create context
      container.set("context", context); // Set context or other data in container

      return context;
    },
    listen: { port: port },
  });
  console.log(`🚀 Server ready at http://${url}`);
}

bootstrap();
