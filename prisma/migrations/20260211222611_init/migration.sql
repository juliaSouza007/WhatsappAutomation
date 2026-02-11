/*
  Warnings:

  - Added the required column `name` to the `MessageQueue` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
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
