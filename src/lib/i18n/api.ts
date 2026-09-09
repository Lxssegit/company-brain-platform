/**
 * What an API refusal says to the person who caused it.
 *
 * These strings reach a screen: every client in this repository renders
 * `error` straight into a note. They were written in English while the product
 * speaks German, so a German form answered "Branch is outside the authorized
 * context". Keeping them in one place is also the only way they stay consistent
 * across twenty-odd routes.
 *
 * Wording rule: say what happened and, where there is one, what to do. Never
 * name a table, a column or an internal identifier — some of these are returned
 * to callers who are not signed in.
 */
export const API_ERROR = {
  organizationRequired: "Ihr Konto gehört zu keiner Organisation. Ohne die geht hier nichts.",
  notFound: "Das gibt es nicht, oder Sie dürfen es nicht sehen.",
  branchOutsideContext: "Dieser Zweig gehört nicht zu dem, was Sie verantworten.",
  sharedNeedsBranch: "Geteiltes Wissen braucht einen Zielzweig.",
  noPersonalBranch: "Ihnen ist noch kein persönlicher Zweig zugeordnet. Wenden Sie sich an die Verwaltung Ihrer Organisation.",
  personalStaysPersonal: "Persönliches Wissen liegt im persönlichen Zweig, nirgends sonst.",
  reviewNotFound: "Diese Freigabe gibt es nicht, oder sie gehört nicht zu Ihren Zweigen.",
  ownSubmission: "Über die eigene Einreichung entscheidet jemand anderes.",
  emailTaken: "Zu dieser E-Mail-Adresse gibt es schon ein Konto.",
  roleMissing: "Diese Rolle ist in Ihrer Organisation nicht eingerichtet.",
  parentBranchNotFound: "Den übergeordneten Zweig gibt es nicht, oder Sie verwalten ihn nicht.",
  validUntilBeforeFrom: "Das Ende liegt vor dem Anfang. So kann die Regel nie gelten.",
  branchNotFound: "Diesen Zweig gibt es nicht, oder Sie verwalten ihn nicht.",
  branchOrUserNotFound: "Zweig oder Person nicht gefunden.",
  branchNeedsParent: "Nur der Unternehmenszweig steht für sich. Alles andere hängt an einem übergeordneten Zweig.",
  companyRootUndeletable: "Der Unternehmenszweig ist die Wurzel des Baums. Er lässt sich nicht löschen.",
  unauthenticated: "Sie sind nicht angemeldet.",
  accountInactive: "Dieses Konto ist nicht aktiv.",
  alreadyInOrganization: "Ihr Konto gehört bereits zu einer Organisation.",
  forbidden: "Dafür fehlt Ihnen das Recht.",
  conflict: "Das steht im Widerspruch zu etwas, das schon da ist.",
  slugTaken: "Dieses Kürzel ist schon vergeben.",
  onlyActiveSupersedes: "Nur eine geltende Entscheidung lässt sich ablösen. Diese wurde bereits abgelöst.",
} as const;
