# The product owner approves product decisions, not the brief's owner column

## Context
Superseding R06/D07 for the accounts-and-access spec. The product brief named "founder A
(Oliwia)" as owner and change path, so D30 was written as waiting for her signature and Phase 2
was blocked on it. The user corrected this: Oliwia only provided input materials; the user is
the product owner and approves decisions.

## Finding
Owner and "required path to change" columns in `product-brief.md` came from the supplied
research material. They describe who wrote the sources, not who decides on this project.

## Lesson / How to apply
- Product decisions and superseding records (`.ai/specs/research/decisions/`) are approved by
  the product owner (the user). Don't block work on a person named in the brief's owner column.
- When a brief's change path names someone else, ask the user who approves before recording a
  decision as pending that person.
- Write the approver into the record itself: "approved by the product owner, <date>".

Related: [run journal](../runs/2026-11-27-accounts-and-access.md),
[D30](../specs/research/decisions/D30-login-password-mentees-only.md)
