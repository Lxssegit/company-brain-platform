-- The pgvector extension has to exist before KnowledgeUnit.embedding can be
-- created. The README used to ask for this by hand, which meant a fresh
-- database failed the first migration for a reason nothing explained.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('READ', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'MANAGE_USERS', 'MANAGE_BRANCH', 'MANAGE_DECISIONS');

-- CreateEnum
CREATE TYPE "BranchKind" AS ENUM ('COMPANY', 'DEPARTMENT', 'TEAM', 'PERSONAL');

-- CreateEnum
CREATE TYPE "BranchAccess" AS ENUM ('READ', 'DENY');

-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('FACT', 'PROCESS', 'RULE', 'DECISION', 'CUSTOMER', 'PRODUCT', 'PERSON', 'EXCEPTION', 'PROCEDURE', 'LESSON', 'POLICY');

-- CreateEnum
CREATE TYPE "KnowledgeScope" AS ENUM ('PERSONAL', 'TEAM', 'DEPARTMENT', 'COMPANY');

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DOCUMENT', 'EMAIL', 'MEETING', 'CHAT', 'CRM', 'ERP', 'MANUAL', 'EMPLOYEE_INPUT', 'DECISION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'EXPIRED', 'DRAFT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "totpSecretEncrypted" TEXT,
    "totpPendingSecretEncrypted" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionKey" "PermissionKey" NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionKey")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "kind" "BranchKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" TEXT,
    "path" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchMember" (
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "access" "BranchAccess" NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchMember_pkey" PRIMARY KEY ("branchId","userId")
);

-- CreateTable
CREATE TABLE "KnowledgeUnit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "KnowledgeType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scope" "KnowledgeScope" NOT NULL,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "embedding" vector,
    "embeddingModel" TEXT,
    "embeddedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "externalUrl" TEXT,
    "externalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "knowledgeUnitId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "citation" TEXT,
    "relevance" DOUBLE PRECISION,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("knowledgeUnitId","sourceId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "knowledgeUnitId" TEXT NOT NULL,
    "targetBranchId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "department" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" "DecisionStatus" NOT NULL DEFAULT 'ACTIVE',
    "exceptions" JSONB,
    "supersedesDecisionId" TEXT,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionBranch" (
    "decisionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "DecisionBranch_pkey" PRIMARY KEY ("decisionId","branchId")
);

-- CreateTable
CREATE TABLE "DecisionSource" (
    "decisionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "citation" TEXT,

    CONSTRAINT "DecisionSource_pkey" PRIMARY KEY ("decisionId","sourceId")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_status_idx" ON "User"("organizationId", "status");

-- CreateIndex
CREATE INDEX "User_organizationId_roleId_idx" ON "User"("organizationId", "roleId");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_key_key" ON "Role"("organizationId", "key");

-- CreateIndex
CREATE INDEX "Branch_organizationId_parentId_idx" ON "Branch"("organizationId", "parentId");

-- CreateIndex
CREATE INDEX "Branch_organizationId_path_idx" ON "Branch"("organizationId", "path");

-- CreateIndex
CREATE INDEX "BranchMember_userId_access_idx" ON "BranchMember"("userId", "access");

-- CreateIndex
CREATE INDEX "KnowledgeUnit_organizationId_branchId_status_scope_idx" ON "KnowledgeUnit"("organizationId", "branchId", "status", "scope");

-- CreateIndex
CREATE INDEX "KnowledgeUnit_organizationId_createdById_status_idx" ON "KnowledgeUnit"("organizationId", "createdById", "status");

-- CreateIndex
CREATE INDEX "Source_organizationId_type_idx" ON "Source"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Review_organizationId_targetBranchId_status_idx" ON "Review"("organizationId", "targetBranchId", "status");

-- CreateIndex
CREATE INDEX "Review_organizationId_requestedById_status_idx" ON "Review"("organizationId", "requestedById", "status");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Decision_organizationId_status_validFrom_validUntil_idx" ON "Decision"("organizationId", "status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "Decision_organizationId_createdById_idx" ON "Decision"("organizationId", "createdById");

-- CreateIndex
CREATE INDEX "Decision_organizationId_supersedesDecisionId_idx" ON "Decision"("organizationId", "supersedesDecisionId");

-- CreateIndex
CREATE INDEX "DecisionBranch_branchId_decisionId_idx" ON "DecisionBranch"("branchId", "decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnit" ADD CONSTRAINT "KnowledgeUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnit" ADD CONSTRAINT "KnowledgeUnit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnit" ADD CONSTRAINT "KnowledgeUnit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeUnit" ADD CONSTRAINT "KnowledgeUnit_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_knowledgeUnitId_fkey" FOREIGN KEY ("knowledgeUnitId") REFERENCES "KnowledgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_supersedesDecisionId_fkey" FOREIGN KEY ("supersedesDecisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionBranch" ADD CONSTRAINT "DecisionBranch_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionBranch" ADD CONSTRAINT "DecisionBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionSource" ADD CONSTRAINT "DecisionSource_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionSource" ADD CONSTRAINT "DecisionSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Vector search would otherwise sequentially scan the table. The index is
-- only consulted after the organization and branch predicate has been
-- applied, which is the order src/lib/retrieval/search.ts enforces.
CREATE INDEX IF NOT EXISTS "KnowledgeUnit_embedding_hnsw_idx"
  ON "KnowledgeUnit" USING hnsw ("embedding" vector_cosine_ops);
