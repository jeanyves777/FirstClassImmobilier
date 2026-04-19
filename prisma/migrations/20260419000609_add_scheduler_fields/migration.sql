-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "phone" TEXT,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "hoursFr" TEXT,
    "hoursEn" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "tiktokUrl" TEXT,
    "footerCopy" TEXT,
    "slotDurationMin" INTEGER NOT NULL DEFAULT 45,
    "availability" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("address", "email", "facebookUrl", "footerCopy", "hoursEn", "hoursFr", "id", "instagramUrl", "linkedinUrl", "mobile", "phone", "tiktokUrl", "updatedAt", "whatsapp", "youtubeUrl") SELECT "address", "email", "facebookUrl", "footerCopy", "hoursEn", "hoursFr", "id", "instagramUrl", "linkedinUrl", "mobile", "phone", "tiktokUrl", "updatedAt", "whatsapp", "youtubeUrl" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
