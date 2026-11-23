# Scene Snacks: An Improv Travel Game for the Whole Family. Research, Design and Product Spec (v0.9)

Build **Scene Snacks**, a cooperative, card-driven improv game made of bite-sized "snacks": one-minute warm-ups, three-card scene starters, mid-scene Twists and Spotlight speaking challenges. It should play the same way from a printed 108-card poker deck as it does in an offline Blazor WebAssembly PWA, and both should be generated from a single YAML content file. The design fills a real gap. Existing improv decks give you prompts but no game. Existing family party games are competitive, judge-based and table-bound. None of them is built for a seated, sometimes audio-only, mixed-age family where the youngest is 8 and the most important player is a teenager.

## TL;DR
- **The game:** The family plays cooperatively to "drive" a Route card toward a Destination, earning Miles by completing short improv challenges. Bonus Miles come from listening behaviors (callbacks, specific shout-outs), never from beating each other. Six card types (Warm-Up, Who, Where, Want, Twist, Spotlight) cover the classic improv warm-ups and the CROW scene structure (Character, Relationship, Objective, Where). Six modes span a 2-minute Pit Stop, a driver-safe Co-Pilot audio mode, quiet plane/restaurant play, solo practice and a public-speaking mode for teens and adults.
- **Why it's worth building:** A study of a school improv program (Felsman, Seifert & Himle, 2019) found that 43% of students who screened positive for social phobia in week 1 no longer screened positive by the program's final week. A later randomized study (Felsman, Gunawardena & Seifert, 2020) linked improv to gains in divergent thinking and uncertainty tolerance. The evidence on public speaking specifically is weaker and mixed, so the game should promise "practice and confidence," not clinical results.
- **How to build it:** Use .NET end to end. A Razor Class Library holds the shared UI. A Blazor WASM PWA, hosted free on Azure Static Web Apps, ships first. A .NET MAUI Blazor Hybrid shell follows for the app stores. A QuestPDF console tool turns the same YAML into print-ready PDFs and PNGs (2.75" × 3.75" with bleed) for The Game Crafter (about $9 for a 54-card proof deck) or MakePlayingCards. No accounts and no data collection, which keeps the kids' audience simple under COPPA.

---

## 1. Assumptions

- **Players:** 2–5, ages roughly 8 to adult. Teens are the key audience (Brendan's daughter is in high school). Brendan himself is joining an improv group to build public-speaking skills, so adult skill-building is a secondary goal.
- **Settings:** car rides (including a driver who must never look at a screen), airplanes and airport gates (seated, quiet, sometimes shared with strangers), restaurants (short waits, interruptions) and hotel rooms (where some movement is fine).
- **Reading level:** 8-year-olds must be able to play from audio or from an adult reading the card aloud. Every card has a short headline of 12 words or fewer.
- **Developer:** Brendan, a principal engineering manager who codes in .NET/C#. The architecture favors .NET and notes the trade-offs.
- **Commercial intent:** personal and family use first, with an option to sell later. Licensing and IP choices keep that door open.

---

## 2. Research Findings

### 2.1 Classic improv warm-ups: skills and travel suitability

Travel constraints: **Seated** (playable buckled in), **Audio** (playable with no visual or physical channel, so the driver can join), **Quiet** (playable at whisper or normal volume near strangers), **2p** (works with only 2 players).

| Warm-up / exercise | Core skill trained | Seated | Audio | Quiet | 2p | Verdict for travel |
|---|---|---|---|---|---|---|
| "Yes, And" (plan a trip/party, each line starts "Yes, and…") | Accepting and building on offers | ✅ | ✅ | ✅ | ✅ | **Core** |
| One-Word Story / Word at a Time | Listening, letting go of control | ✅ | ✅ | ✅ | ✅ | **Core** |
| Fortunately / Unfortunately | Building, reversals, story stakes | ✅ | ✅ | ✅ | ✅ | **Core** |
| Story Spine (Kenn Adams) | Narrative structure, cause and effect | ✅ | ✅ | ✅ | ✅ | **Core** |
| Questions Only | Listening, quick thinking, staying in scene | ✅ | ✅ | ✅ | ✅ | **Core** |
| Last Word Response | Active listening (must use partner's last word) | ✅ | ✅ | ✅ | ✅ | **Core** |
| Alphabet Scene | Thinking under constraint, staying in scene | ✅ | ✅ | ✅ | ✅ | **Core** |
| Ask the Expert / Three-Headed Expert | Confidence, commitment, group mind | ✅ | ✅ | ✅ | ✅ | **Core** |
| Three-Line Scenes | Establishing CROW fast, economy | ✅ | ✅ | ✅ | ✅ | **Core** |
| New Choice | Flexibility, not clinging to ideas | ✅ | ✅ | ✅ | ✅ | **Core** |
| Emotional Rollercoaster / Emotion Swap | Emotional commitment, vocal range | ✅ | ✅ | ⚠️ gets loud | ✅ | Core (volume rule) |
| Status games (Johnstone) | Status, character, body/voice awareness | ✅ (voice) | ⚠️ voice only | ✅ | ✅ | Core (voice version) |
| Typewriter / Narrator | Narrative control plus character voices | ✅ | ✅ | ✅ | ⚠️ better 3+ | Variant |
| Party Quirks (as "Hotel Check-In Quirks") | Character, endowment, guessing | ✅ | ✅ | ⚠️ | ❌ needs 3+ | Variant (3+) |
| Gibberish / Translator | Commitment, nonverbal meaning, listening | ✅ | ⚠️ gestures help | ❌ loud and silly | ✅ | Hotel/car only |
| Object work / "What are you doing?" | Physical specificity, mime | ⚠️ small | ❌ | ✅ | ✅ | Hotel only |
| Freeze / Freeze Tag | Physical initiation, justification | ❌ | ❌ | ❌ | ⚠️ | Excluded from travel modes |
| Zip Zap Zop | Energy, focus, eye contact | ⚠️ | ❌ needs pointing/eye contact | ⚠️ | ⚠️ | Hotel only |

**What this means:** about 12 of the 18 classics work fully seated, by voice only, at normal volume, with 2 players. Traveling families should get a verbal improv game, and the deck can ignore the physical warm-ups (Freeze, Zip Zap Zop, object work) everywhere except a hotel-room "Stretch" variant.

**Story Spine** deserves special mention. Improv teacher Kenn Adams created it in 1991.\[1\] Its eight sentence starters are "once upon a time, every day, but one day, because of that, because of that, because of that, until finally, and ever since then". In a June 2026 NPR interview Adams described how it reached Pixar's writers through an improv teacher.\[2\] It is the best single scaffold for turning loose family riffing into an actual story, and the spine is "just the start" of a story, not the whole story.\[1\]

**Status work** comes from Keith Johnstone's *Impro*. Johnstone treats status as something you *do*, not something you *have*: "You may be low in social status, but play high, and vice versa." Many of his status cues are physical (moving smoothly vs. jerkily, taking up space).\[3\]\[4\]\[5\] The game therefore uses voice-only versions of status play (pace, pitch, interrupting, apologizing), which keeps them seat- and car-friendly.

### 2.2 Scene-starter structures the cards should encode

- **CROW = Character, Relationship, Objective, Where.** CROW is "an acronym for the basic building blocks of any scene, and what the actors need to establish quickly so that the scene can be built upon and carried forward." Spolin-derived teaching calls the same idea "Who, What, Where."\[6\]\[7\] Scene Snacks splits CROW into three card types: **Who** (Character), **Want** (Relationship + Objective) and **Where**. A scene starter is a draw of one card of each.
- **Endowments:** giving your partner a trait ("Captain, your hands are shaking again"). These become Twist cards and the "Gift" mechanic.
- **First lines / initiations:** some Want cards include an optional first line for beginners and younger kids.
- **Emotions, genres and styles:** Twist cards (e.g., "Now it's a nature documentary," "Everyone is suddenly very sleepy").
- **Status:** a Twist sub-type (Status Flip) plus a Status Seesaw warm-up.

### 2.3 Benefits of improv: what the evidence supports

| Claim | Evidence | Strength |
|---|---|---|
| Improv reduces social anxiety in teens | Felsman, Seifert & Himle (2019), *The Arts in Psychotherapy* 63:111–117. The program was the Detroit Creativity Project's improv program for middle- and high-school students. Of 67 students who screened positive for social phobia on the Mini-SPIN in week 1, 29 no longer did by week 10. In the abstract's words: "43% of students who screened positive for social phobia at week 1 no longer screened positive in the final week of the program." | Moderate. Pre/post design, no control group. |
| Improv increases tolerance of uncertainty, divergent thinking and positive affect | Felsman, Gunawardena & Seifert (2020), *Thinking Skills and Creativity*. Two randomized experiments (n = 74 and n = 131) had participants do "20 min of improv exercises or a matched control condition including social interactions." | Moderate. Randomized, but short-term. |
| Improv helps adult mental health | Krueger, Murphy & Bink, "Thera-prov," *Journal of Mental Health* 28(6):621–626. Thirty-two adult psychiatric patients did four 2-hour improv sessions plus homework. Anxiety fell (t(31)=4.67, p<0.001), depression fell (t(31)=3.78, p=0.001) and self-esteem rose (t(31)=−3.31, p=0.002). The authors describe the effect sizes as "medium." | Preliminary. Small sample. |
| Improv improves public speaking | Jordi Casteleyn (University of Antwerp) studied secondary-school students. In *Research in Drama Education* 24(2):147–154 (2019) he reports that "a direct impact of the improv(isational) theatre training could not be detected" on public speaking stress, though effects might appear longer-term for certain students. A related quasi-experimental study with a control group (Casteleyn, 2019, *L1-Educational Studies in Language and Literature* 19(3)) found that "the intervention had a significant but modest effect" on public speaking competence. | Mixed or weak. |
| Applied improv improves communication skills | Fekete, Hainselin et al. ran medical-improv workshops for 24 Hungarian medical students and 26 French speech-therapy students (*European Psychiatry*, Aug 2024). They report that 80–87% of students felt their ability to communicate effectively improved, concluding that "students felt that it improved their communication." | Self-report only. |

**What this means for the product:** the honest pitch is that **improv games build comfort with uncertainty and confidence in social speaking, especially for teens, and they are fun.** Do not market the game as therapy or as a guaranteed public-speaking cure. For Brendan, the Spotlight mode is best positioned as *reps*: low-stakes, frequent, unscripted speaking practice that complements his improv class.

### 2.4 Competitive landscape

| Product | Format | Players / Age | Price (USD) | What works | What's missing for us |
|---|---|---|---|---|---|
| Rory's Story Cubes | 9 dice, magnetic box | 1–12, 6+ | $12.99–$14.99 | Very portable, no reading, marketed for travel and restaurants\[8\]\[9\] | Small loose dice; storytelling only, no scenes or improv skills |
| Once Upon a Time (3rd ed., Atlas) | 114 story + 51 ending cards | 2–6, 8+ | MSRP $27.95 | Collaborative fairy-tale storytelling\[10\] | Fairy-tale only; competitive interruption; needs a table |
| Snake Oil (Out of the Box) | Word + customer cards | 3–10, 10+ (Party Potion 8+) | ~$19.99 (Party Potion $14.99)\[11\]\[12\] | Pitching = improv persuasion; family-friendly | Judge picks a winner; 3+ players; reading required |
| Funemployed (IronWall / Mattel) | Job + qualification cards | 3–20, 13+ (some listings 16+/18+) | ~$16–40, often out of print | Pure improv pitching, very funny\[13\]\[14\] | Teen/adult content; competitive |
| Heads Up! (Warner Bros. app) | Phone app, tilt to guess | Group; app rated 13+ | $1.99 + in-app decks\[15\]\[16\] | Phone as a social tool; custom decks | Needs movement; IAP fatigue; not improv training |
| Highwire Deck (Highwire Improv) | Modular prompt deck | Improvisers | n/a | Locations, objects, relationships and emotions on each card\[17\] | A toolbox, not a game |
| Improv Against Normality | 505 cards, 5 decks (scenario, character, location, object, secret/want) | Families / groups\[18\]\[19\] | n/a | Proves the CROW-split deck structure works | Large; table-oriented; no travel or audio design |

**The gap:** no product combines (1) real improv *exercises* (not just nouns to riff on), (2) travel constraints (seated, audio-only, quiet, no loose pieces), (3) a cooperative structure that protects shy players, (4) explicit skill coaching that maps each card to an improv skill, and (5) one content source that drives both an app and a printable deck, with no in-app-purchase treadmill.

### 2.5 Design principles for travel and family games

1. **No loose bits.** Cards only. The Route card and completed cards *are* the score track; the app or any phone timer does timing.
2. **Short, pausable rounds.** Every challenge takes 30–120 seconds. A game can stop after any card ("Rest Stop") and resume, because state is just "the Mile pile."
3. **Scalable from 2 to 5.** Every Warm-Up card lists a 2-player rule.
4. **Driver-safe.** In Co-Pilot mode the driver participates by voice only. The app reads every card aloud, passengers handle the screen, and no card ever requires the driver to look, point or gesture.
5. **Low reading load.** Headline of 12 words or fewer, an icon per card type; an adult or the app reads aloud for pre-readers.
6. **Volume tags.** Every card is tagged `quiet`, `normal` or `loud`, so Plane/Restaurant mode filters out `loud`.
7. **Cooperative by default, no humiliation.** No judge, no voting off, no "worst" awards. Scoring rewards noticing others.
8. **Shy-player protection.** "Pass is free," "Wingman" (invite someone to perform with you), "Narrator" (narrate instead of performing) and "Navigator" (run the card and timer without performing).

### 2.6 Print-and-play and print-on-demand facts

- **Standard poker size:** 2.5" × 3.5" (63.5 × 88.9 mm, often shortened to "63 × 88 mm"). At 300 DPI the trimmed card is 750 × 1050 px.\[20\]
- **Bleed:** The Game Crafter and DriveThruCards use a 1/8" bleed on each side, giving 2.75" × 3.75", or 825 × 1125 px at 300 DPI. MakePlayingCards uses 36 px per side, giving 822 × 1122 px, with a safe area 36 px inside the trim.\[21\]\[22\]
- **DriveThruCards** wants "a PDF with one face per page, an eighth of an inch of bleed on a 2.75 by 3.75 inch page, CMYK, PDF/X-1a."\[23\]
- **Prices (early September 2026, before shipping):**
  - The Game Crafter: about $9 for a 54-card deck ($2.99 per 18-card sheet), falling to about $1.04 per sheet at 1,000 decks. No minimum. Its shop pays a 70% royalty on margin.\[23\]
  - MakePlayingCards: $16.95 for one deck, $8.55 each at 50, $2.95 at 1,000.\[23\]
  - PrintNinja: minimum 500 decks, about $5–7 per deck with a tuck box.\[23\]
  - TGC's blank poker tuck box (54 cards) is about $3.55. Its custom-printed tuck boxes come in 36, 54, 72, 90 and 108-card sizes.\[24\]\[25\]
- **Caveat:** TGC cards arrive in random order, and some users report uneven cuts. Order a proof first.\[23\]

---

## 3. The Game: Scene Snacks

**Working title:** *Scene Snacks*: "bite-sized improv for the road."
**Alternative names:** *Yes, And Away!*, *Plot Stop*, *Offer Up!*
**Name/IP check:** before any public release, search the USPTO trademark search, the app stores, BoardGameGeek and Amazon for each name. All card content here is original. Do not copy text from Funemployed, Snake Oil, Once Upon a Time or teacher prompt packs. Generic exercise names like "One-Word Story" and "Story Spine" are fine to use with attribution (credit Kenn Adams for the Story Spine).

### 3.1 Vision and goals

**Vision:** Turn dead travel time into the family's funniest memories while quietly building the improv muscles of listening, accepting, building, committing and speaking up.

**Goals:**
1. Fun first: every session produces at least one "say that again!" laugh.
2. Teach six named improv skills through play, without lectures.
3. Work identically on paper and in the app.
4. Be safe and welcoming for an 8-year-old, a skeptical teen and a nervous adult.
5. Give the adult or teen improviser real practice reps (Spotlight mode).

**Target audience:** families with kids 8+ (sweet spot: households with teens); secondary audiences are adult beginner improvisers, drama teachers and team-building facilitators.

**Non-goals:** a stage-performance tool for advanced troupes; physical or movement games in vehicles; online multiplayer or social network features; therapy or clinical claims; monetization through ads or kid-targeted in-app purchases.

### 3.2 Components (physical)

108 poker-size cards in one 108-card tuck box:

| Card type | Color / icon | Count | Role |
|---|---|---|---|
| **Warm-Up** | Orange / 🔥 | 22 | Rules for a mini-game (One-Word Story, Questions Only, etc.) |
| **Who** (Character) | Blue / 🎭 | 18 | C in CROW |
| **Where** | Green / 📍 | 18 | W in CROW (travel-flavored plus fantastical) |
| **Want** (Relationship + Objective) | Yellow / ⭐ | 18 | R + O in CROW, optional first line |
| **Twist** | Red / ⚡ | 16 | Mid-scene change: emotion, genre, status, endowment, callback |
| **Spotlight** | Purple / 🎤 | 10 | Solo 30–60 s speaking challenge |
| **Route** | Gray / 🗺️ | 3 | Destination and goal (Short Hop, Road Trip, Cross-Country) |
| **Reference** | White | 3 | Quick rules, skill glossary, safety tools |
| **Total** | | **108** | |

A **54-card "Carry-On" edition** halves each content type (11/9/9/9/8/5 plus 2 Route and 1 Reference = 54) for a cheaper first proof.

### 3.3 Roles

- **Navigator:** the person who draws and reads the card, runs the timer and calls "Scene!" The role rotates clockwise each round. *(Not "driver," to avoid confusion with the car's driver.)*
- **Performers:** whoever the card calls for. It's usually everyone except the Navigator, and in 2-player games the Navigator also performs.
- **The car's driver** can be a Performer in audio-safe cards only and is never the Navigator.

### 3.4 Setup (about 30 seconds)

1. Choose a **Route card** (Short Hop: 5 Miles in 5 rounds; Road Trip: 8 Miles in 7 rounds; Cross-Country: 12 Miles in 10 rounds).
2. Shuffle each card type into its own small stack, or for the simplest travel play keep two piles: **Warm-Ups** and **Scene** (Who/Where/Want shuffled together, drawn as one of each).
3. Optional filters: remove `loud` cards on planes, and remove ★★★ cards with young kids.

### 3.5 Round structure

Each round = one **Snack**:

1. **Draw.** The Navigator chooses (or rolls the app's die for) one of:
   - **Warm-Up Snack:** draw 1 Warm-Up card. Read the headline and rule.
   - **Scene Snack:** draw 1 Who, 1 Where, 1 Want. Assign Who cards to performers (the Navigator may draw extra Who cards so each performer has one).
   - **Spotlight Snack:** one volunteer draws a Spotlight card (never assigned).
2. **Offer the pass.** Anyone may say "Pass" (draw again, no penalty) or "Wingman" (bring a partner in).
3. **Play.** The default time is 90 seconds (Warm-Ups use the time on the card). Once per scene, the Navigator *may* draw a **Twist** at any point and read it aloud. Performers must incorporate it immediately.
4. **"Scene!"** The Navigator ends it on a laugh or a natural end, or at the timer.
5. **Shout-outs (15 seconds).** Any player names one *specific* thing someone else did well: "I loved when Mom said yes to the dragon's fear of heights and made it about her own fear." Vague praise ("that was good") doesn't count.
6. **Score Miles** (see 3.6). Completed cards go face-down beside the Route card. That pile is the score.

### 3.6 Scoring: cooperative (default)

| Event | Miles |
|---|---|
| Complete any Snack (didn't stop early) | +1 |
| A specific Shout-out that names a skill (the Reference card lists the 6 skills) | +1 (max 1 per round) |
| A **Callback**: someone brings back a character, line or object from an earlier Snack and the group recognizes it | +1 |
| Twist incorporated within 2 lines | +1 |
| Pass or Wingman | 0 (never negative) |

**Win:** reach the Route's Mile goal within its round limit and the family "Arrives." Flip the Route card to read the arrival celebration ("Everyone does a 5-second victory speech as their favorite character from today").
**If short:** "Scenic Detour." Play one bonus Spotlight Snack, with any volunteer, worth 2 Miles. No one is ever the reason the family lost.

**Why cooperative scoring teaches improv:** Miles come from *noticing others* (Shout-outs), *remembering* (Callbacks) and *adapting* (Twists). Those are exactly the listening and building behaviors improv teachers coach.

### 3.7 Variants

- **Gift Shop (light competitive, 3+ players):** after each Snack, each player hands the completed card to *someone else* for their best offer. Most cards at the end wins. You can never score yourself. Catch-up: the player with the fewest cards picks the next Snack type.
- **Pit Stop (2 minutes):** one Warm-Up card, no scoring. Ideal for a restaurant wait.
- **Co-Pilot (driver-safe audio):** only `audio`-tagged cards. The driver performs by voice; a passenger runs the phone. Twists are announced by the app's voice with a chime.
- **Quiet Cabin (planes, restaurants):** filters to `quiet` cards and adds a **Whisper rule**: all scenes are performed as if in a library, which ironically makes them funnier.
- **Hotel Stretch:** unlocks `physical` cards (object work, Freeze-lite, Zip Zap Zop) in the app, or a 9-card Stretch mini-pack in print (Phase 2).
- **Spotlight (public-speaking practice, teens and adults):** players take turns drawing Spotlight cards; listeners give "two stars and a wish" (two specific strengths, one suggestion). The app tracks streaks and offers a **Story Spine** timer overlay for structuring 60-second talks.
- **Solo Practice (app):** the app's TTS voice acts as scene partner for Last Word Response, Questions Only and Spotlight; the player speaks aloud (optional recording stays on-device).

### 3.8 Safety and inclusivity rules (printed on a Reference card)

- **Pass is free, always.** No explanation needed.
- **Wingman:** you can always bring a partner in.
- **Narrator option:** you can describe the scene instead of acting it.
- **"Rewind":** anyone can say "Rewind" to undo a line that felt unkind. No discussion, just a new choice.
- **No targeting:** characters can be silly; real people at the table (or strangers nearby) are never the joke.
- **Volume respect:** in public places, the `quiet` filter is on.
- **Accessibility:** colorblind-safe palette plus icons (never color alone); large-print PDF option; app supports screen readers, dynamic text size and captions for TTS; every card playable by voice only, and a "Spotlight via text" option covers players who are non-speaking or hard of hearing.

---

## 4. Mechanics → Skills Map

| Skill | Mechanic(s) that train it | How players experience it |
|---|---|---|
| **Listening** | Last Word Response, One-Word Story, Callback Miles, Shout-outs | You literally can't play without hearing the last line, and callbacks pay. |
| **Accepting offers** | "Yes, And" Warm-Ups, Twist cards (must incorporate), Rewind tool | Blocking a Twist costs the Mile; accepting is the easy path. |
| **Building ("and")** | Fortunately/Unfortunately, Story Spine, Want cards with objectives | Each line has to add something new. |
| **Specificity** | Who/Where cards with vivid details, Shout-outs must be specific | "A GPS with opinions," not "a robot"; praise must name the moment. |
| **Emotional commitment** | Emotional Road Trip, emotion Twists, Gibberish | Full commitment gets the laugh; half-commitment visibly doesn't. |
| **Status** | Status Seesaw Warm-Up, Status Flip Twist, Want cards with power gaps | Voice-based high/low status (pace, pauses, apologizing) per Johnstone.\[26\] |
| **Character** | Who cards, Hotel Check-In Quirks, Ask the Expert | Every scene starts from a specific point of view. |
| **Public speaking** (bonus) | Spotlight cards, Story Spine overlay, "two stars and a wish" | Frequent, short, low-stakes reps. |

---

## 5. Sample Cards (61 cards)

Tags: **Age** = minimum suggested age; **Diff** ★ easy, ★★ medium, ★★★ stretch; **Vol** Q = quiet, N = normal, L = loud; **Audio** ✅ = driver-safe.

### 5.1 Warm-Up cards (16 of 22)

| ID | Headline | Rule (short) | Age | Diff | Vol | Audio |
|---|---|---|---|---|---|---|
| WU-01 | **One Word at a Time** | Tell a story one word each, going around. Title: draw a Where card. End with "The… End." 2p: alternate. | 8 | ★ | Q | ✅ |
| WU-02 | **Fortunately / Unfortunately** | Alternate sentences starting "Fortunately…" and "Unfortunately…" Start: "Our luggage came back… alive." | 8 | ★ | N | ✅ |
| WU-03 | **Questions Only** | Talk only in questions. Answer with a statement or hesitate 3 seconds and you swap out. Setting: the airport security line. | 10 | ★★ | N | ✅ |
| WU-04 | **Last Word Launch** | Each line must start with the last word your partner said. 90 seconds. Topic: "Who ate the last pretzel?" | 10 | ★★ | Q | ✅ |
| WU-05 | **Alphabet Road** | Have a scene where each line starts with the next letter. Start at a random letter (app) or the first letter on the next sign. | 10 | ★★ | N | ✅ |
| WU-06 | **Story Spine Relay** | Each person takes the next spine line: Once upon a time… Every day… But one day… Because of that… Until finally… And ever since then… | 8 | ★ | Q | ✅ |
| WU-07 | **Three-Headed Expert** | 2–3 players are ONE expert, answering one word at a time. Others ask questions. Topic: Why socks disappear. | 8 | ★★ | N | ✅ |
| WU-08 | **Yes, And Vacation** | Plan the family's dream vacation. Every line starts "Yes, and…" Round 2 (optional): "Yes, but…" and notice how it dies. | 8 | ★ | N | ✅ |
| WU-09 | **Emotional Road Trip** | Two characters in a car. The Navigator calls a new emotion every 15 seconds; keep the scene going. | 10 | ★★ | L | ✅ |
| WU-10 | **New Choice!** | One player tells how they got here today. Anytime the Navigator says "New choice!" they replace their last sentence. | 10 | ★★ | N | ✅ |
| WU-11 | **Status Seesaw** | Gate agent and passenger. One starts very confident, the other very timid. By the end, swap. Voice only! | 13 | ★★★ | N | ✅ |
| WU-12 | **Hotel Check-In Quirks** | One player is the desk clerk. Each guest gets a secret Who card. Clerk guesses who they are from how they check in. (3+) | 10 | ★★ | N | ✅ |
| WU-13 | **Gibberish Tour Guide** | One player gives a tour in gibberish; another "translates." Switch halfway. | 8 | ★ | L | ✅ |
| WU-14 | **Three Lines, Go** | Pick one Who + Where + Want. In exactly three lines, make it clear who, where and what you want. | 13 | ★★★ | Q | ✅ |
| WU-15 | **The Narrator** | One player narrates ("Little did she know…"); the others voice the characters and must follow. Swap narrator. (3+) | 10 | ★★ | N | ✅ |
| WU-16 | **Whisper Heist** | Plan an elaborate heist of the dessert cart, entirely in whispers. Every line must add one detail. | 8 | ★ | Q | ✅ |

### 5.2 Who cards (Character), 10 of 18

| ID | Card text | Age | Diff | Vol |
|---|---|---|---|---|
| WHO-01 | A nervous dragon on its very first airplane flight | 8 | ★ | N |
| WHO-02 | A substitute Tooth Fairy who is terrible with names | 8 | ★ | Q |
| WHO-03 | The world's most polite pirate | 8 | ★ | N |
| WHO-04 | A GPS that has strong opinions about your life choices | 10 | ★★ | N |
| WHO-05 | A retired superhero who now works at a toll booth | 10 | ★★ | N |
| WHO-06 | A robot who is learning to tell jokes | 8 | ★ | Q |
| WHO-07 | A grandma who is (secretly) an international spy | 10 | ★★ | Q |
| WHO-08 | A golden retriever who was just elected mayor | 8 | ★ | N |
| WHO-09 | An extremely dramatic weather forecaster | 10 | ★★ | L |
| WHO-10 | A kid inventor whose inventions only half work | 8 | ★ | N |

### 5.3 Where cards, 8 of 18

| ID | Card text | Age | Diff | Vol |
|---|---|---|---|---|
| WHR-01 | The line for the airplane bathroom | 8 | ★ | Q |
| WHR-02 | The hotel ice machine at midnight | 8 | ★ | Q |
| WHR-03 | A gas station on the Moon | 8 | ★ | N |
| WHR-04 | The lost-and-found at a theme park | 8 | ★ | N |
| WHR-05 | Inside a giant's backpack | 8 | ★ | N |
| WHR-06 | A rest stop haunted by a very friendly ghost | 10 | ★★ | Q |
| WHR-07 | A restaurant where food is delivered by catapult | 8 | ★ | L |
| WHR-08 | A lighthouse with terrible Wi-Fi | 10 | ★★ | N |

### 5.4 Want cards (Relationship + Objective), 8 of 18

| ID | Relationship | Objective | Optional first line | Age | Diff |
|---|---|---|---|---|---|
| WNT-01 | Siblings | Agree on ONE souvenir with the last $5 | "Okay. We have five dollars and one chance." | 8 | ★ |
| WNT-02 | Coach and athlete | Convince them to try something they're scared of | "I believe in you, but also, please stop hiding." | 10 | ★★ |
| WNT-03 | Best friends | Confess you broke their favorite thing | "So… funny story about your trophy." | 10 | ★★ |
| WNT-04 | Boss and new employee | Get the day off for your llama's birthday | "Before you say no, look at this photo." | 8 | ★ |
| WNT-05 | Neighbors | Return a borrowed thing that is now enormous | "I'm returning your goldfish. There's been… growth." | 8 | ★ |
| WNT-06 | Teacher and student | Get out of homework with the wildest true-sounding excuse | "It started, as these things do, with a raccoon." | 10 | ★ |
| WNT-07 | Rival chefs forced to cook together | Win over the judge without helping your rival | "Don't touch my spatula." | 10 | ★★ |
| WNT-08 | Parent and kid | Swap roles for one day and enforce bedtime | "Young lady, it is WAY past my bedtime." | 8 | ★★ |

### 5.5 Twist cards, 10 of 16

| ID | Type | Card text | Age | Diff | Vol |
|---|---|---|---|---|---|
| TW-01 | Emotion | Everyone is suddenly very, very sleepy | 8 | ★ | Q |
| TW-02 | Genre | It's now a nature documentary. Someone narrates. | 10 | ★★ | Q |
| TW-03 | Style | Everyone now speaks in rhymes | 10 | ★★★ | N |
| TW-04 | Style | Opera! Sing your next three lines | 8 | ★ | L |
| TW-05 | Status | Status flip: the boss is now nervous, the nervous one is in charge | 13 | ★★★ | N |
| TW-06 | Endowment | One of you is secretly a time traveler. Reveal it NOW. | 10 | ★★ | N |
| TW-07 | Callback | Bring back a character from an earlier scene | 10 | ★★ | N |
| TW-08 | Volume | Whisper mode: the baby (or the pilot) is sleeping | 8 | ★ | Q |
| TW-09 | Emotion | Someone just received the best news of their life | 8 | ★ | N |
| TW-10 | Genre | Slow-motion action movie (voices only) | 8 | ★ | N |

### 5.6 Spotlight cards (public speaking), 9 of 10

| ID | Card text | Time | Age | Diff | Vol |
|---|---|---|---|---|---|
| SP-01 | Give a toast to the snack you're eating | 30 s | 8 | ★ | N |
| SP-02 | Elevator pitch: an invention made only of things in this car / room | 45 s | 10 | ★★ | N |
| SP-03 | Explain how to tie a shoe to an alien who has never seen feet | 45 s | 8 | ★ | N |
| SP-04 | Mini-TED talk: "Why naps are heroic" | 60 s | 13 | ★★ | N |
| SP-05 | Be the tour guide for whatever is outside the window right now | 45 s | 8 | ★ | Q |
| SP-06 | Convince the family to choose your restaurant: exactly three reasons | 60 s | 10 | ★★ | N |
| SP-07 | Accept an award for something tiny you did today | 30 s | 8 | ★ | N |
| SP-08 | Rant, then rave: 20 seconds against, then 20 seconds for, the same topic (e.g., airplane peanuts) | 40 s | 13 | ★★★ | N |
| SP-09 | Introduce the person on your left as if they're the keynote speaker | 45 s | 10 | ★★ | N |

*(Total sample cards: 16 + 10 + 8 + 8 + 10 + 9 = 61.)*

---

## 6. Card System Design

### 6.1 Taxonomy

`CardType` ∈ {WarmUp, Who, Where, Want, Twist, Spotlight, Route, Reference}
Twist subtypes: {Emotion, Genre, Style, Status, Endowment, Callback, Volume}
Skills: {Listening, Accepting, Building, Specificity, Emotion, Status, Character, PublicSpeaking}
Mode tags: {pitstop, roadtrip, copilot, quiet, hotel, spotlight, solo}

### 6.2 Schema (fields)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable, e.g., `WU-01`. Never reused; drives print order and local history |
| `type` / `subtype` | enum | See taxonomy; subtype for Twist only |
| `title` | string ≤ 24 chars | Headline on card |
| `text` | string ≤ 140 chars | Main prompt (≤ 12-word headline rule for Who/Where) |
| `rule`, `rule2p` | string? | Warm-Up rule body and 2-player adaptation |
| `relationship`, `objective`, `firstLine` | string? | Want cards |
| `durationSec` | int | Default 90 |
| `ageMin` | int | 8, 10, 13, 16 |
| `difficulty` | 1–3 | |
| `volume` | enum | quiet / normal / loud |
| `audioSafe`, `physical` | bool | Driver-safe; physical cards excluded from vehicle modes |
| `playersMin`, `playersMax` | int | |
| `modes`, `skills` | string[] | Mode and skill tags |
| `tts` | string? | Optional pronunciation-friendly override for speech |
| `icon` | string | SVG asset key |
| `coachTip` | string? | One-line "why this works," shown in app and on the Reference card |
| `editions` | string[] | `carry-on`, `full`, `stretch` |
| `locale`, `version` | string, int | `en-US` default; content versioning |

### 6.3 Content source (YAML, single source of truth)

```yaml
# content/cards.en-US.yaml
schemaVersion: 1
cards:
  - id: WU-04
    type: WarmUp
    title: Last Word Launch
    text: Each line must start with the last word your partner said.
    rule: Play for 90 seconds. Topic - "Who ate the last pretzel?"
    rule2p: Same rules; alternate lines.
    durationSec: 90
    ageMin: 10
    difficulty: 2
    volume: quiet
    audioSafe: true
    physical: false
    playersMin: 2
    playersMax: 5
    modes: [pitstop, roadtrip, copilot, quiet, solo]
    skills: [Listening, Building]
    icon: warmup
    coachTip: You can't plan ahead - you have to hear the last word first.
    editions: [carry-on, full]
  - id: WNT-05
    type: Want
    relationship: Neighbors
    objective: Return a borrowed thing that is now enormous
    firstLine: "I'm returning your goldfish. There's been... growth."
    ageMin: 8
    difficulty: 1
    volume: normal
    audioSafe: true
    modes: [roadtrip, copilot, hotel]
    skills: [Accepting, Specificity]
    icon: want
    editions: [full]
```

The build compiles YAML → validated `cards.json` (embedded in the app, cached by the service worker) → print PDFs/PNGs. A JSON Schema plus a C# validator enforce character limits, required fields per type, unique IDs and deck composition counts per edition.

### 6.4 Deck composition by edition

| Type | Carry-On (54) | Full (108) | Stretch add-on (18, Phase 2) |
|---|---|---|---|
| Warm-Up | 11 | 22 | 9 physical warm-ups |
| Who | 9 | 18 | — |
| Where | 9 | 18 | 9 hotel/outdoor Wheres |
| Want | 9 | 18 | — |
| Twist | 8 | 16 | — |
| Spotlight | 5 | 10 | — |
| Route | 2 | 3 | — |
| Reference | 1 | 3 | — |

---

## 7. Digital App Spec

### 7.1 Screens and flows

1. **Home:** big buttons for Pit Stop, Road Trip, Co-Pilot, Quiet Cabin, Spotlight, Solo Practice, plus Settings and History.
2. **Player Setup:** first names or emoji only (stored locally), age band per player to filter difficulty, optional "Driver" toggle (audio-only).
3. **Mode Select / Filters:** volume, difficulty, Route length, edition/custom decks.
4. **Round Play:** large card face (same art as print), "Read Aloud" (auto in Co-Pilot), Pass/Wingman/Twist buttons, circular timer with soft chime.
5. **Shout-out / Score:** quick taps (Completed, Skill shout-out, Callback, Twist landed); a Mile road graphic advances.
6. **Arrival / Summary:** Miles, a one-line favorite moment, "skills practiced" chips.
7. **History:** local list of trips; parent-initiated export as image or text (no server).
8. **Deck Editor:** create custom cards with the same schema ("inside jokes"); export YAML/JSON and print-and-play PDF.
9. **Settings:** TTS voice and rate, timer defaults, high-contrast theme, text size, Quiet default, parental lock for Deck Editor and sharing.

### 7.2 Co-Pilot (car) mode requirements

- Auto-advance flow; all prompts spoken via TTS; large "Next" and "Pass" targets for the passenger; screen dims to a minimal timer.
- Only `audioSafe` cards; no visual-only cues.
- A first-run notice: "The driver should never use the phone. A passenger operates the app."
- Optional voice commands ("next," "pass," "twist") are **off by default** (see 7.4).

### 7.3 Offline and storage

- Fully offline after first load (PWA service worker, cache-first).
- Local storage only (IndexedDB) for players, history and custom decks. No server database in the MVP.

### 7.4 Voice: text-to-speech and speech recognition

- **Text-to-speech (MVP):** the browser `speechSynthesis` API is supported across current Chrome, Edge, Firefox, Safari on macOS and Safari on iOS, per caniuse.\[27\] Use it for reading cards and Twists.
- **Speech recognition (optional, later):** support is patchy and has privacy implications:
  - Chrome: partial support. MDN notes that on some browsers "your audio is sent to a web service for recognition processing" unless the site requires on-device processing with `processLocally`. Chrome added on-device recognition in Chrome 139.\[28\]\[29\]
  - Safari (macOS/iOS): prefixed `webkitSpeechRecognition` powered by the Siri engine; requires Siri enabled and is "not available in SafariViewController and web apps added to Home Screen."\[30\]\[31\] That rules it out for an installed iOS PWA.
  - Firefox: disabled by default. Edge: caniuse lists it as not supported.\[32\]
- **Decision:** ship the MVP with no speech recognition. In Phase 2, add voice commands only (a few keywords, not transcription of kids' speech), using native on-device recognition through the MAUI app, or `processLocally = true` in Chrome. Recognition stays off by default and never records or uploads audio.

### 7.5 Kid-safety and privacy

- **No accounts, no personal info, no ads, no third-party analytics SDKs, no chat, no UGC sharing to other users.** Player names stay on the device.
- **COPPA awareness:** the amended FTC COPPA Rule took effect June 23, 2025, with a compliance date of April 22, 2026. It adds requirements such as separate parental consent before disclosing children's data to third parties and limits on retention.\[33\]\[34\] A mixed-audience family game that **collects no personal information** stays out of most of that burden. Any future telemetry must be anonymous and opt-in by a parent, and cloud speech must stay off for kids.
- **Sharing:** only parent-initiated export (image or text). Custom-deck import is file-based, with a parental lock.
- **Content safety:** all built-in content is rated for ages 8+ and reviewed by two adults plus one teen. Custom cards are never shared publicly in the MVP.

### 7.6 Accessibility

WCAG 2.2 AA targets: screen-reader labels, card text as real text, dynamic type up to 200%, color plus icon for every card type, reduced-motion mode, captions for spoken prompts, 48 px minimum touch targets.

---

## 8. Technical Architecture (.NET-first)

### 8.1 Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Domain / game engine | `SceneSnacks.Core` (.NET class library): card models, deck builder, filters, round state machine, scoring | Pure C#, 100% unit-testable, shared by web, native and print |
| Content | `content/*.yaml` → `SceneSnacks.ContentBuild` (console app using YamlDotNet + JSON Schema validation) → `cards.json` | One source of truth for app and print |
| UI | `SceneSnacks.UI` **Razor Class Library** (components, CSS, SVG icons) | Reused verbatim by web and MAUI. A shared Razor Class Library is the documented way to reuse components across Blazor Web and MAUI Hybrid apps\[35\] |
| Web / mobile web | **Blazor WebAssembly standalone, PWA template** | Standalone Blazor WASM can be "cached and executed offline as a Progressive Web App". Hosts as static files\[36\] |
| Native (Phase 2) | **.NET MAUI Blazor Hybrid** (BlazorWebView hosting the same RCL) | Razor components "run natively on the device" with access to native APIs (TTS, on-device speech, haptics, keep-awake) and app-store presence\[37\] |
| Print | `SceneSnacks.Print` console app using **QuestPDF** (+ SkiaSharp for PNG export) | Code-first, layout-precise PDF generation in C# |
| Storage | IndexedDB via a small JS interop wrapper (web); SQLite or files (MAUI) behind an `IStorage` interface | Offline, local-only |
| Speech | `ISpeech` interface: web = JS interop to `speechSynthesis`; MAUI = native TTS | Same game code, platform adapters |
| Tests | xUnit + bUnit (component tests) + Playwright (PWA offline smoke test) | |
| CI/CD | GitHub Actions: validate content → test → build PWA → render print PDFs as artifacts → deploy | Every content change regenerates app content and print files together |

### 8.2 PWA specifics

- The Blazor PWA template's published service worker resolves requests **cache-first**, and offline support is enabled **only when published**.\[38\] Test offline against a published build, not `dotnet run`.
- Updates: the new service worker activates after all app tabs close.\[38\] Add an in-app "Update available, tap to reload" banner.
- HTTPS is required for service workers. Both hosting options below provide it.
- **Trade-off:** Blazor WASM has a larger first download than a JS framework because it ships the .NET runtime. Mitigate with trimming, Brotli compression and lazy-loading the Deck Editor. Once cached, it doesn't matter offline.

### 8.3 Hosting

- **Azure Static Web Apps, Free plan (recommended):** $0, 100 GB bandwidth per month (per subscription), 2 custom domains with free SSL, about 250 MB max app size. Caveat: on the Free plan, once the quota is exceeded the site is not served. Standard is about $9 per app per month with $0.20/GB overage.\[39\] Fine for a family app; upgrade if it ever goes public at scale.
- **GitHub Pages (alternative):** free, simple; requires base-path configuration and an SPA 404 fallback for deep links.

### 8.4 Print pipeline (QuestPDF)

1. Load `cards.json` and filter by edition.
2. For each card, render a **front** and shared **back** at 2.75" × 3.75" (with 0.125" bleed), with a safe area 0.125" inside the trim (2.25" × 3.25" usable). Backgrounds extend to the bleed edge; text stays in the safe area.
3. Outputs:
   - `driveThru.pdf`: one face per page, 2.75" × 3.75" pages (DriveThruCards' spec). **Open issue:** DriveThru requires CMYK PDF/X-1a. QuestPDF output is RGB, so plan to convert with a prepress step (e.g., Ghostscript) or confirm the vendor's tolerance with a proof.
   - `tgc/*.png`: 825 × 1125 px PNG per face for The Game Crafter; `mpc/*.png`: 822 × 1122 px for MakePlayingCards.
   - `print-and-play-letter.pdf` and `-a4.pdf`: 9 cards per page (3 × 3) with crop marks and an optional duplex back sheet, for home printing on cardstock.
   - `proof-sheet.pdf`: all cards with trim, bleed and safe lines visible, for review.
4. **Licensing:** QuestPDF's Community License is free for individuals and organizations under USD 1M annual gross revenue. Note that QuestPDF now describes itself as "source-available commercial software," not OSI open source, though older materials call it "Community MIT."\[40\]\[41\] Brendan's personal project qualifies; re-check if a company ever publishes the game.

### 8.5 Alternatives considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| React/Svelte PWA + Capacitor | Smallest bundles, huge ecosystem | Leaves C#; print pipeline in a second language | Viable, but loses the single-language advantage |
| Uno Platform / Avalonia | C# across web and native | Smaller ecosystem for this use case; WASM web also heavy | Reasonable alternative if XAML is preferred |
| HTML-to-PDF (Playwright print) for cards | Reuses the app's CSS exactly | Less precise bleed control; color management issues | Fallback for print-and-play only |

---

## 9. Print Spec

| Item | Spec |
|---|---|
| Card size (trim) | 2.5" × 3.5" (63.5 × 88.9 mm), poker |
| File size with bleed | 2.75" × 3.75" (825 × 1125 px at 300 DPI) for TGC/DriveThru; 822 × 1122 px for MPC\[42\]\[43\] |
| Safe area | Keep text ≥ 0.125" (3 mm) inside trim → 2.25" × 3.25" live area. MPC's guideline: 36 px inside trim at 300 DPI\[22\] |
| Resolution | 300 DPI minimum; vector where possible |
| Stock | TGC standard 12 pt / 320 gsm black-core matte, or MPC S30/S33 smooth; linen optional for durability\[23\] |
| Fronts | Type color band + icon; headline 14–16 pt bold; body 10–11 pt; age/difficulty/volume/audio icons in a footer strip |
| Back | One shared back (logo, road motif). Type-colored backs are a Phase 2 option |
| Box | Poker tuck box: 108-card (Full) or 54-card (Carry-On) |
| Rules | Rules on 3 Reference cards; full rules PDF and QR code to the web app on the box |
| Vendors | **First proof:** The Game Crafter (~$9 per 54-card deck, plus box ~$3.55, plus shipping). **Small batch:** MakePlayingCards ($8.55/deck at 50). **Sell print-on-demand:** DriveThruCards or the TGC shop (70% of margin). **500+ run:** PrintNinja (~$5–7/deck incl. tuck)\[23\] |
| Estimated proof cost, Full 108 | TGC: 6 sheets × $2.99 ≈ $18 cards + tuck box + shipping, roughly $25–30 per proof (estimate; verify in vendor calculator) |

---

## 10. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Paper prototype (2 weeks)** | Home-printed print-and-play of the 61 sample cards; rules v0.9 | 3 family sessions in real travel (car, restaurant, plane or airport) |
| **1. MVP web app (6–8 weekends)** | Core engine, YAML pipeline, Pit Stop, Road Trip, Quiet, Co-Pilot (TTS), Spotlight; local history; PWA offline; Azure SWA Free; print-and-play PDF | Plays a full trip offline in airplane mode; zero network calls during play |
| **2. Print proof** | Full 108-card content; QuestPDF exports for TGC/MPC; order 1 proof deck | Proof legible in a moving car at arm's length; no clipped text |
| **3. Polish and custom decks** | Deck Editor, Hotel Stretch pack, type-colored backs, accessibility audit | Teen tester creates and prints a custom family deck unaided |
| **4. Native app** | MAUI Blazor Hybrid shell: native TTS, keep-screen-awake, haptics, optional on-device voice commands | Same RCL, under 10% platform-specific code |
| **5. Optional public release** | Name/trademark clearance, store listings, POD shop, privacy policy | See section 13 |

### 10.1 Success metrics (measured by playtest notes, not telemetry)

- **Fun:** at least 80% of sessions end with someone asking to play again; median session longer than 10 minutes in the car.
- **Inclusion:** every player performs at least once per session; passes stay under 20% of draws after the second session.
- **Skill signals:** Shout-outs become more specific over time; Callbacks appear by session 3.
- **Brendan's goal:** after four weeks, self-rated comfort with unscripted speaking (1–10) rises.

### 10.2 Playtest plan

1. **Kitchen table:** test rule clarity; time each card; mark confusing cards.
2. **Real trips:** one car ride (confirm the driver never needs the screen), one restaurant wait (Pit Stop), one flight or gate wait (Quiet Cabin).
3. **Outside families (3–5 households)** including an 8–9-year-old and a shy teen; observe without coaching and watch for anyone who goes silent.
4. **Improv group test:** play 10 minutes of Warm-Ups with Brendan's class as a fidelity check ("Does this train the real skill?").
5. **Capture:** a one-page sheet per session (cards played, passes, laughs, confusion points); iterate the YAML, then regenerate app and print together.

---

## 11. Open Questions

1. **Scoring feel:** is cooperative-only too gentle for teens? Test the Gift Shop variant early with the teen.
2. **Twist timing:** should the Navigator choose when to Twist, or should the app trigger it at random?
3. **Print backs:** one shared back or type-colored backs? Check vendor pricing for mixed backs.
4. **PDF/X-1a/CMYK:** does the QuestPDF → Ghostscript conversion produce acceptable color on a DriveThruCards proof?
5. **Name:** is "Scene Snacks" clear of conflicting trademarks and app names?

---

## 12. Recommendations: What to Do Next

1. **This week:** print the 61 sample cards on cardstock (3 × 3 per page) and play two Pit Stops and one Road Trip with the family. Keep the content in YAML from day one.
2. **Next month:** build the MVP Blazor WASM PWA with a shared Razor Class Library and deploy to Azure Static Web Apps Free. Prioritize Co-Pilot TTS, since car rides are the most common family travel moment.
3. **Then:** write the QuestPDF exporter and order one TGC proof (about $25–30). Hold off on native apps and speech recognition until the paper and web versions are proven fun.
4. **For Brendan's own goals:** use Spotlight plus Story Spine as daily 60-second reps, and bring the Warm-Up cards to the improv group as a fidelity check.

---

## 13. Monetization and Distribution (optional, if ever sold)

- **Model:** free web app with no ads or IAP, plus a paid physical deck (print-on-demand through TGC or DriveThruCards at 70% of margin). Avoid Heads Up!-style per-deck in-app purchases; its App Store reviews complain about locked decks, and kid-directed IAP adds regulatory and parental friction.\[15\]\[44\]
- **Price anchors:** comparable family storytelling and party card games retail around $13–28 (Story Cubes $12.99–14.99, Snake Oil ~$19.99, Once Upon a Time MSRP $27.95).\[8\]\[10\]\[45\] A 500-deck offset run at $5–7/deck enables an $18–20 retail price; POD alone pushes retail toward $25–30.
- **Channels:** TGC shop, DriveThruCards, Etsy (print-and-play PDF), drama teachers and improv theaters, Kickstarter for a first offset run.
- **IP:** clear the name; keep all card text original; credit traditional exercise origins (Kenn Adams' Story Spine, Keith Johnstone's status work) without reproducing copyrighted text; publish a privacy policy that says "we collect nothing."

---

## 14. Caveats

- Improv's psychological benefits are supported by small or pre/post studies plus a few short-term randomized experiments. Public-speaking benefits specifically are mixed.\[46\] Treat them as plausible, not proven.
- Vendor prices are from September 2026 listings and blog comparisons (one published by a TGC-partner tool, which may be biased). Verify in vendor calculators before ordering.
- Web speech-recognition support changes quickly; re-check caniuse and MDN before Phase 4.
- QuestPDF licensing terms have changed over time; re-read the license bundled with the version you ship.
- Some competitor ages and prices vary by edition and retailer (e.g., Funemployed is listed as 13+, 16+ and 18+ in different places).\[47\]\[48\]\[49\]

## Sources

1. [The Story Spine: Pixar's Template for Story Structure](https://www.worldbuilders.ai/p/the-story-spine)
2. [Meet the creator of the Story Spine, an 8-sentence tool to create and analyze stories : NPR](https://www.npr.org/2026/06/23/nx-s1-5750619/meet-the-creator-of-the-story-spine-an-8-sentence-tool-to-create-and-analyze-stories)
3. [Impro - by Keith Johnstone](https://fluidself.org/books/art/impro)
4. [Impro: Improvisation and the Theater by Keith Johnstone](https://blas.com/impro/)
5. [PEDABLOGUE - Impro II: Status](https://blogs.setonhill.edu/MikeArnzen/009704.html)
6. [Opinion: Improv Acting And Game Development](https://www.gamedeveloper.com/design/opinion-improv-acting-and-game-development)
7. [“C” is for “CROW”](https://improvdr.com/2021/05/17/c-is-for-crow/)
8. [Rory's Story Cubes - Creative Storytelling Dice Set for Kids](https://store.asmodee.com/products/rorys-story-cubes-box)
9. [Rory's Story Cubes — Gray Gauntlet Games](https://graygauntletgames.com/products/new-rorys-story-cubes)
10. [Atlas Games](https://www.atlas-games.com/product_tables/AG1030)
11. [Snake Oil Board Game By Out of the Box](https://www.ebay.com/itm/325582307349)
12. [Out of the Box Games, Snake Oil, a TOS Review](https://pebblekeeper.com/2014/11/12/out-of-the-box-games-snake-oil-a-tos-review/)
13. [Funemployed! Fan Site](https://www.ultraboardgames.com/funemployed/index.php)
14. [Funemployed Board Game Guide](https://www.allboardgames.com/games/funemployed)
15. [Heads Up! App - App Store](https://apps.apple.com/us/app/heads-up/id623592465)
16. [What is Heads Up? How to Play and Record Your Game](https://screenwiseapp.com/guides/heads-up-app)
17. [The Highwire Deck](https://highwiredeck.com/)
18. [Improv Scenario Card Games : Improv Against Normality](https://www.trendhunter.com/trends/improv-against-normality)
19. [Improv Against Normality - Julie Cotton](https://juliecotton.com/improv-against-normality/)
20. [MTG Card Size Guide: Trim, Bleed, and Safe Area - MTG Commander Proxies](https://commanderproxies.com/mtg-card-size-guide-trim-bleed-and-safe-area/)
21. [Image upload tips](https://www.makeplayingcards.com/pops/faq-photo.html)
22. [FAQ on digital photos, pixels and image file types](https://www.makeplayingcards.com/faq-photo.aspx)
23. [The Best Print-on-Demand Card Game Printers in 2026 (Compared)](https://shufflekit.com/blog/best-print-on-demand-card-game-printers)
24. [Blank Box, Tuck, Poker (54)](https://www.thegamecrafter.com/parts/blank-box-tuck-poker-54-)
25. [The Game Crafter News — These are Poker Tuck Boxes from The Game Crafter....](https://news.thegamecrafter.com/post/633419000104337408/these-are-poker-tuck-boxes-from-the-game-crafter)
26. [Impro by Keith Johnstone - Lawson Blake](https://lawsonblake.com/impro-keith-johnstone/)
27. [Speech Synthesis API](https://caniuse.com/speech-synthesis)
28. [SpeechRecognition - Web APIs | MDN](https://developer.mozilla.org/docs/Web/API/SpeechRecognition)
29. [New in Chrome 139 | Blog | Chrome for Developers](https://developer.chrome.com/blog/new-in-chrome-139)
30. [Speech Recognition API - Support Tables - W3cubDocs](https://docs.w3cub.com/browser_support_tables/speech-recognition.html)
31. [New WebKit Features in Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)
32. [Speech Recognition API | Can I use... Support tables for HTML5, CSS3, etc](https://caniuse.com/speech-recognition)
33. [FTC Publishes Updates to COPPA Rule](https://www.lw.com/admin/upload/SiteAttachments/FTC-Publishes-Updates-to-COPPA-Rule.pdf)
34. [COPPA Rule Amendments and Compliance Dates](https://www.privacylawnetwork.com/news/coppa-rule-2025-amendments.html)
35. [Using blazor.webview.js and blazor.web.js in same BlazorWebView Hybrid Unified app. · dotnet/maui · Discussion #29304 · GitHub](https://github.com/dotnet/maui/discussions/29304)
36. [ASP.NET Core Blazor](https://learn.microsoft.com/en-us/aspnet/core/blazor/?view=aspnetcore-10.0)
37. [ASP.NET Core Blazor Hybrid](https://learn.microsoft.com/vi-vn/aspnet/core/blazor/hybrid/?view=aspnetcore-8.0)
38. [ASP.NET Core Blazor Progressive Web Application (PWA)](https://learn.microsoft.com/en-us/aspnet/core/blazor/progressive-web-app/?view=aspnetcore-10.0)
39. [Azure Web Hosting Pricing 2026: Plans and Real Monthly Bills](https://cloudhostingpicks.com/blog/azure-web-hosting-pricing/)
40. [C# PDF Generation Library](https://www.questpdf.com/pricing.html)
41. [QuestPDF/QuestPDF](https://deepwiki.com/QuestPDF/QuestPDF)
42. [Playing Card Size: Poker, Bridge, Jumbo and Custom Sizes in Inches](https://www.mrplayingcard.com/blog/playing-card-sizes-complete-guide)
43. [Card Image Guidelines - Printiverse](https://printiverse.com/card-image-guidelines/)
44. [Heads Up! on the App Store](https://apps.apple.com/mn/app/heads-up/id623592465)
45. [TOS Review: Out of the Box Games: Snake Oil - Because I'm Me](https://www.becauseimme.net/2014/11/tos-review-out-of-box-games-snake-oil.html)
46. [Playing with improv(isational) theatre to battle public speaking stress: Research in Drama Education: The Journal of Applied Theatre and Performance: Vol 24 , No 2 - Get Access](https://doi.org/10.1080/13569783.2018.1552129)
47. [Funemployed Party Card Game (Iron Wall Urban Island Games)](https://www.ebay.com/itm/286278840672)
48. [Funemployed](https://www.boardgameatlas.com/game/voKGlqZsRo/funemployed)
49. [Funemployed: Rules and Gameplay Instructions](https://groupgames101.com/funemployed-rules/)
