# School.ai — Multi-School Architecture

This branch introduces the new structure without changing current production behavior.

## Target hierarchy

School.ai Platform
- Super Admin
- School A
  - School Admin
  - Director
  - Teachers
  - Students
  - Parents
- School B
  - School Admin
  - Director
  - Teachers
  - Students
  - Parents

## Rules

1. Every school has a unique code and slug.
2. School-owned records will carry a school context (schoolId).
3. A school must never read another school's data.
4. Platform-level management stays separate from school-level management.
5. Existing single-school functionality remains untouched until each module is migrated and tested.
6. Web, Android app, and Telegram use the same backend and school context.

## Migration order

1. Schools + memberships
2. Authentication and school selection
3. Students
4. Staff/teachers
5. Classes and subjects
6. Schedule
7. Attendance
8. Grades
9. Homework
10. Tests/results
11. Parent accounts
12. Notifications
13. Telegram + app school context
14. Super Admin multi-school dashboard
