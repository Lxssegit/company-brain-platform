-- DropIndex
DROP INDEX "KnowledgeUnit_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "managerId" TEXT;

-- CreateIndex
CREATE INDEX "User_organizationId_managerId_idx" ON "User"("organizationId", "managerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
