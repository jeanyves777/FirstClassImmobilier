/*
  Warnings:

  - Added the required column `updatedAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Lot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'required',
    "documentId" TEXT,
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentRequirement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "staffId" TEXT,
    "purpose" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'public-form',
    "programId" TEXT,
    "lotId" TEXT,
    "scheduledAt" DATETIME,
    "preferredAt" DATETIME,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "note" TEXT,
    "meetingUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("durationMin", "id", "meetingUrl", "programId", "purpose", "scheduledAt", "staffId", "status", "userId") SELECT "durationMin", "id", "meetingUrl", "programId", "purpose", "scheduledAt", "staffId", "status", "userId" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE TABLE "new_Lot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "surfaceM2" INTEGER NOT NULL,
    "priceFCFA" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "title" TEXT,
    "description" TEXT,
    "highlights" TEXT,
    "features" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "videoUrl" TEXT,
    "virtualTourUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lot" ("id", "priceFCFA", "programId", "reference", "status", "surfaceM2") SELECT "id", "priceFCFA", "programId", "reference", "status", "surfaceM2" FROM "Lot";
DROP TABLE "Lot";
ALTER TABLE "new_Lot" RENAME TO "Lot";
CREATE UNIQUE INDEX "Lot_programId_reference_key" ON "Lot"("programId", "reference");
CREATE TABLE "new_Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "programId" TEXT,
    "lotId" TEXT,
    "activityId" TEXT,
    CONSTRAINT "Media_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Media_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Media_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Media" ("activityId", "alt", "id", "kind", "programId", "url") SELECT "activityId", "alt", "id", "kind", "programId", "url" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "lotId" TEXT,
    "assignedAgentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "id", "lotId", "note", "programId", "status", "userId") SELECT "createdAt", "id", "lotId", "note", "programId", "status", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "lotId" TEXT,
    "assignedAgentId" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'draft',
    "totalFCFA" BIGINT NOT NULL,
    "signedAt" DATETIME,
    "acdIssuedAt" DATETIME,
    "acdDocumentId" TEXT,
    "constructionProgress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("acdDocumentId", "acdIssuedAt", "buyerId", "constructionProgress", "createdAt", "id", "lotId", "programId", "signedAt", "totalFCFA", "updatedAt") SELECT "acdDocumentId", "acdIssuedAt", "buyerId", "constructionProgress", "createdAt", "id", "lotId", "programId", "signedAt", "totalFCFA", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DocumentRequirement_saleId_status_idx" ON "DocumentRequirement"("saleId", "status");
