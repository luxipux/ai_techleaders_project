# Interview — solo developer, builder of this product (first user), 2026-11-27

Source: the participant's own account given in a discovery session (`om-discover --refresh`), written in Polish and summarised here in English. Role: working on a course project (AI Tech Leaders: Next.js + MikroORM), alone. The participant is also the product owner, so this is a direct experience of one person who is not independent of the product.

- Recent situation or task the person described: In November 2026, while working on pull requests in the course project, CI behaved differently from the local machine. CI had `NODE_ENV=test` set, which sent the build and tests down a different path than locally.
- What they did, step by step:
  1. Read the CI logs and compared them with what worked locally.
  2. Did not search Google or the documentation (answer: "nie").
  3. Asked Claude and another AI assistant. This is what led to understanding that `NODE_ENV=test` was the cause.
  4. Nobody could be asked live, because the project is a solo one.
- What worked, what did not, and any consequences they described: Reading the logs alone did not identify the cause. Asking an AI assistant did. The problem was resolved; PR merges were delayed. The participant recorded a lesson in `.ai/lessons.md` and added a check to the repo's `om-code-review` override, so review now checks it automatically.
- Other approaches they tried and how those worked: Log reading and comparison with local behaviour (did not find the cause by itself). Google and documentation: not tried.
- The outcome they were trying to achieve and what happened: Get CI to match local behaviour so the PRs could merge. Achieved; the cause was found in roughly tens of minutes ("kilkadziesiąt minut", counted from the first red CI to understanding the cause).
- Verbatim quotes worth keeping (mark each as quote):
  - quote: "kilkadziesiat minut" (time to understand the cause)
  - quote: "nie" (did not search Google or documentation)
- What they explicitly did not care about: not stated. The participant did not answer what exactly the AI assistant did that logs and search did not; the gap stays open.
- Interviewer's own remarks (kept separate from what was said):
  - Limits: one episode, one person, one project. The participant is a founder and the first user, so this does not show demand from people outside the founders' circle.
  - The account describes a blocker that an AI assistant solved in tens of minutes, without a paid human. It is evidence about one person's workaround, not about willingness to pay for a mentor session. It is consistent with the survey finding that 38 of 54 asked an AI.
  - The follow-up lesson is recorded in the repo (`.ai/lessons/2026-11-25-ci-tests-run-with-node-env-test.md`); the repo shows it was written, not how long the problem took.
  - Beliefs about other people were not stated in this session. Any later claim that other developers behave the same way is an assumption, not a finding from this interview.
