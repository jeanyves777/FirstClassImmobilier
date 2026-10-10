-- Editable homepage hero
ALTER TABLE "SiteSettings" ADD COLUMN "heroTitle" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroSubtitle" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroStatement" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroImageUrl" TEXT;
