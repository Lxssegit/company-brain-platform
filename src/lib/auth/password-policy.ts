/**
 * The password floor, in a module with no Node imports so a client component can
 * read it without dragging node:crypto into the browser bundle.
 *
 * It was repeated as 10 in the invitation form and its schema while the hash
 * function threw below 12, so an eleven-character password passed validation and
 * then produced a 500 for a person who had done nothing wrong. One number, one
 * place, read by the form, the schema and the hash alike.
 */
export const PASSWORD_MIN_LENGTH = 12;
