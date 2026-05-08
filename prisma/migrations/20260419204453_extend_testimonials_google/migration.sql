-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "photoId" TEXT,
    "photoUrl" TEXT,
    "rating" INTEGER,
    "quote" TEXT NOT NULL,
    "reviewDate" DATETIME,
    "sourceUrl" TEXT,
    "programId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Testimonial_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Testimonial" ("authorName", "authorRole", "createdAt", "id", "order", "photoId", "programId", "published", "quote", "updatedAt") SELECT "authorName", "authorRole", "createdAt", "id", "order", "photoId", "programId", "published", "quote", "updatedAt" FROM "Testimonial";
DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";
CREATE INDEX "Testimonial_published_order_idx" ON "Testimonial"("published", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
