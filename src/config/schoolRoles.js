// School.ai multi-school role definitions.
// This module is intentionally isolated from the legacy single-school code.

const PLATFORM_ROLES = Object.freeze(['super-admin']);
const SCHOOL_ROLES = Object.freeze(['school-admin','director','teacher','student','parent']);

module.exports = { PLATFORM_ROLES, SCHOOL_ROLES };
