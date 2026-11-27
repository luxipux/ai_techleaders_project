# Backlogs

## .ai/specs/product-brief.md
Backlog source: .ai/specs/product-brief.md
Last filed: 2026-11-27

| Id | Issue | Title | Epic | Depends on | Adopted |
|---|---|---|---|---|---|
| E01 | [#8](https://github.com/luxipux/ai_techleaders_project/issues/8) | Accounts and access | — | — | no |
| E01-S01 | [#13](https://github.com/luxipux/ai_techleaders_project/issues/13) | A user signs in with GitHub or with email and password | #8 | — | no |
| E01-S02 | [#14](https://github.com/luxipux/ai_techleaders_project/issues/14) | A user sees only what their role allows | #8 | E01-S01 #13 | no |
| E02 | [#9](https://github.com/luxipux/ai_techleaders_project/issues/9) | Bookable mentors | — | — | no |
| E02-S01 | [#15](https://github.com/luxipux/ai_techleaders_project/issues/15) | The operator invites mentors in batches of 20 | #9 | E01-S02 #14 | no |
| E02-S02 | [#16](https://github.com/luxipux/ai_techleaders_project/issues/16) | An invited mentor publishes a profile with public work | #9 | E02-S01 #15 | no |
| E02-S03 | [#17](https://github.com/luxipux/ai_techleaders_project/issues/17) | A mentor sets prices and publishes slots | #9 | E02-S02 #16 | no |
| E02-S04 | [#18](https://github.com/luxipux/ai_techleaders_project/issues/18) | A mentor completes Stripe Connect onboarding | #9 | E02-S02 #16 | no |
| E02-S04-T01 | [#28](https://github.com/luxipux/ai_techleaders_project/issues/28) | Stripe Connect integration | #18 (story) | — | no |
| E03 | [#10](https://github.com/luxipux/ai_techleaders_project/issues/10) | Finding, booking and paying | — | — | no |
| E03-S01 | [#19](https://github.com/luxipux/ai_techleaders_project/issues/19) | A mentee finds a mentor by stack list or share link | #10 | E02-S03 #17 | no |
| E03-S02 | [#20](https://github.com/luxipux/ai_techleaders_project/issues/20) | A mentee books a slot and pays | #10 | E03-S01 #19, E02-S04 #18 | no |
| E03-S03 | [#21](https://github.com/luxipux/ai_techleaders_project/issues/21) | A mentee or mentor cancels a booking | #10 | E03-S02 #20 | no |
| E03-S04 | [#22](https://github.com/luxipux/ai_techleaders_project/issues/22) | The platform takes its fee and pays the mentor out | #10 | E03-S02 #20, E02-S04 #18 | no |
| E04 | [#11](https://github.com/luxipux/ai_techleaders_project/issues/11) | Text session and written output | — | — | no |
| E04-S01 | [#23](https://github.com/luxipux/ai_techleaders_project/issues/23) | A text session inside DevMentor with a written answer | #11 | E03-S02 #20 | no |
| E04-S02 | [#24](https://github.com/luxipux/ai_techleaders_project/issues/24) | The mentor drafts a note and the mentee approves or declines | #11 | E04-S01 #23 | no |
| E05 | [#12](https://github.com/luxipux/ai_techleaders_project/issues/12) | Operator support | — | — | no |
| E05-S01 | [#25](https://github.com/luxipux/ai_techleaders_project/issues/25) | The operator sets bounds and fee and logs manual actions | #12 | E01-S02 #14 | no |
| E05-S02 | [#26](https://github.com/luxipux/ai_techleaders_project/issues/26) | The operator resolves a quality dispute | #12 | E03-S02 #20 | no |
| E05-S03 | [#27](https://github.com/luxipux/ai_techleaders_project/issues/27) | The product records the time from booking to session start | #12 | E03-S02 #20 | no |
| E06 | [#29](https://github.com/luxipux/ai_techleaders_project/issues/29) | Later | — | — | no |

The tracker is the authority. The brief's earlier references to #19 and #25 do not match this tracker: no earlier mapping existed, and all ids above are new.
