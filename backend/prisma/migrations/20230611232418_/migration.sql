-- CreateTable
CREATE TABLE "losts" (
    "lost_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "when_found" DATETIME NOT NULL,
    "where_found" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "is_created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
