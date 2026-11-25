# Writing PDFs for the Document Reader

The **Document Reader** (Exam Solver → **Load PDF**) does not show your PDF page by page. It reads the text and its layout, then rebuilds the document as:

- **Topics**: one per main heading, listed in the left sidebar
- **Cards**: one per sub-heading inside a topic, with quick-jump chips at the top
- **Paragraphs, lists, tables and Q&A blocks** inside each card

It works this out from font sizes, bold and monospace fonts, spacing and column positions. A PDF written with the rules below opens cleanly. A PDF that ignores them still opens, but topics can be missing or merged, and tables can turn into plain lines.

> **Quickest route:** write the document in Word, Google Docs or LibreOffice using the built-in styles (Title, Heading 1, Heading 2, Normal, real lists and real tables), then export it as a PDF. See [Recommended setup](#recommended-setup).

---

## 1. The PDF must contain real text

- The reader only uses the PDF's **text layer**. **Scanned pages, photos and screenshots of text are not read**: there is no OCR. If you can't select the text with your mouse in a normal PDF viewer, the reader can't see it either.
- Images, charts and drawings are skipped.
- Export with **Save as PDF** / **Download → PDF**. Don't use "print to image" or "flatten" options.
- The size limit is **100 MB**.

## 2. Body text: one size, used everywhere

The reader takes the size that carries the most text as the **body size**, and sizes everything else against it.

- Use **one font size for all normal text** (for example 11 pt).
- Don't make callouts, quotes or notes much bigger than body text. Anything **25% or more larger than body text counts as a heading**.
- Small print (footnotes, captions) is fine. Text below 70% of body size in the page margins is dropped.

## 3. Headings → topics

| What you write                                           | What the reader does                                                 |
| :------------------------------------------------------- | :------------------------------------------------------------------- |
| A **single largest heading** at the very top             | Becomes the **document title** (shown in the top bar)                |
| Headings that share one size, **used two or more times** | Each becomes a **topic** in the sidebar (the largest such size wins) |
| Smaller headings inside a topic                          | Become **sub-headings** (cards) within that topic                    |
| Text before the first topic heading                      | Goes into an **Overview** topic                                      |

Rules of thumb:

- Make every topic heading the **same font size**, at least **1.25 × body size** (for example Heading 1 at 16 pt with 11 pt body text).
- Keep heading levels consistent: don't mix 16 pt and 18 pt for headings at the same level.
- A heading that wraps onto two lines is fine, as long as both lines are the same size and close together.
- Leave a little space between the heading and the text below it.

**Optional extras in topic titles:**

- Start a title with `Chapter`, `Part`, `Section`, `Unit`, `Module` or `Block` plus a number or letter, for example `Chapter 3: Sorting`. The reader shows `Chapter 3` as a small tag and `Sorting` as the title.
- End a title with a page or line range in brackets, for example `Sorting (pages 12–18)`, to show it as a badge.

## 4. Sub-headings → cards

There are two ways to make a sub-heading, and both start a new card:

1. **A short line that is entirely bold**, at body size (up to about 90 characters), on its own line.
2. **A bold label at the start of a paragraph**, ending in a colon or full stop and up to 7 words long:

    > **What it does:** Sorts the list in place and returns nothing.

    This becomes a card titled _What it does_ holding the rest of the paragraph.

Avoid:

- **Whole bold sentences or bold paragraphs.** A short line that is all bold becomes a sub-heading.
- Bold labels longer than 7 words: they stay as normal bold text.

A sub-heading named **What to say** gets a highlighted card, which is handy for interview or presentation notes.

## 5. Bold, italic and code

- Use a **real bold font** (the Bold button in your editor does this). "Fake bold" made from outlines or thicker strokes is not detected.
- For inline code and code blocks, use a **monospace font** such as Consolas, Courier New, Cascadia Code or any font with "Mono" in its name. It is shown as code.
- Italic text is kept as normal text.

## 6. Paragraphs

- Separate paragraphs with **extra space** (Space after paragraph in Word/Docs, or an empty line). Lines that follow each other at normal spacing are joined into one paragraph.
- A line that starts with bold text always starts a new paragraph.
- Indented paragraphs are kept, and shown indented.
- Words split with a hyphen at the end of a line are joined back up.

## 7. Lists

- Use your editor's **built-in bulleted or numbered list**. It puts the marker and the text apart, which is how the reader spots a list.
- Accepted markers: `•` `●` `▪` `◦` `‣` `-` `–` `*`, numbers like `1.` or `1)`, and letters like `a.` or `a)`.
- Wrapped lines must line up with the item text, not with the bullet (lists do this automatically).
- A typed `1. Some text` with no gap after the number may be read as a normal paragraph.

## 8. Tables

The reader rebuilds tables from **column positions**, so it needs clean, aligned columns:

- Use a **real table** (Insert → Table), not text spaced out with tabs or spaces.
- **Left-align** every column. Each column's text must start at the same horizontal position on every row.
- Leave a clear gap between columns: at least about one character width.
- Add a little padding between rows (the default table style does this). Lines inside one cell sit closer together than rows do.
- The **first row is used as the header** when every cell in it is short (5 words or fewer).
- Tables can **continue onto the next page**: keep the same columns, and a repeated header row is dropped automatically.
- Name a column `Line`, `#`, `No.` or `Step` to make it narrow, or `Code` to show it in monospace.

Avoid merged or split cells, centred or right-aligned columns, tables nested inside tables, and rotated text.

## 9. Questions and answers

Put a question and its answer in **one paragraph**: the question in bold starting with `Q:`, then the answer starting with `A:` in normal text.

> **Q: What is the time complexity of binary search?** A: O(log n), because the search range is halved on every step.

This becomes a collapsible question with its answer, and the card gets an **Expand / Collapse all answers** button. If `A:` is also bold, it is read as part of the question and the Q&A is not detected.

## 10. Page layout

- Use a **single-column** layout. Two-column (newspaper-style) pages get their columns mixed up or read as a table.
- **Headers, footers and page numbers are removed automatically**: text in the top ~9% or bottom ~8% of the page that repeats on at least half the pages, plus anything that looks like `Page 3`, `3 of 12` or `3/12`. Don't put real content in those margins.
- Text boxes, sidebars and floating shapes are read in top-to-bottom order wherever they sit on the page, so avoid them for main content.

---

## Recommended setup

**Word / LibreOffice Writer / Google Docs:**

| Element        | Style to use                        | Example size       |
| :------------- | :---------------------------------- | :----------------- |
| Document title | Title (once, at the top)            | 24 pt              |
| Topic          | Heading 1                           | 16–18 pt           |
| Sub-topic      | Heading 2, or a short **bold** line | 13 pt / bold 11 pt |
| Body text      | Normal                              | 11 pt              |
| Code           | Consolas or Courier New             | 10–11 pt           |

Then export: **File → Save As → PDF** (Word), **File → Export as PDF** (LibreOffice), or **File → Download → PDF document** (Google Docs).

**Example structure:**

```
Data Structures Notes                       ← Title, 24 pt (document title)

Chapter 1: Arrays (pages 1–4)               ← Heading 1 (topic, with tag and badge)
  Arrays store items next to each other…    ← Normal paragraph (intro card)

  Complexity                                ← bold line (card)
  | Operation | Time   |                    ← real table, header row
  | Access    | O(1)   |
  | Insert    | O(n)   |

  **What it does:** Binary search finds…    ← bold lead-in (card + paragraph)

  Practice                                  ← bold line (card)
  **Q: Why is access O(1)?** A: Because…    ← Q&A pair

Chapter 2: Linked Lists                     ← Heading 1 (next topic)
  • Each node points to the next one        ← built-in bulleted list
  • Insertion at the head is O(1)
```

---

## Quick checklist

- [ ] The text can be selected in a normal PDF viewer (not a scan)
- [ ] One font size for all body text
- [ ] All topic headings share one size, at least 25% larger than body text
- [ ] Sub-headings are short bold lines or short bold `Label:` lead-ins
- [ ] No whole bold sentences or oversized callouts
- [ ] Built-in lists and real, left-aligned tables
- [ ] Q&A written as **Q: …** (bold) followed by A: … (not bold) in one paragraph
- [ ] Single-column pages, nothing important in the headers or footers

## Troubleshooting

| You see                                      | Likely cause                                        | Fix                                                            |
| :------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------- |
| "No readable text was found"                 | Scanned or image-only PDF                           | Export from the original document, or run OCR first            |
| Everything is in one "Overview" topic        | No text is 25% or more larger than body text        | Use Heading 1 (bigger font) for each topic                     |
| Only one topic, the rest become sub-headings | Topic headings use different sizes                  | Give all topic headings the same style / size                  |
| Odd topics made of quotes or notes           | Callouts are set in a large font                    | Shrink callouts to body size; use bold or italic instead       |
| Lots of tiny cards                           | Many short lines are fully bold                     | Only bold the words you want as labels                         |
| Table shows as separate lines                | Tab-spaced text, or centred / right-aligned columns | Use a real table with left-aligned columns                     |
| Two columns of a page merged into one table  | Two-column page layout                              | Switch to a single-column layout                               |
| Q&A shows as a plain paragraph               | `A:` is bold too, or is in a separate paragraph     | Keep the question bold and `A:` plain, in the same paragraph   |
| Bold isn't shown                             | "Fake bold" or a font without a bold weight         | Use the editor's Bold with a font that has a real bold version |

## Using the reader

- **Open:** click **Open PDF**, press <kbd>Ctrl</kbd> + <kbd>O</kbd>, or drag a `.pdf` onto the reader.
- **Navigate:** click topics and sub-headings in the sidebar, use the chips at the top of a topic, or press <kbd>←</kbd> / <kbd>→</kbd> for the previous / next topic.
- **Search:** <kbd>Ctrl</kbd> + <kbd>F</kbd> searches all topics, highlights matches and shows a match count per topic. <kbd>Esc</kbd> clears it.
- **Text size:** the **A−** / **A+** buttons, or <kbd>Ctrl</kbd> + <kbd>-</kbd> / <kbd>Ctrl</kbd> + <kbd>=</kbd>.
- The reader opens inside the main window, so it follows the app's screen-share visibility setting. The open document stays loaded when you switch to another page and back. Nothing from the PDF is saved to disk.
