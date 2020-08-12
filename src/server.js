import '@babel/polyfill';
import { GraphQLServer } from 'graphql-yoga';
import { resolvers } from './resolvers';
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
import prisma from './prisma';
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context:(req)=> {
    return {
      ...req,
      prisma,

    }

  },
     resolverValidationOptions: {
          requireResolversForResolveType: false,
     },

});
server.express.use(cookieParser());

server.express.use((req, res, next) => {
     const { token } = req.cookies;

     if (token) {
          const { userId } = jwt.verify(token, process.env.APP_SECRET|"fafasfkansfkafs");
          // put the userId onto the req for future requests to access
          req.userId = userId;
     }
     next();
});

// 2. Create a middleware that populates the user on each request

server.express.use(async (req, res, next) => {
     // if they aren't logged in, skip this
     if (!req.userId) return next();
     const user = await prisma.query.user(
          { where: { id: req.userId } },
          '{ id, permissions, email, name }'
     );
     req.user = user;
     next();
});

server.start(

     deets => {
          console.log(`Server is now running on port http://localhost:${deets.port}`);
     }
);
