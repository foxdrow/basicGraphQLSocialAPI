import getUserId from "../utils/getUserId";

const Query = {
  users(parent, args, { prisma }, info) {
    if (!args.query)
      return prisma.user.findMany({
        include: {
          post: true,
          comment: true,
        },
      });

    return prisma.user.findMany({
      where: {
        name: {
          contains: args.query,
        },
      },
      include: {
        post: true,
        comment: true,
      },
    });
  },
  posts(parent, args, { prisma }, info) {
    if (!args.query)
      return prisma.post.findMany({
        where: {
          published: true,
        },
        include: {
          author: true,
          comment: true,
        },
      });

    return prisma.post.findMany({
      where: {
        published: true,
        OR: [
          {
            title: {
              contains: args.query,
            },
          },
          {
            body: {
              contains: args.query,
            },
          },
        ],
      },
      include: {
        author: true,
        comment: true,
      },
    });
  },
  comments(parent, args, { prisma }, info) {
    return prisma.comment.findMany({
      include: {
        author: true,
        post: true,
      },
    });
  },
  async post(parent, args, { prisma, request }, info) {
    const userId = await getUserId(request, false);

    const [post] = await prisma.post.findMany({
      where: {
        id: args.id,
        OR: [
          {
            published: true,
          },
          {
            author: {
              id: userId,
            },
          },
        ],
      },
      include: {
        author: true,
      },
    });

    if (!post) throw new Error("No post found");

    return post;
  },
  async me(parent, args, { prisma, request }, info) {
    const userId = await getUserId(request);

    const me = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return me;
  },
  async myPosts(parent, args, { prisma, request }, info) {
    const userId = await getUserId(request);

    if (!args.query)
      return await prisma.post.findMany({
        where: {
          author: {
            id: userId,
          },
        },
        include: {
          author: true,
          comment: true,
        },
      });

    return await prisma.post.findMany({
      where: {
        author: {
          id: userId,
        },
        OR: [
          {
            title: { contains: args.query },
          },
          {
            body: { contains: args.query },
          },
        ],
      },
      include: {
        author: true,
        comment: true,
      },
    });
  },
};

export { Query as default };
