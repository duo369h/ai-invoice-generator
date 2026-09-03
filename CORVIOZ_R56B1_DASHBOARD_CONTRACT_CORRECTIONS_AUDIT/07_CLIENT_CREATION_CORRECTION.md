# Client Creation Correction

The invalid Dashboard pre-save gates for `currentClientCount >= 0` and the unauthorized Pro one-client-to-Studio gate were removed. No replacement Client quota was introduced.

The `/api/clients` route no longer uses Portal/CRM entitlement as a precondition. Authentication, rate limiting, validation, ownership filters, and the existing database insert/update/delete paths remain intact.
