# Synk

> **Founder's Note:** Synk is a deliberate learning experiment. It never launched, but it taught me how AI products fail in the real world — and how to design for those failures. That lesson is now part of how I think about every product I build.

AI-assisted browser tab and bookmark categorizer.

## What it does

Automatically categorizes and organizes browser tabs and bookmarks using AI, so knowledge workers spend less time managing their workspace and more time using it.

## Why I built it

I noticed my own tabs becoming unmanageable — 50+ open, no organization, lost context. If AI could understand *what* each tab was about, it could organize better than manual folders.

## The Pattern

Scattered tabs → Organized categories → Intelligent grouping

## Tech Stack

- **Browser Extension:** Chrome Extension API (Manifest V3)
- **AI Layer:** OpenAI Embeddings API (text → vector representation)
- **Categorization:** Embedding similarity + K-means clustering + rule-based fallback
- **Storage:** Chrome local storage (privacy-first, no server needed)

## How It Works

1. **Extract:** Reads tab titles, URLs, and page content
2. **Embed:** Converts text to vector using OpenAI embeddings
3. **Cluster:** Groups similar vectors using K-means clustering
4. **Label:** Generates human-readable category names
5. **Fallback:** For edge cases, uses domain-based rules

## What This Taught Me About AI Products

- **UX > model accuracy.** AI categorization is ~80% accurate. The experience for the remaining 20% matters more than squeezing out another point of accuracy.
- **Distribution beats algorithm.** Personal productivity AI is crowded. Differentiation comes from workflow integration, not sophistication of the clustering.
- **Design for the failures.** Browser extensions have strict constraints: permissions, performance, storage limits. AI must be lightweight and every wrong prediction needs a clear human override.

## What I Learned

- AI categorization is ~80% accurate. The UX for the remaining 20% matters more than the model.
- Browser extensions have unique constraints: permissions, performance, storage limits.
- Personal productivity AI is crowded. Differentiation is in workflow integration, not algorithm sophistication.

## Status

Experimental / MVP complete / Never published

## Why It Didn't Launch

I didn't publish it. Not because it didn't work, but because I didn't have a distribution plan. I built it, tested it on myself, and moved on. The lesson: build fast, but have a launch plan before you start.

## The Lesson Applied

The 80/20 rule of AI UX — design for the failures, not just the successes — is what I'm applying to my ERP work. When the AI layer comes to Okoh ERP, every "wrong" prediction will have a clear human override path.

## Looking Ahead

The same pattern — scattered information → organized categories → intelligent grouping — will reappear in the next phase of Okoh ERP: procurement documents, supplier quotes, and inventory signals organized and surfaced by AI.

---

*Built by Bamidele (Alphawga) Ajibola*  
*Lagos, Nigeria*
