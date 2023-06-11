import { PrismaClient, Prisma } from "@prisma/client";

const client = new PrismaClient();

const insertLost = async (post: Prisma.lostsCreateInput) => {
  if (
    !(await client.losts.findFirst({
      where: post,
    }))
  )
    return await client.losts.create({
      data: post,
    });
};

const insertLosts = async (posts: Prisma.lostsCreateInput[]) => {
  await client.$transaction([
    ...posts.map((p, i) =>
      client.losts.create({
        data: p,
      })
    ),
  ]);
  return;
};

export { insertLost, insertLosts };
