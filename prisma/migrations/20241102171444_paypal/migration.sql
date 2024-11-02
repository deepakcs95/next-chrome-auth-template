/*
  Warnings:

  - Made the column `SubscriptionId` on table `Subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "PaypalToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "SubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextBillingTime" DATETIME,
    "lastPaymentAmount" REAL,
    "lastPaymentTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("SubscriptionId", "createdAt", "id", "lastPaymentAmount", "lastPaymentTime", "nextBillingTime", "planId", "status", "updatedAt", "userId") SELECT "SubscriptionId", "createdAt", "id", "lastPaymentAmount", "lastPaymentTime", "nextBillingTime", "planId", "status", "updatedAt", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_SubscriptionId_key" ON "Subscription"("SubscriptionId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaypalToken_accessToken_key" ON "PaypalToken"("accessToken");

-- CreateIndex
CREATE INDEX "PaypalToken_expiresAt_idx" ON "PaypalToken"("expiresAt");
