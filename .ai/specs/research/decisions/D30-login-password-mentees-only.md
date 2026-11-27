# D30 — Password sign-in for mentees only; mentor and operator roles require GitHub
- Date, owner: 2026-11-27, the product owner; proposed by the accounts-and-access design review
  (`.ai/specs/2026-11-27-accounts-and-access.md`, PR #30)
- Supersedes (partially): D07 / R06. Their wording, quoted verbatim from `product-brief.md` because
  `decisions/D07-login.md` is cited there but absent from the repository:
  - R06: "Sign-in with GitHub for every role; email plus password as the fallback."
  - D07: "Sign-in with GitHub for every role, email plus password as the fallback."

  GitHub sign-in for every role stays. Only the password fallback narrows.
- Decision:
  1. Mentor and operator roles require a verified email. In 1.0 only GitHub verifies one, so
     those roles require GitHub.
  2. Password sign-in is available only to password-only mentees.
  3. Any GitHub conversion or claim, including a mentee's, permanently removes the password and
     ends existing sessions. The warning is shown before OAuth starts.
- Why: the accounts-and-access spec's design answer Q4a (not a brief question id) gives 1.0 no
  email channel, so an email registered with a password is never verified and cannot be trusted.
  Without these rules, whoever registers a founder's or an invited mentor's email first would
  receive their role, and a password set by someone else would survive the real owner's GitHub
  sign-in.
- Review trigger: an email channel in 1.0 (for example the notifications in the brief's
  "Now, full 1.0" scope) removes the premise above and reopens D30, together with the spec's
  choice between Q4a (no email) and Q4b (email verification and password reset).
- Required path to change: a superseding record approved by the product owner.
- Status: active — approved by the product owner, 2026-11-27.
