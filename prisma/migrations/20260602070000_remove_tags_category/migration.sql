-- Drop tags / category columns (feature removed)
ALTER TABLE "StudyNote" DROP COLUMN "category", DROP COLUMN "tags";
ALTER TABLE "WorkLog" DROP COLUMN "tags";
