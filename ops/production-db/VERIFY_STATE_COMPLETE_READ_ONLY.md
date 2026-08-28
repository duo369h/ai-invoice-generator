# R28 strict STATE_COMPLETE read-only verifier

`VERIFY_STATE_COMPLETE_READ_ONLY.sh` is a separate completion verifier for a
database that has already reached the exact Corvioz `STATE_COMPLETE` history.
It is not a promotion or recovery command.

The verifier refuses every other state. It requires a clean release branch
whose HEAD descends from both the accepted product baseline and the R26
operations authority, then checks the reviewed 15-file bundle and executable hashes, connection identity,
the exact 17-version history, the frozen 8/8 semantic checks, and a
zero-pending dry-run. It creates only temporary R2/R3 no-op history markers for
the dry-run and removes them before exit.

The script has no mutation authorization inputs and contains no migration
apply or history-repair operation. It must be independently reviewed before a
separately authorized Production use.
