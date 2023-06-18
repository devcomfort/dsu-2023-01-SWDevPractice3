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

-- CreateTable
CREATE TABLE "subscription" (
    "subscription_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "startDt" DATETIME,
    "province" TEXT,
    "is_authorized" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "authorization_code" (
    "auth_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "when_expire" DATETIME NOT NULL,
    "targetEmailString" TEXT NOT NULL,
    CONSTRAINT "authorization_code_targetEmailString_fkey" FOREIGN KEY ("targetEmailString") REFERENCES "subscription" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_email_key" ON "subscription"("email");
