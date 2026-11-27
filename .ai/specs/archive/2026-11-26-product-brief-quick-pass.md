# DevMentor — product brief

- Date: 2026-11-26
- Mode: own; Owner: founder A (decider for scope, workshop 2026-08-26); Pass: Quick pass (one question round, inline review)
- Evidence basis: the research batch was assembled and handed over by the project's designer (stated by the session user; the RACI export lists UX/UI as founder A, so it was curated by someone close to the decision). Seven interviewees (four developers, three mentors; two came via friends of the founders, so independence from the founders' circle is unknown; all interviews, the Discord labels and the survey were produced by the founders, and the first two interviews carry no recruitment or interviewer note), one Discord export (109 threads, 14 days) and one survey (54 answers) from the same community, five benchmark checks dated 2026-09-04, a mentor list (50 ids, nobody contacted). Board exports are the founders' positions and count only as decisions. Most consequential untested belief: that people will actually pay for a first session (A02).
- Coverage: 43 claims — 36 sourced (interview 10, data 8, document 16, product 0, benchmark 2), 0 synthetic, 7 assumed; 1 entries on the collection plan
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: not yet signed (founder A is the decider; Q02, Q03 and Q07 are open); ready for: a named experiment (paid sessions, hand-brokered or the 25-hour MVP, Q08) once Q02, Q03 and Q07 are answered; not yet for implementation planning
- Sources: `research/` (interviews `*-interview-*.md`, `2026-08-26-workshop-export.md`, `2026-09-04-discord-help-requests.csv` with `2026-09-04-data-request-discord-help.md`, `2026-09-04-survey-discord-willingness-to-pay.md`, `2026-09-04-benchmark-*.md`, `2026-09-04-mentor-list.csv`, board exports `*-miro-board-*.md`), `research/decisions/` (N01, N02, D01, D02)

## Decision summary

Decided in this session: the 25-hour MVP is one paid, text-only, 25-minute session with prepayment and a quick refund (D01). The vault, the subscription and MCP access are hypotheses to test, not scope (N03, A04, A05).

The problem has data behind it in one community: in 14 days 21% of 109 help threads got no human reply and the median first reply took 67 minutes (Problems). Today people search, ask communities or ask an AI; 3 of 54 survey respondents have ever paid someone.

What could change the choice: nobody has yet paid for such a session (37 of 54 say they would; that is an intention, A02), and none of the 50 listed mentors has been invited (A01). The board's vault story has support from two mentors' own notes but none from mentees: 3 of 4 mentee interviewees did not want a subscription. A speed mismatch is also open: the developers asked for a reply within 20 minutes to the same day, while a booked session depends on mentors' availability (A03).

A scope question is open: both mentors who judged the idea object to being on a public list and want a personal link (Q07). Next action: invite the first mentors and take real paid bookings from people outside the founders' circle, by hand or through the MVP (Q08). Owners and dates are not set. The stop criteria are undecided (Q02, three candidates).

## Vision

- Intended direction (the team's, not a demonstrated benefit): mentors earn twice, once for the hour and again each time the knowledge from that hour helps someone else. `[DOCUMENT]` research/2026-09-02-miro-board-vision-target-needs.md
- For this MVP: a developer blocked on a specific problem gets a paid, text-only answer from someone who has done it. `[DOCUMENT]` D01

## Target group and stakeholders

- Customer (pays): the developer, the largest group pays from their own pocket: 24 of 54 survey answers (44%), versus 19 who would have their employer pay and 9 who would not pay. `[DATA]` research/2026-09-04-survey-discord-willingness-to-pay.md Q4
- Customer (pays): one platform developer at a large company would pay only through the employer. `[INTERVIEW]` research/2026-09-02-interview-platform-dev-solves-alone.md
- User (uses): working developers and freelancers who hit a specific blocker with nobody to ask. Employed 31 of 54, freelance 12. `[DATA]` survey Q7
- User (mentor): senior engineers who already answer the same questions unpaid from a private notes file. `[INTERVIEW]` research/2026-08-22-interview-mentor.md, research/2026-09-03-interview-senior-python-meetups.md
- Beachhead named by the founders: English-speaking TypeScript, React, Python and AI-agent developers. `[DOCUMENT]` research/2026-09-02-miro-board-vision-target-needs.md
- Five of the seven interview transcripts are in Polish, against the English-speaking beachhead (Q05). `[INTERVIEW]` the 09-01 to 09-03 notes in research/
- Decider for scope: founder A; founder B is tech lead. QA and legal have nobody assigned yet. `[DOCUMENT]` research/2026-08-26-workshop-export.md, research/2026-09-05-miro-board-raci-matrix.md

## Problems, with evidence

- In 14 days, 109 help threads in one 4,000-member Discord: 23 got no human reply; of 86 answered, the median first reply took 67 minutes (the analyst's note says 68; recomputed 67). 35 threads ended resolved and 20 partially. One community, two weeks, labels by one person. `[DATA]` research/2026-09-04-discord-help-requests.csv
- Of the 31 threads that signalled urgency ("release tomorrow", "prod is down"), 9 got no reply and 8 ended resolved (our count, not in the analyst's note). `[DATA]` research/2026-09-04-discord-help-requests.csv
- 30 of 54 respondents were stuck with nobody to ask this week or this month. What they did: searched 49, asked an AI 38, asked a community 31, shipped a workaround 20, paid someone 3. Self-selected, five days. `[DATA]` research/2026-09-04-survey-discord-willingness-to-pay.md Q1–Q2
- Willingness to pay for an answer "within an hour, over text": 17 would pay nothing, 14 up to 25 EUR (31 of 54 at or below 25 EUR), 12 25–50, 8 50–100, 3 over 100. The question names text and one hour, so it primes both. `[DATA]` research/2026-09-04-survey-discord-willingness-to-pay.md Q3
- Text or call: 33 text, 9 call, 12 "depends" (21 of 54 did not choose text); the freelancer wants a call for estimates. `[DATA]` research/2026-09-04-survey-discord-willingness-to-pay.md Q5
- A TypeScript generics error before a release cost half a day, with contradictory answers from a Discord. `[INTERVIEW]` research/2026-08-20-interview-working-dev.md
- A Helm upgrade on a Friday evening slipped a release by a day; a Discord answer arrived on Saturday and was wrong. A single episode, frequency unknown. `[INTERVIEW]` research/2026-09-01-interview-backend-dev-fintech.md
- Not asked: whether the backend developer would paste production YAML to a stranger. `[INTERVIEW]` research/2026-09-01-interview-backend-dev-fintech.md
- A freelancer under-quoted a migration and lost about a week of their own time after reading and asking a Discord. `[INTERVIEW]` research/2026-09-02-interview-freelancer-react.md
- Counter-case: a platform developer at a 200-person company solved a half-day problem alone and would pay only for a rare one-off, expensed. `[INTERVIEW]` research/2026-09-02-interview-platform-dev-solves-alone.md
- A Python speaker answers the same three questions every week, unpaid, from a private doc: "ten minutes each, most evenings". `[INTERVIEW]` research/2026-09-03-interview-senior-python-meetups.md
- Interpretation, not observed: a paid text answer in about 25 minutes would resolve such blockers (A03).

## Product and how it stands out

- What it is: a marketplace where a developer books and prepays a 25-minute text session with a senior engineer (D01, Scope). `[DOCUMENT]` D01
- Codementor already sells paid on-demand help and Topmate sells priority DMs. `[BENCHMARK]` research/2026-09-04-benchmark-codementor.md, research/2026-09-04-benchmark-topmate.md
- What would make the MVP different: text-only, prepayment and public-work trust (D02); not shown by the benchmarks. `[ASSUMPTION]` the team's belief
- Ratings carry no information on Codementor: ten of ten cards show 5.0, which matches what two interviewees said. `[BENCHMARK]` research/2026-09-04-benchmark-codementor.md

| reference | what it does well | where it falls short for our users | checked on | link |
|---|---|---|---|---|
| Codementor | request-to-session is the whole product; rates shown ($15–$80 per 15 min) | live sessions; nothing is kept after a session | 2026-09-04 | https://www.codementor.io/ |
| MentorCruise | free intro call; named mentors | monthly commitment, refused by one interviewee | 2026-09-04 | https://mentorcruise.com/ |
| Topmate | expert owns page, price, audience; 10% / 20% commission | any profession; no way to find an expert you do not already follow | 2026-09-04 | https://topmate.io/ |
| Preply | trial then subscription; 12-hour free cancellation | recurring lessons, not one-off blockers | 2026-09-04 | https://preply.com/en/how-it-works |

## Goals and success criteria

- Business goal: none chosen for this decision. The board's goals (100 mentors with vaults, 30% on a subscription) assume the vault, which is out of the MVP (N03). `[DOCUMENT]` research/2026-09-02-miro-board-product-goals.md
- User outcome: the blocker is resolved within the hour, over text. A hypothesis from interviews (A03). `[ASSUMPTION]` research/2026-08-20-interview-working-dev.md
- Primary metric, baseline, threshold, date: unknown. Candidates are in Q02; thresholds are not invented.
- Build constraints: 25 hours, Stripe as the only payment provider, no video. `[DOCUMENT]` research/2026-08-26-workshop-export.md
- Limits from single interviewees, not requirements: booking over five minutes or creating an account first (backend developer); mentor setup over twenty minutes, bank details before a first booking, and not seeing the question first (Python speaker). `[INTERVIEW]` research/2026-09-01-interview-backend-dev-fintech.md, research/2026-09-03-interview-senior-python-meetups.md

## Scope

- **Now:** a developer reaches a mentor (entry shape open, Q07), sees their public work (D02) and the price, prepays and has a 25-minute text session; a refund follows quickly when the session does not happen (D01, R01–R03, N01–N03). It is a proposed experiment, not a shippable promise.
- **Later:** 50-minute sessions (R01), the vault, subscriptions and MCP (A04, A05), mentee-approved publication of notes (R02), anything else on the board.
- **Not doing:** see Non-goals.

## Domain glossary

| Term | Meaning | Owned by | Visible to |
|---|---|---|---|
| Session | one prepaid 25-minute text exchange between a developer and a mentor | founder A | both |
| Public work link | the link on a mentor page that replaces ratings (D02) | the mentor | all visitors |
| Vault | a mentor's notes sold to others; hypothesis only, not in the MVP | the mentor | not applicable yet |

## Key flows

- Current state: stuck on a blocker, the developer searches, asks a community and often an AI, or ships a workaround; paying someone is rare. `[DATA]` research/2026-09-04-survey-discord-willingness-to-pay.md
- Future state (MVP): choose a mentor by public work, see the price, prepay, have the text session, get a refund if it does not happen. Details beyond D01 and R01–R03 are for the specification. `[DOCUMENT]` D01

## Business rules

| Id | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
|---|---|---|---|---|---|---|---|---|
| R01 | Sessions are 25 or 50 minutes; the MVP offers 25 only | sessions | `[DOCUMENT]` research/2026-08-26-workshop-export.md, D01 | active | after the first test result | superseding row by founder A | founder A | none |
| R02 | Nothing from a session is published without the mentee's approval | session notes | `[DOCUMENT]` research/2026-08-26-workshop-export.md | active | unknown | superseding row by both founders | both founders | none |
| R03 | The mentee prepays before the session; a session that does not happen is refunded quickly (deadline in Q03) | payments | `[DOCUMENT]` D01 | active | after the first test result | superseding row by founder A | founder A | none |

## Non-goals

| Id | We are not building | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|
| N01 | Video calls | sessions are text; 33 of 54 survey answers chose text, 21 did not (Q5) | founder A | active | unknown | superseding record by founder A | `[DOCUMENT]` research/decisions/N01-no-video.md | none |
| N02 | Ratings or a reviews profile | a link to public work replaces them (D02) | founder A | active | unknown | superseding record by founder A | `[DOCUMENT]` research/decisions/N02-no-ratings.md | none |
| N03 | Vault, subscription and MCP access in the MVP | no mentee-side evidence of demand; kept as hypotheses | founder A | active | when the first test result is in; date unknown | superseding row by founder A | `[DOCUMENT]` research/decisions/D01-mvp-scope.md | none |

## Decisions

| Id | Date | Decision | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D01 | 2026-11-26 | MVP = one paid, text-only, 25-minute session with prepayment and a quick refund | the evidence supports a fast paid text answer; the vault has no mentee-side support. Alternative considered: vault in the MVP. The agent proposed the limit and the session user accepted it | founder A | active | after the first test result | superseding row by founder A | `[DOCUMENT]` research/decisions/D01-mvp-scope.md | none |
| D02 | 2026-11-26 | Board lines needing ratings, reviews or video are rejected; public work is the trust signal | applies N01 and N02; 41 of 54 survey answers chose "what they have built" and only 12 chose ratings | founder A | active | unknown | superseding row by founder A | `[DOCUMENT]` research/decisions/D02-board-items-superseded-by-n01-n02.md | none |

## Riskiest assumptions

| Id | Assumption | Importance | Evidence today | If false | Smallest test | Owner | By when | Result |
|---|---|---|---|---|---|---|---|---|
| A01 | Enough senior engineers will join (`[ASSUMPTION]` the team's belief) | high | two conditional answers (Python speaker; staff engineer: "może"), the first mentor was not asked whether they would join; 0 of 50 contacted | no supply, no product | invite the 50 (29 with a warm contact) and count mentors who publish availability and answer a booked session, not who says yes (the staff engineer: "zapomnę, że to istnieje") | founders | unknown | untested |
| A02 | Developers will pay for a first session (`[ASSUMPTION]` the team's belief) | high | 37 of 54 say they would, but 31 of 54 name 25 EUR or less; 3 ever paid; interviews: one "chyba sam", one under 200 zł, one only via employer | no revenue; reconsider the product | real prepaid bookings by people outside the founders' circle | founders | unknown | untested |
| A03 | A booked 25-minute text exchange resolves the blocker fast enough (`[ASSUMPTION]` no material) | high | nobody has had it; the backend developer wants a reply within 20 minutes, the freelancer the same day; the two mentors who named a pace answer between meetings | the session is the wrong product or needs near-term availability | a few paid sessions brokered by hand for people from the Discord, not from the founders' circle; measure minutes from request to answer and ask whether it was solved | founder A | unknown | untested |
| A04 | Mentees would pay for a vault or subscription (`[ASSUMPTION]` the board) | medium | none for; against: 3 of 4 mentee interviews | vault stays out | after the MVP, whether paying mentees return or ask to keep the exchange (saved notes are not in the MVP, N03) | founder A | after MVP | untested |
| A05 | Mentors would sell their notes (`[ASSUMPTION]` the board) | medium | two mentors call their notes the value; none said they would sell them; the staff engineer declined a monthly relationship | vault loses its supply side | ask the first mentors after their first session; stated intention only until one shares a note (R02) | founder B | after MVP | untested |

D01 proceeds with A01–A03 untested; the user chose to run the MVP as the test. That is permission to take the risk, not evidence that they hold.

## Kill criteria

Undecided (Q02). The test is whether supply and payment appear, so the criteria should be observed outcomes rather than stated intentions.

## Hypotheses to test

None. No synthetic walkthrough was run; a panel would add only `[SYNTHETIC]` hypotheses, which cannot answer A01–A03.

## Open questions

| Id | Question | Blocking | Who can answer | Status |
|---|---|---|---|---|
| Q01 | Does a vault answer cite the mentor and the note? | no for the MVP; yes for any vault experiment (A04, A05) | founder B | open |
| Q02 | What result stops or changes the MVP? Candidates: (a) how many of the 50 mentors agree to join, (b) how many people outside the founders' circle pay for a first session, (c) how many paid sessions end with the mentee saying the blocker was solved. No thresholds yet | yes: without it the test cannot be read | founder A | open |
| Q03 | Refund and cancellation terms: how quickly a refund follows, what happens on a mentee no-show (one freelancer wants a same-day refund; one mentor wants to keep the fee) | yes: blocks payment implementation | founder A | open |
| Q04 | Is the price set per mentor or per platform, and at what level? Mentor rates were not obtained from two of three mentors | no | founder A | open |
| Q05 | Is the first market English-speaking or does it include Poland? | no; affects invitation text and product language | founder A | open |
| Q06 | Who owns the terms of service for both roles? RACI has legal as A, R with nobody assigned | yes before launch, not before build | founder A | open |
| Q07 | Entry shape: a public list of mentors, or each mentor's own share link? The staff engineer wants a link as the only door ("nie wsadzajcie mnie na listę…"), the Python speaker joins only if the others are people they know; the board assumes a marketplace search | yes: decides what Now builds | founder A | open |
| Q08 | Run hand-brokered paid sessions (A02, A03) before the 25-hour build, or build first? The cheapest test of A03 does not need the build | no | founder A | open |

## Definition of Ready addendum (own)

- Problems and Target group have support from interviews and data (Problems, Target group); the data comes from one community and the interviews from seven people, so this supports an experiment, not a market size.
- Open before the experiment can be read or built: Q02 (stop criteria), Q03 (refund terms) and Q07 (entry shape).
- Material assumptions: A01–A03 untested, risk accepted in D01 as the way to test them. This does not replace evidence that people pay.
- Ready for: a named experiment, hand-brokered paid sessions or the 25-hour MVP (Q08), after Q02, Q03 and Q07. Not ready for implementation planning.

## Collection plan

### What do mentors charge and how many hours a week would they give?

- What decision or work needs it: Q04 (price) and the supply estimate behind A01
- Who can answer it: the three interviewed mentors and the first invited mentors
- How: a short interview during the invitation, captured with the interview-note template
- Owner and by when: unknown
- Template: `research/templates/interview-note.md`
