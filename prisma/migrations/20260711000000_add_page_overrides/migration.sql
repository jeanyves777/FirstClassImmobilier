-- Editable section texts for realisations/activites/equipes
ALTER TABLE "SiteSettings" ADD COLUMN "realisationsContent" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "activitesContent" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "equipesContent" TEXT;
