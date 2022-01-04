const { isStrongPassword } = require("validator");
const bcrypt = require("bcrypt");
import jwt from "jsonwebtoken";
import getUserId from "../utils/getUserId";

const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    const emailTaken = await prisma.user
      .findUnique({
        where: { email: args.data.email },
      })
      .then((user) => {
        if (user) throw new Error("Email taken");
      });

    if (!isStrongPassword(args.data.password))
      throw new Error("Password not strong enough");

    const password = await bcrypt.hash(args.data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...args.data,
        password,
      },
    });
    return {
      user,
      token: jwt.sign({ userId: user.id }, "secret", { expiresIn: "7 days" }),
    };
  },
  async login(parent, args, { prisma }, info) {
    const user = await prisma.user.findUnique({
      where: { email: args.data.email },
    });
    if (!user) throw new Error("User not found");

    const isValidPassword = await bcrypt.compare(
      args.data.password,
      user.password
    );
    if (!isValidPassword) throw new Error("Unable to login");

    return {
      user,
      token: jwt.sign({ userId: user.id }, "secret", { expiresIn: "7 days" }),
    };
  },
  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const userExists = await prisma.user
      .findUnique({
        where: { id: userId },
      })
      .then((user) => {
        if (!user) throw new Error("User not found");
      });

    await prisma.post.deleteMany({
      where: {
        author: {
          id: userId,
        },
      },
    });

    await prisma.comment.deleteMany({
      where: {
        author: {
          id: userId,
        },
      },
    });

    return prisma.user.delete({
      where: { id: userId },
    });
  },
  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.user.update({
      where: {
        id: userId,
      },
      data: args.data,
    });
  },
  createPost(parent, args, { pubsub, prisma, request }, info) {
    const userId = getUserId(request);

    const post = prisma.post.create({
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
      include: {
        author: true,
      },
    });

    return post;
  },
  async deletePost(parent, args, { prisma, pubsub, request }, info) {
    const userId = getUserId(request);

    const [post] = await prisma.post.findMany({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
      include: {
        author: true,
      },
    });

    if (!post) throw new Error("post not found");

    await prisma.post.deleteMany({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    return post;
  },
  async updatePost(parent, args, { prisma, pubsub, request }, info) {
    const userId = getUserId(request);

    const [post] = await prisma.post.findMany({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
      include: {
        author: true,
      },
    });

    const [isPublished] = await prisma.post.findMany({
      where: {
        id: args.id,
        published: true,
      },
    });

    if (!post) throw new Error("post not found");

    if (isPublished && args.data.published === false) {
      await prisma.comment.deleteMany({
        where: {
          post: {
            id: args.id,
          },
        },
      });
    }

    return prisma.post.update({
      where: {
        id: args.id,
      },
      data: args.data,
      include: {
        author: true,
      },
    });
  },
  async createComment(parent, args, { prisma, pubsub, request }, info) {
    const userId = await getUserId(request);

    const [post] = await prisma.post.findMany({
      where: {
        id: args.data.post,
        published: true,
      },
    });

    if (!post) throw new Error("post not found");

    return prisma.comment.create({
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
      include: {
        post: true,
        author: true,
      },
    });
  },
  async deleteComment(parent, args, { prisma, pubsub, request }, info) {
    const userId = await getUserId(request);

    const [comment] = await prisma.comment.findMany({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    if (!comment) throw new Error("comment not found");

    return prisma.comment.delete({
      where: {
        id: args.id,
      },
      include: {
        post: true,
        author: true,
      },
    });
  },
  async updateComment(parent, args, { prisma, pubsub, request }, info) {
    const userId = await getUserId(request);

    const [comment] = await prisma.comment.findMany({
      where: {
        id: args.id,
        author: {
          id: userId,
        },
      },
    });

    if (!comment) throw new Error("comment not found");

    return prisma.comment.update({
      where: {
        id: args.id,
      },
      data: args.data,
      include: {
        post: true,
        author: true,
      },
    });
  },
};

export { Mutation as default };
