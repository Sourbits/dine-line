Agent's commands failed because they ran from the wrong folder (nested dine-line). Fixed by opening the inner folder.
the AI caught a mismatch I missed, the browser and server rules were out of sync. I changed password length minimum to 10 on the backend but forgot to change it on the HTML.
The ai wrote the rule for password length in 3 different places, validation, register (js) and register (ejs). This isn't inheritely wrong, but is confusing code as rules should be written in only one place so theyre easier to edit later.

## Step 5 — Restaurant name → URL slug

**Prompt:** Build restaurant info editing on the dashboard, with a slug generated
automatically from the restaurant name (must be unique).

**What the AI produced:** A `slugify` function that removed accents, lowercased the
name, and replaced other characters with dashes (e.g. "Chez Alex Café!" → `chez-alex-cafe`).

**What was wrong:** Letters like "œ" and "æ" aren't accented letters, so they were treated
as "other characters." The name "Bœuf" became `b-uf` instead of `boeuf`.

**What changed and why:** The AI caught this in its own test and added a rule turning
œ → oe and æ → ae. Since Dine Line targets Montreal restaurants, French names are common,
so this mattered. Lesson: AI-written text handling needs testing with real local input,
not just simple English examples.

## Step 5 — Opening hours rule

**Prompt:** Validate opening hours: "closing after opening."

**What the AI produced:** A check that rejects any day where the closing time is not
later than the opening time.

**What was wrong:** It followed my rule too literally. A restaurant open 18:00–02:00
(closing after midnight) is rejected, even though that's realistic for restaurants
and bars.

**What changed and why:** For the milestone I kept the rule as-is and listed it as a known
limitation. The fix would be to treat a closing time earlier than the opening time as
the next day. Lesson: the AI does exactly what the prompt says, so a vague or
incomplete rule in my prompt became a limitation in the app.