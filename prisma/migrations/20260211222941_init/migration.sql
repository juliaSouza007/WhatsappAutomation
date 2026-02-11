/*
  Warnings:

  - You are about to drop the column `name` on the `MessageQueue` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MessageQueue" ("createdAt", "id", "message", "metadata", "phone", "scheduledAt", "status") SELECT "createdAt", "id", "message", "metadata", "phone", "scheduledAt", "status" FROM "MessageQueue";
DROP TABLE "MessageQueue";
ALTER TABLE "new_MessageQueue" RENAME TO "MessageQueue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
