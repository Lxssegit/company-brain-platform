import { randomUUID } from "node:crypto";
import { PrismaClient, PermissionKey, RoleKey, type BranchKind, type KnowledgeScope, type KnowledgeStatus, type KnowledgeType } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const permissions: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PermissionKey),
  COMPANY_ADMIN: Object.values(PermissionKey),
  DEPARTMENT_ADMIN: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE, PermissionKey.MANAGE_BRANCH, PermissionKey.MANAGE_DECISIONS],
  MANAGER: [PermissionKey.READ, PermissionKey.CREATE, PermissionKey.EDIT, PermissionKey.APPROVE],
  EMPLOYEE: [PermissionKey.READ, PermissionKey.CREATE],
};

const roleNames: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super-Admin",
  COMPANY_ADMIN: "Unternehmens-Admin",
  DEPARTMENT_ADMIN: "Abteilungs-Admin",
  MANAGER: "Teamleitung",
  EMPLOYEE: "Mitarbeitend",
};

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "example-gmbh" },
    update: {},
    create: { name: "Example GmbH", slug: "example-gmbh" },
  });

  for (const key of Object.values(RoleKey)) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: organization.id, key } },
      update: { name: roleNames[key] },
      create: { organizationId: organization.id, key, name: roleNames[key] },
    });
    for (const permissionKey of permissions[key]) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionKey: { roleId: role.id, permissionKey } }, update: {}, create: { roleId: role.id, permissionKey } });
    }
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { organizationId_key: { organizationId: organization.id, key: RoleKey.COMPANY_ADMIN } } });

  /* Branch ids must be real UUIDs: the API validates every branchId it is given
     with z.string().uuid(), so a readable id like `${org.id}-company` produced
     seed data the application then refused to accept. */
  async function branch(name: string, kind: BranchKind, parent?: { id: string; path: string; depth: number }, description?: string, ownerUserId?: string) {
    const existing = await prisma.branch.findFirst({ where: { organizationId: organization.id, name, parentId: parent?.id ?? null } });
    if (existing) return existing;
    const id = randomUUID();
    return prisma.branch.create({
      data: { id, organizationId: organization.id, parentId: parent?.id ?? null, kind, name, description, ownerUserId, path: parent ? `${parent.path}/${id}` : id, depth: parent ? parent.depth + 1 : 0 },
    });
  }

  const company = await branch("Example GmbH", "COMPANY", undefined, "Das gemeinsame Gedächtnis des ganzen Unternehmens.");
  const tech = await branch("Produkt & Technik", "DEPARTMENT", company, "Die Menschen und Systeme, die aus Kundenbedürfnissen ein besseres Produkt machen.");
  const service = await branch("Service", "TEAM", tech, "Das Team, das Kunden am Laufen hält: Support, Störungen und alles dazwischen.");
  const platform = await branch("Plattform", "TEAM", tech, "Betrieb, Datenhaltung und alles, worauf die anderen Teams aufsetzen.");
  const market = await branch("Vermarktung & Wachstum", "DEPARTMENT", company, "Wie das Unternehmen erklärt wird und wie daraus Umsatz entsteht.");
  const content = await branch("Inhalte", "TEAM", market, "Redaktion, Fallstudien und alles, was nach außen geschrieben wird.");
  const people = await branch("Personal", "DEPARTMENT", company, "Verträge, Gehälter, Verfahren. Der Zweig, der am seltensten offen sein sollte.");

  const demoEmail = (process.env.AUTH_DEV_EMAIL ?? "demo@example-gmbh.local").trim().toLowerCase();
  const demoPassword = process.env.AUTH_DEV_PASSWORD ?? "company-brain-local";
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", name: "Demo Admin", passwordHash: hashPassword(demoPassword) },
    create: { email: demoEmail, name: "Demo Admin", organizationId: organization.id, roleId: adminRole.id, status: "ACTIVE", passwordHash: hashPassword(demoPassword) },
  });

  /* Without a personal branch and a membership, POST /api/knowledge with the
     default PERSONAL scope has nowhere to write and fails for the very account
     the seed exists to make usable. */
  const personal = await branch("Demo Admin", "PERSONAL", service, "Notizen und Entwürfe, die privat bleiben, bis sie freigegeben werden.", user.id);
  await prisma.branchMember.upsert({
    where: { branchId_userId: { branchId: personal.id, userId: user.id } },
    update: {},
    create: { branchId: personal.id, userId: user.id, access: "READ", grantedBy: user.id },
  });

  /* One account in an organization chart is a straight line. Nothing about
     inherited visibility, an explicit deny, or a reporting structure can be
     judged against it — neither by a reviewer nor by whoever is looking at the
     screen deciding whether the thing works. These people exist so the access
     rules have something to be wrong about. */
  const roleByKey = new Map(
    await Promise.all(
      Object.values(RoleKey).map(async (key) =>
        [key, await prisma.role.findUniqueOrThrow({ where: { organizationId_key: { organizationId: organization.id, key } } })] as const,
      ),
    ),
  );

  type Colleague = {
    email: string;
    name: string;
    jobTitle: string;
    bio: string;
    roleKey: RoleKey;
    managerEmail?: string;
    homeBranchId: string;
    /** Grants beyond their own personal branch, which everyone gets. */
    grants?: { branchId: string; access: "READ" | "DENY" }[];
  };

  const colleagues: Colleague[] = [
    {
      email: "andrea.koch@example-gmbh.local",
      name: "Andrea Koch",
      jobTitle: "Geschäftsführung",
      bio: "Verantwortet die Gesamtausrichtung und entscheidet, was verbindlich gilt, wenn zwei Abteilungen sich widersprechen.",
      roleKey: RoleKey.COMPANY_ADMIN,
      homeBranchId: company.id,
      grants: [{ branchId: company.id, access: "READ" }],
    },
    {
      email: "matthias.krueger@example-gmbh.local",
      name: "Matthias Krüger",
      jobTitle: "Leitung Produkt & Technik",
      bio: "Führt Service und Plattform und übersetzt zwischen dem, was Kunden melden, und dem, was gebaut wird.",
      roleKey: RoleKey.DEPARTMENT_ADMIN,
      managerEmail: "andrea.koch@example-gmbh.local",
      homeBranchId: tech.id,
      grants: [{ branchId: tech.id, access: "READ" }],
    },
    {
      email: "sebastian.hoffmann@example-gmbh.local",
      name: "Sebastian Hoffmann",
      jobTitle: "Teamleitung Service",
      bio: "Hält den Support am Laufen und entscheidet, welche Störung eskaliert wird.",
      roleKey: RoleKey.MANAGER,
      managerEmail: "matthias.krueger@example-gmbh.local",
      homeBranchId: service.id,
      grants: [{ branchId: service.id, access: "READ" }],
    },
    {
      email: "lukas.schneider@example-gmbh.local",
      name: "Lukas Schneider",
      jobTitle: "Systembetreuung Plattform",
      bio: "Betreut Datenhaltung und Betrieb. Sieht die Plattform von innen und den Rest des Unternehmens nur als Kontext.",
      roleKey: RoleKey.EMPLOYEE,
      managerEmail: "matthias.krueger@example-gmbh.local",
      homeBranchId: platform.id,
      grants: [{ branchId: platform.id, access: "READ" }],
    },
    {
      email: "michael.schaefer@example-gmbh.local",
      name: "Michael Schäfer",
      jobTitle: "Leitung Inhaltsvermarktung",
      bio: "Verantwortet, was das Unternehmen nach außen schreibt, und stimmt es mit Produkt und Service ab.",
      roleKey: RoleKey.DEPARTMENT_ADMIN,
      managerEmail: "andrea.koch@example-gmbh.local",
      homeBranchId: market.id,
      /* Deliberately awkward: a grant on Service as well, so one profile shows
         access reaching across a department boundary — the arrangement an
         admin is supposed to notice and either justify or revoke. */
      grants: [
        { branchId: market.id, access: "READ" },
        { branchId: service.id, access: "READ" },
      ],
    },
    {
      email: "marion.weber@example-gmbh.local",
      name: "Marion Weber",
      jobTitle: "Redaktion",
      bio: "Schreibt Fallstudien und Anleitungen und verlässt sich darauf, dass das Festgehaltene noch gilt.",
      roleKey: RoleKey.EMPLOYEE,
      managerEmail: "michael.schaefer@example-gmbh.local",
      homeBranchId: content.id,
      grants: [{ branchId: content.id, access: "READ" }],
    },
    {
      email: "petra.lange@example-gmbh.local",
      name: "Petra Lange",
      jobTitle: "Leitung Personal",
      bio: "Führt Personalverfahren und Verträge. Ihr Zweig ist der, bei dem eine Sperre etwas bedeuten muss.",
      roleKey: RoleKey.DEPARTMENT_ADMIN,
      managerEmail: "andrea.koch@example-gmbh.local",
      homeBranchId: people.id,
      grants: [{ branchId: people.id, access: "READ" }],
    },
  ];

  const seededByEmail = new Map<string, string>([[demoEmail, user.id]]);
  for (const colleague of colleagues) {
    const role = roleByKey.get(colleague.roleKey);
    if (!role) throw new Error(`missing role ${colleague.roleKey}`);
    const record = await prisma.user.upsert({
      where: { email: colleague.email },
      update: { organizationId: organization.id, roleId: role.id, status: "ACTIVE", name: colleague.name, jobTitle: colleague.jobTitle, bio: colleague.bio },
      create: {
        email: colleague.email,
        name: colleague.name,
        jobTitle: colleague.jobTitle,
        bio: colleague.bio,
        organizationId: organization.id,
        roleId: role.id,
        status: "ACTIVE",
        passwordHash: hashPassword(demoPassword),
      },
    });
    seededByEmail.set(colleague.email, record.id);
  }

  /* Reporting lines are set in a second pass: a manager has to exist as a row
     before anyone can point at them, and the chart is a graph, not a list. */
  for (const colleague of colleagues) {
    const managerId = colleague.managerEmail ? seededByEmail.get(colleague.managerEmail) : undefined;
    if (!managerId) continue;
    await prisma.user.update({ where: { email: colleague.email }, data: { managerId } });
  }

  const personalByEmail = new Map<string, string>([[demoEmail, personal.id]]);
  for (const colleague of colleagues) {
    const userId = seededByEmail.get(colleague.email)!;
    const home = [company, tech, service, platform, market, content, people].find((item) => item.id === colleague.homeBranchId)!;
    const own = await branch(colleague.name, "PERSONAL", home, "Notizen und Entwürfe, die privat bleiben, bis sie freigegeben werden.", userId);
    personalByEmail.set(colleague.email, own.id);
    for (const grant of [{ branchId: own.id, access: "READ" as const }, ...(colleague.grants ?? [])]) {
      await prisma.branchMember.upsert({
        where: { branchId_userId: { branchId: grant.branchId, userId } },
        update: { access: grant.access },
        create: { branchId: grant.branchId, userId, access: grant.access, grantedBy: user.id },
      });
    }
  }

  /* An explicit deny that overrides an inherited read is the rule hardest to
     believe without seeing it. Lukas reads Plattform, which pulls Produkt &
     Technik and the company root into view as context — and this stops the
     personnel branch from riding along. */
  await prisma.branchMember.upsert({
    where: { branchId_userId: { branchId: people.id, userId: seededByEmail.get("lukas.schneider@example-gmbh.local")! } },
    update: { access: "DENY" },
    create: { branchId: people.id, userId: seededByEmail.get("lukas.schneider@example-gmbh.local")!, access: "DENY", grantedBy: user.id },
  });

  async function knowledge(input: { title: string; content: string; type: KnowledgeType; scope: KnowledgeScope; status: KnowledgeStatus; branchId: string; createdByEmail: string; approvedByEmail?: string }) {
    const existing = await prisma.knowledgeUnit.findFirst({ where: { organizationId: organization.id, title: input.title } });
    if (existing) return existing;
    return prisma.knowledgeUnit.create({
      data: {
        organizationId: organization.id,
        branchId: input.branchId,
        type: input.type,
        title: input.title,
        content: input.content,
        scope: input.scope,
        status: input.status,
        createdById: seededByEmail.get(input.createdByEmail)!,
        approvedById: input.approvedByEmail ? seededByEmail.get(input.approvedByEmail) : undefined,
        verifiedAt: input.status === "APPROVED" ? new Date() : undefined,
      },
    });
  }

  await knowledge({
    title: "Rückruf bei Störungen der Stufe 1",
    content: "Bei einer Störung der Stufe 1 ruft der Service die betroffenen Kunden innerhalb von zwei Stunden aktiv an, auch außerhalb der Geschäftszeiten. Eine Mail ersetzt den Anruf nicht.",
    type: "PROCESS", scope: "DEPARTMENT", status: "APPROVED",
    branchId: service.id, createdByEmail: "sebastian.hoffmann@example-gmbh.local", approvedByEmail: "matthias.krueger@example-gmbh.local",
  });
  await knowledge({
    title: "Sicherungen der Kundendatenbank",
    content: "Die Kundendatenbank wird stündlich gesichert und die Rücksicherung einmal im Quartal geprüft. Ungeprüfte Sicherungen gelten als nicht vorhanden.",
    type: "RULE", scope: "TEAM", status: "APPROVED",
    branchId: platform.id, createdByEmail: "lukas.schneider@example-gmbh.local", approvedByEmail: "matthias.krueger@example-gmbh.local",
  });
  await knowledge({
    title: "Wie wir über Preise schreiben",
    content: "Preise stehen nur dann in einem Text, wenn sie auf der Preisseite genauso stehen. Abweichende Zahlen in Fallstudien haben schon zu Nachverhandlungen geführt.",
    type: "POLICY", scope: "DEPARTMENT", status: "APPROVED",
    branchId: content.id, createdByEmail: "marion.weber@example-gmbh.local", approvedByEmail: "michael.schaefer@example-gmbh.local",
  });
  await knowledge({
    title: "Entwurf: Fallstudie Nordwind Logistik",
    content: "Erster Entwurf. Zahlen noch nicht vom Kunden freigegeben, deshalb nicht nach außen verwenden.",
    type: "LESSON", scope: "PERSONAL", status: "DRAFT",
    branchId: personalByEmail.get("marion.weber@example-gmbh.local")!, createdByEmail: "marion.weber@example-gmbh.local",
  });
  await knowledge({
    title: "Probezeit und Rückmeldegespräche",
    content: "Rückmeldegespräche finden nach sechs Wochen und vor Ablauf der Probezeit statt. Das Ergebnis wird schriftlich festgehalten.",
    type: "PROCEDURE", scope: "DEPARTMENT", status: "APPROVED",
    branchId: people.id, createdByEmail: "petra.lange@example-gmbh.local", approvedByEmail: "andrea.koch@example-gmbh.local",
  });

  async function decision(input: { title: string; description: string; reason: string; department: string; createdByEmail: string; branchIds: string[]; status?: "ACTIVE" | "SUPERSEDED"; supersedesTitle?: string }) {
    const existing = await prisma.decision.findFirst({ where: { organizationId: organization.id, title: input.title } });
    if (existing) return existing;
    const supersedes = input.supersedesTitle
      ? await prisma.decision.findFirst({ where: { organizationId: organization.id, title: input.supersedesTitle } })
      : null;
    const created = await prisma.decision.create({
      data: {
        organizationId: organization.id,
        title: input.title,
        description: input.description,
        reason: input.reason,
        department: input.department,
        createdById: seededByEmail.get(input.createdByEmail)!,
        validFrom: new Date(),
        status: input.status ?? "ACTIVE",
        supersedesDecisionId: supersedes?.id,
      },
    });
    for (const branchId of input.branchIds) {
      await prisma.decisionBranch.create({ data: { decisionId: created.id, branchId } });
    }
    if (supersedes) await prisma.decision.update({ where: { id: supersedes.id }, data: { status: "SUPERSEDED" } });
    return created;
  }

  /* A decision and the decision that replaced it, because "what did we do
     before, and why did we stop" is the question the decision board exists for
     and the one an empty board cannot demonstrate. */
  await decision({
    title: "Support per Telefon nur werktags",
    description: "Telefonischer Support ist werktags von 8 bis 18 Uhr besetzt. Außerhalb dieser Zeiten greift die Mailbox.",
    reason: "Die Rufbereitschaft war bei der damaligen Teamgröße nicht besetzbar.",
    department: "Produkt & Technik", createdByEmail: "matthias.krueger@example-gmbh.local", branchIds: [tech.id, service.id],
  });
  await decision({
    title: "Rufbereitschaft für Störungen der Stufe 1",
    description: "Für Störungen der Stufe 1 gibt es eine Rufbereitschaft rund um die Uhr. Alle anderen Anliegen bleiben bei den Geschäftszeiten.",
    reason: "Zwei Ausfälle am Wochenende haben Kunden mehr gekostet als die Rufbereitschaft.",
    department: "Produkt & Technik", createdByEmail: "andrea.koch@example-gmbh.local", branchIds: [tech.id, service.id],
    supersedesTitle: "Support per Telefon nur werktags",
  });

  console.log(`Seeded ${organization.name}: ${demoEmail} / ${demoPassword}`);
  console.log(`  ${colleagues.length + 1} Personen, 7 Zweige, 5 Wissenseinheiten, 2 Entscheidungen (eine davon ersetzt).`);
}

main()
  .catch((error) => {
    /* A seed that fails must fail loudly. This used to end in .finally alone,
       so a broken run still exited 0 and CI called it green. */
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
