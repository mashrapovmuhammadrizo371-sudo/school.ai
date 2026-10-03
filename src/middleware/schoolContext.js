// Multi-school request context scaffold.
// It does not replace the current auth middleware yet.
function requireSchoolContext(req, res, next) {
  const schoolId = String(req.headers['x-school-id'] || req.auth?.schoolId || '').trim();
  if (!schoolId) return res.status(400).json({ error: 'School context required.' });
  req.schoolId = schoolId;
  next();
}
module.exports = { requireSchoolContext };
