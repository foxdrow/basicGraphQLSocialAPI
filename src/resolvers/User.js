import getUserId from "../utils/getUserId";

const User = {
  email: {
    resolve(parent, args, { request }, info) {
      const userId = getUserId(request, false);

      if (userId === parent.id) return parent.email;
      else return undefined;
    },
  },
  post: {
    resolve(parent, args, { request, prisma }, info) {
      return prisma.post.findMany({
        where: {
          published: true,
          author: {
            id: parent.id,
          },
        },
      });
    },
  },
};

export { User as default };
