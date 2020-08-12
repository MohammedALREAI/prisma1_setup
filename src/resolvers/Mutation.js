import  bcrypt from "bcryptjs"
import  jwt from "jsonwebtoken"
const Mutation = {
  async login(parent, args, { prisma }, info) {
    const { password, email } = args.data;
    const user = await prisma.query.user({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error("No user found");
    }

    const comparePassword = await bcrypt.compare(user.password, password);

    if (!comparePassword) {
      throw new Error("Incorrect password");
    }
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return {
      user,
      token,
    };
  },
  async createUser(parent, args, { prisma }, info) {
    const { email, password, name } = args.data;
    const if_userFound = await prisma.query.user({
      where: {
        email,
      },
    });
    if (if_userFound) {
      throw new Error("the user found plase login");
    }
    password = await bcrypt.hash(password, 10);
    const user = await prisma.mutation.createUser({
      data: {
        email,
        name,
        password,
      },
    });

    //     const token = jwt.sign({ userId: user.id }, "dkadsaddkdssdd");
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // We set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // We set the jwt as a cookie on the response

    return {
      user,
      token,
    };
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async updateUser(parent, args, { req, prisma }, info) {
    const userId = req.userId;
    const { password } = args.data;
    if (typeof password === "string") {
      password = await bcrypt.hash(args.data.password, 10);
    }

    return prisma.mutation.updateUser(
      {
        where: {
          id: userId,
        },
        data: args.data,
      },
      info
    );
  },
  deleteUser(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId();

    return prisma.mutation.deleteUser(
      {
        where: {
          id: userId,
        },
      },
      info
    );
  },
  createPost(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId();

    return prisma.mutation.createPost(
      {
        data: {
          title: args.data.title,
          body: args.data.body,
          published: args.data.published,
          author: {
            connect: {
              id: userId,
            },
          },
        },
      },
      info
    );
  },
  async updatePost(parent, args, { req, prisma, getUserId }, info) {
    const { postId } = args.id;
    const userId = getUserId();

    const postExists = await prisma.exists.Post({
      id: postId,
      author: {
        id: userId,
      },
    });

    const isPublished = await prisma.exists.Post({
      id: args.id,
      published: true,
    });

    if (!postExists) {
      throw new Error("Unable to update post");
    }

    if (isPublished && args.data.published === false) {
      await prisma.mutation.deleteManyComments({
        where: {
          post: {
            id: args.id,
          },
        },
      });
    }

    return prisma.mutation.updatePost(
      {
        where: {
          id: args.id,
        },
        data: args.data,
      },
      info
    );
  },
  async deletePost(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId();
    const postExists = await prisma.exists.Post({
      id: args.id,
      author: {
        id: userId,
      },
    });

    if (!postExists) {
      throw new Error("Unable to delete post");
    }

    return prisma.mutation.deletePost(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async createComment(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId();
    const postExists = await prisma.exists.Post({
      id: args.data.post,
      published: true,
    });

    if (!postExists) {
      throw new Error("Unable to find post");
    }

    return prisma.mutation.createComment(
      {
        data: {
          text: args.data.text,
          author: {
            connect: {
              id: userId,
            },
          },
          post: {
            connect: {
              id: args.data.post,
            },
          },
        },
      },
      info
    );
  },
  async updateComment(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId();
    const commentExists = await prisma.exists.Comment({
      id: args.id,
      author: {
        id: userId,
      },
    });

    if (!commentExists) {
      throw new Error("Unable to update comment");
    }

    return prisma.mutation.updateComment(
      {
        where: {
          id: args.id,
        },
        data: args.data,
      },
      info
    );
  },
  async deleteComment(parent, args, { req, prisma, getUserId }, info) {
    const userId = getUserId(req);
    const commentExists = await prisma.exists.Comment({
      id: args.id,
      author: {
        id: userId,
      },
    });

    if (!commentExists) {
      throw new Error("Unable to delete comment");
    }

    return prisma.mutation.deleteComment(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },
};

export { Mutation as default };
