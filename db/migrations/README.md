# Project ownership migration

New databases can use `npm run db:push` with the current schema. For databases
that already have `projects.userEmail`, migrate before deploying the updated
projects route. Do not rename the email column to `userId` or use `db:push` to
drop existing ownership data.

Back up the database and pause application traffic during the migration and
deployment. Prepare a mapping of every existing project ID to its verified Clerk
user ID using trusted ownership records. A current email match alone is not
sufficient: email addresses can change or be reassigned. Resolve missing or
ambiguous owners before proceeding.

Run the following in one PostgreSQL session, filling the temporary mapping table
with the verified project owners at the indicated point:

```sql
BEGIN;
LOCK TABLE projects IN ACCESS EXCLUSIVE MODE;

ALTER TABLE projects ADD COLUMN "userId" varchar;
CREATE TEMP TABLE project_owners (
  "projectId" varchar PRIMARY KEY,
  "userId" varchar NOT NULL CHECK (length(trim("userId")) > 0)
) ON COMMIT DROP;

-- Insert the verified (projectId, Clerk user ID) mappings into project_owners here.

UPDATE projects AS p
SET "userId" = owners."userId"
FROM project_owners AS owners
WHERE p."projectId" = owners."projectId";

-- This fails and aborts the transaction if any project is unmapped.
ALTER TABLE projects ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE projects DROP COLUMN "userEmail";
COMMIT;
```

If any statement fails, issue `ROLLBACK` and correct the mapping before retrying.
Deploy the new route before resuming traffic. Project ownership now follows the
Clerk user ID across email changes; project email has no separate contact purpose.
