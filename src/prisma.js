import { Prisma } from 'prisma-binding';
import dotenv from 'dotenv'
dotenv.config({path:"../.env"})
const prisma = new Prisma({
  typeDefs: "src/generated/prisma.graphql",
  endpoint: "https://simplepost-78618dd602.herokuapp.com/app/dev",
  secret: "dalsdkasjdksadkjdalsdkasjdksadkj",

});

export { prisma as default };


