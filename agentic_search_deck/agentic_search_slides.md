---
marp: true
theme: default
paginate: false
size: 16:9
title: "Agentic Search: When the Agent Decides What to Search"
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  section {
    position: relative;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: #ffffff;
    color: #1c1e21;
    font-size: 26px;
    padding: 56px 64px 72px 72px;
    border-left: none;
    box-sizing: border-box;
  }
  /*
   * Logo footers use ::before, not ::after: Marp's default theme sets
   * section:not([data-marpit-pagination])::after { display: none } when paginate is false,
   * which hides any footer on ::after. Slide directives set data-class, not class, so use
   * [data-class~="cover"] / [data-class~="closing"] for slide tokens (whole-word ~=, not *=—
   * "discovery" contains "cover" and would wrongly match [data-class*="cover"]).
   * Marp stores multiple classes in one attribute (e.g. data-class="cover cover-alt-…").
   * section.cover would never match.
   */
  section:not([data-class~="cover"]):not([data-class~="closing"]):not([data-class*="section-divider"])::before {
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    pointer-events: none;
    right: 40px;
    bottom: 16px;
    left: auto;
    width: min(88px, 19vw);
    height: 30px;
    background-image: url('elastic_logo_horizontal_dark.svg');
    background-repeat: no-repeat;
    background-position: center right;
    background-size: contain;
    font-size: 0;
    line-height: 0;
    color: transparent;
  }
  section[data-class~="cover"]::before {
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    pointer-events: none;
    bottom: 5%;
    width: min(580px, 42vw);
    height: min(58px, 7.5vh);
    background-image: url('elastic_2025_cover_alternative_deck_slide_01_strip.png');
    background-repeat: no-repeat;
    background-size: contain;
    font-size: 0;
    line-height: 0;
    color: transparent;
    left: 6%;
    right: auto;
    background-position: center left;
    transform: none;
  }
  section[data-class~="closing"]::before {
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    pointer-events: none;
    bottom: 5%;
    width: min(580px, 42vw);
    height: min(58px, 7.5vh);
    background-image: url('elastic_2025_cover_alternative_deck_slide_01_strip.png');
    background-repeat: no-repeat;
    background-size: contain;
    font-size: 0;
    line-height: 0;
    color: transparent;
    left: 50%;
    right: auto;
    background-position: center center;
    transform: translateX(-50%);
  }
  section[data-class~="cover"] {
    background-color: #006DE4;
    background-image: url('elastic_brand_cover_bg.svg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: #ffffff;
    border-left: none;
    justify-content: flex-start;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 72px 80px 120px 72px;
  }
  section[data-class~="cover"] h1,
  section[data-class~="cover"] marp-h1 {
    font-size: 2.35em;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 0.5em 0;
    color: #ffffff;
    border: none;
    padding: 0;
    max-width: 62%;
  }
  section[data-class~="cover"] .cover-sub {
    font-size: 1.05em;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
    margin: 0 0 0.2em 0;
    line-height: 1.4;
  }
  section[data-class~="cover"] .cover-author {
    font-size: 1em;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.4;
  }
  section[data-class~="cover"] .cover-meta {
    display: none;
  }
  section[data-class~="closing"] {
    background-color: #006DE4;
    color: #ffffff;
    border-left: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 64px 80px 120px 80px;
  }
  section[data-class~="closing"] h1,
  section[data-class~="closing"] marp-h1 {
    font-size: 2.65em;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.12;
    color: #ffffff;
    border: none;
    padding: 0;
    margin: 0;
  }
  section[data-class~="statement"] {
    background: #f6f8fc;
    justify-content: center;
    display: flex;
    flex-direction: column;
  }
  section[data-class~="statement"] h1 {
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.2;
    color: #0c111d;
    border: none;
    padding: 0;
    margin: 0 0 0.75em;
  }
  section[data-class~="problem"] h1 {
    font-weight: 800;
    color: #0c111d;
    border: none;
    padding: 0;
    margin: 0 0 0.75em 0;
  }
  section[data-class~="problem"] ul { list-style: none; padding-left: 0; margin: 0; }
  section[data-class~="problem"] li {
    position: relative;
    padding-left: 1.35em;
    margin: 0.5em 0;
    color: #3d4350;
    font-size: 1.02em;
  }
  section[data-class~="problem"] li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 0.45em;
    height: 0.45em;
    background: #006DE4;
    border-radius: 50%;
  }
  section[data-class~="pillars"] h1 {
    font-weight: 800;
    border: none;
    color: #0c111d;
    margin: 0 0 1em 0;
    padding: 0;
  }
  section[data-class~="pillars"] ul { list-style: none; padding: 0; margin: 0; }
  section[data-class~="pillars"] li {
    margin: 0.55em 0;
    padding: 0.65em 0 0.65em 1.1em;
    border-left: 4px solid #006DE4;
    background: linear-gradient(90deg, #e8f3fc 0%, transparent 100%);
    color: #252830;
    font-weight: 500;
  }
  section[data-class~="arch-flow"] h1 {
    font-weight: 800;
    color: #0c111d;
    border: none;
    margin: 0 0 0.35em 0;
    padding: 0;
  }
  section[data-class~="arch-flow"] .arch-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin-top: 0.5rem;
    align-items: stretch;
  }
  section[data-class~="arch-flow"] .arch-card {
    background: #f6f8fc;
    border-radius: 12px;
    padding: 1rem 1.1rem;
    border: 1px solid #e2e6ef;
  }
  section[data-class~="arch-flow"] .arch-card .num {
    font-size: 2.4em;
    font-weight: 800;
    color: #c8ddf2;
    line-height: 1;
    margin-bottom: 0.2em;
    letter-spacing: -0.04em;
  }
  section[data-class~="arch-flow"] .arch-card h3 {
    margin: 0 0 0.4em 0;
    font-size: 0.95em;
    font-weight: 700;
    color: #006DE4;
  }
  section[data-class~="arch-flow"] .arch-card p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.45;
    color: #4a5060;
  }
  section[data-class~="twocol"] {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }
  section[data-class~="twocol"] h1 {
    grid-column: 1 / -1;
    font-weight: 800;
    border: none;
    color: #0c111d;
    margin: 0 0 0.25em 0;
    padding: 0;
  }
  section[data-class~="twocol"] .col h2 {
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #006DE4;
    font-weight: 700;
    margin: 0 0 0.6em 0;
    border: none;
  }
  section[data-class~="twocol"] .col ul { margin: 0; padding-left: 1.1em; font-size: 0.88em; color: #3d4350; }
  section[data-class~="twocol"] .col li { margin: 0.4em 0; }
  section[data-class~="dark"] {
    background: linear-gradient(160deg, #0c111d 0%, #1e2a3d 100%);
    color: #e8ecf4;
    border-left: none;
  }
  section[data-class~="dark"] h1, section[data-class~="dark"] h2 { color: #ffffff; border: none; }
  section[data-class~="dark"] p, section[data-class~="dark"] li { color: #b8c2d9; }
  section[data-class~="dark"] strong { color: #ffffff; }
  section[data-class~="dark"] th { background: #006DE4; }
  section[data-class~="dark"] td { border-color: #2d3a4f; color: #d0d7e6; }
  section[data-class~="dark"] tr:nth-child(even) td { background: rgba(255,255,255,0.04); }
  h1, marp-h1 {
    color: #0c111d;
    font-weight: 800;
    font-size: 1.65em;
    letter-spacing: -0.025em;
    line-height: 1.2;
    border-bottom: none;
    padding: 0;
    margin: 0 0 0.65em 0;
  }
  h2 { color: #006DE4; font-size: 0.95em; font-weight: 700; margin-top: 0.4em; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { color: #0c111d; font-weight: 600; }
  section[data-class~="cover"] strong { color: #c5d0ef; }
  section[data-class~="dark"] strong { color: #fff; }
  ul { line-height: 1.5; }
  li { margin: 0.38em 0; }
  table { font-size: 0.68em; border-collapse: collapse; width: 100%; border-radius: 10px; overflow: hidden; }
  th { background: #006DE4; color: white; padding: 0.5em 0.65em; text-align: left; font-weight: 600; }
  td { padding: 0.45em 0.65em; border-bottom: 1px solid #e8ebf2; color: #3d4350; }
  section:not([data-class~="dark"]) tr:nth-child(even) td { background: #f9fafc; }
  tr:last-child td { border-bottom: none; }
  code { font-family: 'JetBrains Mono', monospace; font-size: 0.82em; background: #e8f3fc; padding: 0.12em 0.4em; border-radius: 6px; color: #004a94; }
  section[data-class~="dark"] code { background: rgba(0,109,228,0.35); color: #dbe4ff; }
  blockquote { border-left: 4px solid #006DE4; padding-left: 1em; color: #5a6170; font-style: normal; font-size: 0.95em; margin: 1em 0; background: #f6f8fc; padding: 0.85em 1em; border-radius: 0 8px 8px 0; }
  footer { color: #8b8d98; font-size: 0.5em; font-weight: 500; }
  section[data-class~="diagram-slide"] img {
    display: block;
    margin: 0.35em auto 0;
    max-width: 100%;
    max-height: 340px;
    height: auto;
  }
  /* Agenda — parity with "Copy of Elastic Presentation Template 2025" deck slide 4 (Agenda layout) */
  section[data-class~="ppt-agenda-s4"] h1,
  section[data-class~="ppt-agenda-s4"] marp-h1 {
    font-size: 1.65em;
    font-weight: 800;
    margin: 0 0 0.75em 0;
    text-align: left;
    color: #1c1e23;
    border: none;
    padding: 0;
  }
  section[data-class~="ppt-agenda-s4"] .ppt-agenda-s4-rows {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 0.15em;
  }
  section[data-class~="ppt-agenda-s4"] .ppt-agenda-s4-row {
    display: grid;
    grid-template-columns: 3.1em 1fr;
    column-gap: 1.35em;
    align-items: center;
    padding: 0.32em 0;
  }
  section[data-class~="ppt-agenda-s4"] .ppt-agenda-s4-num {
    font-style: italic;
    font-weight: 400;
    font-size: 0.54em;
    color: #1c1e23;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  section[data-class~="ppt-agenda-s4"] .ppt-agenda-s4-title {
    font-weight: 600;
    font-size: 0.69em;
    text-align: right;
    color: #1c1e23;
    line-height: 1.25;
  }
  /* div, not <hr>: default hr inset/groove can read as a gray band under the blue line */
  section[data-class~="ppt-agenda-s4"] .ppt-agenda-s4-rule {
    display: block;
    height: 0;
    margin: 0.12em 0 0.36em 0;
    padding: 0;
    border: 0;
    border-top: 1px solid #0b64dd;
    width: 100%;
    background: none;
    box-shadow: none;
  }
  /* Appealing layouts (pair with PNGs under examples/layout_reference/) */
  section[data-class~="ppt-appealing-layout"] {
    display: flex;
    flex-direction: column;
    padding: 0;
    background-image: none;
    overflow: hidden;
  }
  section[data-class~="ppt-appealing-layout"] h1,
  section[data-class~="ppt-appealing-layout"] marp-h1 {
    display: none;
  }
  .ppt-split-blue-rail {
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 0;
    align-items: stretch;
  }
  .ppt-split-blue-rail__aside {
    flex: 0 0 32%;
    max-width: 36%;
    background: #0b64dd;
    color: #ffffff;
    padding: 48px 40px 56px 48px;
    box-sizing: border-box;
  }
  .ppt-split-blue-rail__aside h2 {
    margin: 0 0 0.45em 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #ffffff;
  }
  .ppt-split-blue-rail__aside p {
    margin: 0;
    font-size: 0.72em;
    line-height: 1.4;
    font-weight: 400;
    opacity: 0.95;
  }
  .ppt-split-blue-rail__main {
    flex: 1;
    padding: 48px 48px 72px 40px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    justify-content: center;
    box-sizing: border-box;
  }
  .ppt-split-blue-rail__row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .ppt-split-blue-rail__row p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.35;
    color: #1c1e21;
  }
  .ppt-icon-ph {
    flex: 0 0 56px;
    width: 56px;
    height: 56px;
    border-radius: 10px;
    background: #e8edf5;
    border: 1px solid #d0d8e8;
    box-sizing: border-box;
  }
  .ppt-two-cards-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 36px 56px 72px;
    box-sizing: border-box;
    justify-content: center;
  }
  .ppt-two-cards-page__header {
    text-align: center;
    max-width: 78%;
    margin-bottom: 28px;
  }
  .ppt-two-cards-page__header h2 {
    margin: 0 0 0.35em 0;
    font-size: 1.5em;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0c111d;
  }
  .ppt-two-cards-page__header p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.35;
    color: #3d4350;
  }
  .ppt-two-cards-page__pair {
    display: flex;
    gap: 28px;
    width: 100%;
    max-width: 920px;
    justify-content: center;
    align-items: stretch;
  }
  .ppt-shadow-card {
    flex: 1;
    border-radius: 18px;
    padding: 24px 26px;
    min-height: 180px;
    text-align: left;
    box-sizing: border-box;
  }
  .ppt-shadow-card h3 {
    margin: 0 0 0.4em 0;
    font-size: 1em;
    font-weight: 800;
    color: #0c111d;
  }
  .ppt-shadow-card p {
    margin: 0;
    font-size: 0.75em;
    line-height: 1.35;
    color: #1c1e21;
  }
  .ppt-shadow-card--mint {
    background: #48efcf;
    box-shadow: 12px 12px 0 #153385;
  }
  .ppt-shadow-card--muted {
    background: #eeeeee;
  }
  section[data-class~="roadmap-pills"] {
    background: linear-gradient(165deg, #0c111d 0%, #152238 100%);
    color: #e8ecf4;
    display: flex;
    flex-direction: column;
    padding: 48px 56px 72px 56px;
  }
  section[data-class~="roadmap-pills"] h1,
  section[data-class~="roadmap-pills"] marp-h1 {
    color: #ffffff;
    border: none;
    margin: 0 0 0.35em 0;
    font-size: 1.65em;
  }
  section[data-class~="roadmap-pills"] .rm-sub {
    font-size: 0.72em;
    color: #b8c2d9;
    margin: 0 0 1.1em 0;
    line-height: 1.35;
  }
  section[data-class~="roadmap-pills"] .rm-track {
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 0.35em;
  }
  section[data-class~="roadmap-pills"] .rm-phase {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }
  section[data-class~="roadmap-pills"] .rm-pill {
    background: #48efcf;
    color: #0c111d;
    font-weight: 800;
    font-size: 0.68em;
    padding: 0.38em 0.95em;
    border-radius: 999px;
    white-space: nowrap;
  }
  section[data-class~="roadmap-pills"] .rm-dash {
    flex: 1 1 36px;
    min-width: 10px;
    height: 0;
    border: 0;
    border-top: 2px dashed rgba(255, 255, 255, 0.28);
    margin: 0 0.2em;
    align-self: center;
  }
  section[data-class~="roadmap-pills"] .rm-cap {
    font-size: 0.62em;
    color: #b8c2d9;
    margin: 0.85em 0 0;
    text-align: center;
    line-height: 1.25;
    max-width: 11em;
  }
  section[data-class~="timeline-lite"] {
    --tl-rail-inset: clamp(44px, 6vw, 96px);
  }
  section[data-class~="timeline-lite"] .tl-sub {
    font-size: 0.72em;
    color: #5a6170;
    margin: 0 0 1.2em 0;
    line-height: 1.35;
  }
  section[data-class~="timeline-lite"] .tl-wrap {
    position: relative;
    display: flex;
    align-items: center;
    margin-top: 1.1em;
    min-height: 42px;
    box-sizing: border-box;
    width: calc(100% + 72px + 64px);
    margin-left: -72px;
    margin-right: -64px;
  }
  section[data-class~="timeline-lite"] .tl-line {
    position: absolute;
    left: var(--tl-rail-inset);
    right: var(--tl-rail-inset);
    top: 50%;
    height: 0;
    margin-top: -1px;
    border-top: 2px solid #2a3142;
    pointer-events: none;
    z-index: 0;
  }
  section[data-class~="timeline-lite"] .tl-nodes {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding-left: var(--tl-rail-inset);
    padding-right: var(--tl-rail-inset);
    position: relative;
    z-index: 1;
  }
  section[data-class~="timeline-lite"] .tl-node {
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    border-radius: 50%;
    background: #e4e6eb;
    border: 2px solid #2a3142;
    flex-shrink: 0;
  }
  section[data-class~="timeline-lite"] .tl-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75em 1em;
    margin-top: 1.15em;
    width: calc(100% + 72px + 64px);
    margin-left: -72px;
    margin-right: -64px;
    box-sizing: border-box;
    padding-left: var(--tl-rail-inset);
    padding-right: var(--tl-rail-inset);
  }
  section[data-class~="timeline-lite"] .tl-col {
    text-align: center;
    min-width: 0;
  }
  section[data-class~="timeline-lite"] .tl-col h3 {
    margin: 0;
    font-size: 0.72em;
    font-weight: 800;
    color: #0c111d;
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  section[data-class~="timeline-lite"] .tl-col p {
    margin: 0.35em 0 0;
    font-size: 0.65em;
    color: #3d4350;
    line-height: 1.35;
  }
  section[data-class~="quote-dark"] {
    background: linear-gradient(160deg, #0c111d 0%, #1a2333 100%);
    color: #e8ecf4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 72px;
  }
  section[data-class~="quote-dark"] blockquote {
    border: none;
    background: none;
    margin: 0;
    padding: 0;
    text-align: center;
    font-size: 1.12em;
    line-height: 1.38;
    color: #ffffff;
    font-style: italic;
  }
  section[data-class~="quote-dark"] .quote-by {
    margin: 1.15em 0 0;
    text-align: center;
    font-size: 0.75em;
    font-weight: 700;
    font-style: normal;
    color: #48efcf;
  }
  section[data-class~="layout-fidelity"] .lf-row {
    display: flex;
    gap: 28px;
    align-items: flex-start;
    margin-top: 0.45em;
  }
  section[data-class~="layout-fidelity"] .lf-copy {
    flex: 1;
    font-size: 0.78em;
    line-height: 1.4;
    color: #3d4350;
    min-width: 0;
  }
  section[data-class~="layout-fidelity"] .lf-ref {
    flex: 0 0 44%;
    max-width: 480px;
  }
  section[data-class~="layout-fidelity"] .lf-ref img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 320px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid #e2e6ef;
    background: #f5f6f8;
  }
  section {
    position: relative;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: #ffffff;
    color: #1c1e21;
    font-size: 26px;
    padding: 56px 64px 72px 72px;
    box-sizing: border-box;
  }
  section:not([data-class~="cover"]):not([data-class~="closing"]):not([data-class*="section-divider"]):not([data-class~="lr-chrome-skip"]) {
    background-image: url('elastic_2025_chrome_body_top_rule_01.png');
    background-repeat: no-repeat;
    background-position: 8% 6%;
    background-size: min(78%, 920px) auto;
  }
  section:not([data-class~="cover"]):not([data-class~="closing"]):not([data-class*="section-divider"])::before {
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    pointer-events: none;
    right: 40px;
    bottom: 16px;
    left: auto;
    width: min(88px, 19vw);
    height: 30px;
    background-image: url('elastic_logo_horizontal_dark.svg');
    background-repeat: no-repeat;
    background-position: center right;
    background-size: contain;
    font-size: 0;
    line-height: 0;
    color: transparent;
  }
  section[data-class~="ppt-appealing-layout"] {
    display: flex;
    flex-direction: column;
    padding: 0;
    background-image: none;
    overflow: hidden;
  }
  section[data-class~="ppt-appealing-layout"] h1,
  section[data-class~="ppt-appealing-layout"] marp-h1 {
    display: none;
  }
  .ppt-split-blue-rail {
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 0;
    align-items: stretch;
  }
  .ppt-split-blue-rail__aside {
    flex: 0 0 32%;
    max-width: 36%;
    background: #0b64dd;
    color: #ffffff;
    padding: 48px 40px 56px 48px;
    box-sizing: border-box;
  }
  .ppt-split-blue-rail__aside h2 {
    margin: 0 0 0.45em 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #ffffff;
  }
  .ppt-split-blue-rail__aside p {
    margin: 0;
    font-size: 0.72em;
    line-height: 1.4;
    font-weight: 400;
    opacity: 0.95;
  }
  .ppt-split-blue-rail__main {
    flex: 1;
    padding: 48px 48px 72px 40px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    justify-content: center;
    box-sizing: border-box;
  }
  .ppt-split-blue-rail__row {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .ppt-split-blue-rail__row p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.35;
    color: #1c1e21;
  }
  .ppt-icon-ph {
    flex: 0 0 56px;
    width: 56px;
    height: 56px;
    border-radius: 10px;
    background: #e8edf5;
    border: 1px solid #d0d8e8;
    box-sizing: border-box;
  }
  .ppt-split-cards {
    display: flex;
    flex-direction: row;
    flex: 1;
    gap: 36px;
    align-items: flex-start;
    width: 100%;
    min-height: 0;
    padding: 40px 48px 72px 56px;
    box-sizing: border-box;
  }
  .ppt-split-cards__intro {
    flex: 0 0 34%;
    max-width: 38%;
  }
  .ppt-split-cards__intro h2 {
    margin: 0 0 0.4em 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0c111d;
  }
  .ppt-split-cards__intro p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.4;
    color: #3d4350;
  }
  .ppt-split-cards__grid {
    flex: 1;
    display: grid;
    gap: 18px;
    min-width: 0;
  }
  .ppt-split-cards__grid--2x2 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  .ppt-accent-card {
    background: #0b64dd;
    color: #ffffff;
    border-radius: 14px;
    padding: 20px 22px 22px;
    border: 1px solid #153385;
    box-sizing: border-box;
    text-align: left;
  }
  .ppt-accent-card__num {
    display: block;
    font-size: 1.35em;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 0.3em;
    color: #ffffff;
  }
  .ppt-accent-card h3 {
    margin: 0 0 0.35em 0;
    font-size: 0.95em;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
  }
  .ppt-accent-card p {
    margin: 0;
    font-size: 0.72em;
    line-height: 1.3;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.95);
  }
  .ppt-two-cards-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 36px 56px 72px;
    box-sizing: border-box;
    justify-content: center;
  }
  .ppt-two-cards-page__header {
    text-align: center;
    max-width: 78%;
    margin-bottom: 28px;
  }
  .ppt-two-cards-page__header h2 {
    margin: 0 0 0.35em 0;
    font-size: 1.5em;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0c111d;
  }
  .ppt-two-cards-page__header p {
    margin: 0;
    font-size: 0.78em;
    line-height: 1.35;
    color: #3d4350;
  }
  .ppt-two-cards-page__pair {
    display: flex;
    gap: 28px;
    width: 100%;
    max-width: 920px;
    justify-content: center;
    align-items: stretch;
  }
  .ppt-shadow-card {
    flex: 1;
    border-radius: 18px;
    padding: 24px 26px;
    min-height: 180px;
    text-align: left;
    box-sizing: border-box;
  }
  .ppt-shadow-card h3 {
    margin: 0 0 0.4em 0;
    font-size: 1em;
    font-weight: 800;
    color: #0c111d;
  }
  .ppt-shadow-card p {
    margin: 0;
    font-size: 0.75em;
    line-height: 1.35;
    color: #1c1e21;
  }
  .ppt-shadow-card--mint {
    background: #48efcf;
    box-shadow: 12px 12px 0 #153385;
  }
  .ppt-shadow-card--muted {
    background: #eeeeee;
  }
  .ppt-grid-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 36px 48px 72px 56px;
    box-sizing: border-box;
  }
  .ppt-grid-page__title {
    margin: 0 0 0.45em 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0c111d;
  }
  .ppt-card-grid--2x3 {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 18px;
    min-height: 0;
  }
  /* layout-split-blue-image-panel — elastic_2025_layout_split_blue_image_panel.png */
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art {
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 0;
    align-items: stretch;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__hero {
    flex: 0 0 38%;
    max-width: 40%;
    background: #0b64dd;
    color: #ffffff;
    padding: 48px 40px 56px 48px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__hero h2 {
    margin: 0 0 0.45em 0;
    font-size: 1.45em;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #ffffff;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__hero p {
    margin: 0;
    font-size: 0.72em;
    line-height: 1.4;
    opacity: 0.95;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__panel {
    flex: 1;
    padding: 40px 48px 56px 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eef2f9;
    box-sizing: border-box;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__panel-inner {
    width: 100%;
    max-height: 100%;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #e2e6ef;
    box-shadow: 8px 12px 32px rgba(15, 23, 42, 0.1);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
  }
  section[data-class~="layout-split-blue-image-panel"] .ppt-split-art__panel-inner img {
    max-width: 100%;
    max-height: 300px;
    height: auto;
    border-radius: 12px;
  }
  /* layout-quotes-multi-accent-blue */
  section[data-class~="layout-quotes-multi-accent-blue"] {
    background: #0b64dd;
    color: #ffffff;
    padding: 44px 52px 72px 52px;
    display: flex;
    flex-direction: column;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] h1,
  section[data-class~="layout-quotes-multi-accent-blue"] marp-h1 {
    color: #ffffff;
    border: none;
    margin: 0 0 0.5em 0;
    font-size: 1.55em;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] .qm-stack {
    display: flex;
    flex-direction: column;
    gap: 1.1em;
    margin-top: 0.25em;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] .qm-block {
    display: grid;
    grid-template-columns: 0.85fr 5fr;
    gap: 0.65em;
    align-items: start;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] .qm-mark {
    font-size: 2.4em;
    font-weight: 800;
    line-height: 0.85;
    opacity: 0.3;
    color: #ffffff;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] .qm-body {
    font-size: 0.76em;
    line-height: 1.38;
    font-style: italic;
  }
  section[data-class~="layout-quotes-multi-accent-blue"] .qm-attrib {
    font-size: 0.62em;
    font-weight: 700;
    font-style: normal;
    margin-top: 0.4em;
    color: rgba(255, 255, 255, 0.95);
  }
  /* layout-quote-single-dark */
  section[data-class~="layout-quote-single-dark"] {
    background: linear-gradient(160deg, #0c111d 0%, #1a2333 100%);
    color: #e8ecf4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 64px 72px 64px;
  }
  section[data-class~="layout-quote-single-dark"] h1,
  section[data-class~="layout-quote-single-dark"] marp-h1 {
    text-align: center;
    font-size: 0.52em;
    font-weight: 700;
    color: #8b95a8;
    border: none;
    margin: 0 0 1em 0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  section[data-class~="layout-quote-single-dark"] blockquote {
    border: none;
    background: none;
    margin: 0;
    padding: 0;
    text-align: center;
    font-size: 1.08em;
    line-height: 1.38;
    color: #ffffff;
    font-style: italic;
  }
  section[data-class~="layout-quote-single-dark"] .qs-by {
    margin: 1.1em 0 0;
    text-align: center;
    font-size: 0.74em;
    font-weight: 700;
    font-style: normal;
    color: #48efcf;
  }
  /* layout-roadmap-pills-dark */
  section[data-class~="layout-roadmap-pills-dark"] {
    background: linear-gradient(165deg, #0c111d 0%, #152238 100%);
    color: #e8ecf4;
    display: flex;
    flex-direction: column;
    padding: 48px 52px 72px 52px;
  }
  section[data-class~="layout-roadmap-pills-dark"] h1,
  section[data-class~="layout-roadmap-pills-dark"] marp-h1 {
    color: #ffffff;
    border: none;
    margin: 0 0 0.35em 0;
    font-size: 1.6em;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-sub {
    font-size: 0.72em;
    color: #b8c2d9;
    margin: 0 0 1em 0;
    line-height: 1.35;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-track {
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 0.3em;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-phase {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-pill {
    background: #48efcf;
    color: #0c111d;
    font-weight: 800;
    font-size: 0.66em;
    padding: 0.36em 0.9em;
    border-radius: 999px;
    white-space: nowrap;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-dash {
    flex: 1 1 32px;
    min-width: 8px;
    height: 0;
    border: 0;
    border-top: 2px dashed rgba(255, 255, 255, 0.28);
    margin: 0 0.18em;
    align-self: center;
  }
  section[data-class~="layout-roadmap-pills-dark"] .rm-cap {
    font-size: 0.6em;
    color: #b8c2d9;
    margin: 0.8em 0 0;
    text-align: center;
    line-height: 1.25;
    max-width: 10.5em;
  }
  section[data-class~="layout-timeline-horizontal-white"] {
    display: flex;
    flex-direction: column;
    padding: 44px 48px 72px 48px;
    background: #ffffff;
    box-sizing: border-box;
  }
  section[data-class~="layout-timeline-horizontal-white"] h1,
  section[data-class~="layout-timeline-horizontal-white"] marp-h1 {
    border: none;
    margin-bottom: 0.1em;
  }
  /* layout-timeline-horizontal-white */
  section[data-class~="layout-timeline-horizontal-white"] {
    --tl-rail-inset: clamp(40px, 5.5vw, 88px);
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-sub {
    font-size: 0.72em;
    color: #5a6170;
    margin: 0 0 1.1em 0;
    line-height: 1.35;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-wrap {
    position: relative;
    display: flex;
    align-items: center;
    margin-top: 1em;
    min-height: 42px;
    box-sizing: border-box;
    width: calc(100% + 48px + 48px);
    margin-left: -48px;
    margin-right: -48px;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-line {
    position: absolute;
    left: var(--tl-rail-inset);
    right: var(--tl-rail-inset);
    top: 50%;
    height: 0;
    margin-top: -1px;
    border-top: 2px solid #2a3142;
    pointer-events: none;
    z-index: 0;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-nodes {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding-left: var(--tl-rail-inset);
    padding-right: var(--tl-rail-inset);
    position: relative;
    z-index: 1;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-node {
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    border-radius: 50%;
    background: #e4e6eb;
    border: 2px solid #2a3142;
    flex-shrink: 0;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.7em 0.95em;
    margin-top: 1.05em;
    width: calc(100% + 48px + 48px);
    margin-left: -48px;
    margin-right: -48px;
    box-sizing: border-box;
    padding-left: var(--tl-rail-inset);
    padding-right: var(--tl-rail-inset);
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-col {
    text-align: center;
    min-width: 0;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-col h3 {
    margin: 0;
    font-size: 0.7em;
    font-weight: 800;
    color: #0c111d;
    border: none;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  section[data-class~="layout-timeline-horizontal-white"] .tl-col p {
    margin: 0.32em 0 0;
    font-size: 0.64em;
    color: #3d4350;
    line-height: 1.35;
  }
  /* layout-speakers-grid-4-accent-blue */
  section[data-class~="layout-speakers-grid-4-accent-blue"] {
    background: #0b64dd;
    color: #ffffff;
    padding: 44px 48px 72px 48px;
    display: flex;
    flex-direction: column;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] h1,
  section[data-class~="layout-speakers-grid-4-accent-blue"] marp-h1 {
    color: #ffffff;
    border: none;
    margin: 0 0 0.75em 0;
    font-size: 1.55em;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] .sp4-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    flex: 1;
    align-content: start;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] .sp4-card {
    text-align: center;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] .sp4-ph {
    width: 100%;
    aspect-ratio: 1;
    max-width: 140px;
    margin: 0 auto 0.5em auto;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.18);
    border: 2px solid rgba(255, 255, 255, 0.35);
    box-sizing: border-box;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] .sp4-name {
    font-size: 0.72em;
    font-weight: 800;
    margin: 0 0 0.15em 0;
  }
  section[data-class~="layout-speakers-grid-4-accent-blue"] .sp4-role {
    font-size: 0.58em;
    opacity: 0.92;
    line-height: 1.25;
  }
  /* layout-speaker-circle-dark */
  section[data-class~="layout-speaker-circle-dark"] {
    background: linear-gradient(155deg, #0c111d 0%, #1b2638 100%);
    color: #e8ecf4;
    padding: 48px 56px 72px 56px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section[data-class~="layout-speaker-circle-dark"] h1,
  section[data-class~="layout-speaker-circle-dark"] marp-h1 {
    display: none;
  }
  section[data-class~="layout-speaker-circle-dark"] .sc-row {
    display: flex;
    gap: 36px;
    align-items: center;
  }
  section[data-class~="layout-speaker-circle-dark"] .sc-photo {
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
  }
  section[data-class~="layout-speaker-circle-dark"] .sc-copy h2 {
    margin: 0 0 0.35em 0;
    font-size: 1.55em;
    font-weight: 800;
    color: #ffffff;
    border: none;
  }
  section[data-class~="layout-speaker-circle-dark"] .sc-rule {
    width: 48px;
    border-top: 3px solid #48efcf;
    margin: 0 0 0.5em 0;
  }
  section[data-class~="layout-speaker-circle-dark"] .sc-title {
    font-size: 0.78em;
    color: #b8c2d9;
    margin: 0;
    line-height: 1.35;
  }
  /* layout-speaker-rounded-square-accent-blue */
  section[data-class~="layout-speaker-rounded-square-accent-blue"] {
    background: #0b64dd;
    color: #ffffff;
    padding: 48px 56px 72px 56px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section[data-class~="layout-speaker-rounded-square-accent-blue"] h1,
  section[data-class~="layout-speaker-rounded-square-accent-blue"] marp-h1 {
    display: none;
  }
  section[data-class~="layout-speaker-rounded-square-accent-blue"] .sr-row {
    display: flex;
    gap: 32px;
    align-items: center;
  }
  section[data-class~="layout-speaker-rounded-square-accent-blue"] .sr-photo {
    flex: 0 0 168px;
    width: 168px;
    height: 168px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.45);
    box-sizing: border-box;
  }
  section[data-class~="layout-speaker-rounded-square-accent-blue"] .sr-copy h2 {
    margin: 0 0 0.25em 0;
    font-size: 1.5em;
    font-weight: 800;
    color: #ffffff;
    border: none;
  }
  section[data-class~="layout-speaker-rounded-square-accent-blue"] .sr-title {
    font-size: 0.76em;
    opacity: 0.95;
    margin: 0;
    line-height: 1.35;
  }
  /* layout-threecol-intro-two-cards */
  section[data-class~="layout-threecol-intro-two-cards"] {
    display: flex;
    flex-direction: column;
    padding: 44px 48px 72px 48px;
    background: #ffffff;
    box-sizing: border-box;
  }
  section[data-class~="layout-threecol-intro-two-cards"] h1,
  section[data-class~="layout-threecol-intro-two-cards"] marp-h1 {
    border: none;
    margin-bottom: 0.45em;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 22px;
    align-items: stretch;
    flex: 1;
    min-height: 0;
    padding: 8px 0 0 0;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3-intro h2 {
    margin: 0 0 0.4em 0;
    font-size: 1.15em;
    font-weight: 800;
    color: #0c111d;
    border: none;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3-intro p {
    margin: 0;
    font-size: 0.72em;
    line-height: 1.4;
    color: #3d4350;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3-card {
    background: #f6f8fc;
    border-radius: 14px;
    padding: 20px 20px 22px 20px;
    border: 1px solid #e2e6ef;
    box-sizing: border-box;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3-card h3 {
    margin: 0 0 0.35em 0;
    font-size: 0.88em;
    font-weight: 800;
    color: #0c111d;
    border: none;
  }
  section[data-class~="layout-threecol-intro-two-cards"] .tc3-card p {
    margin: 0;
    font-size: 0.68em;
    line-height: 1.35;
    color: #3d4350;
  }
  /* layout-three-cards-teal-border */
  section[data-class~="layout-three-cards-teal-border"] {
    display: flex;
    flex-direction: column;
    padding: 40px 48px 72px 48px;
    background: #ffffff;
    box-sizing: border-box;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-head {
    text-align: center;
    margin-bottom: 0.65em;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-head h2 {
    margin: 0 0 0.25em 0;
    font-size: 1.45em;
    font-weight: 800;
    color: #0c111d;
    border: none;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-head p {
    margin: 0;
    font-size: 0.72em;
    color: #5a6170;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    flex: 1;
    min-height: 0;
    align-content: start;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 22px 20px 24px 20px;
    border: 1px solid #e8ebf2;
    border-top: 4px solid #48efcf;
    box-sizing: border-box;
    text-align: center;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-ico {
    width: 52px;
    height: 52px;
    margin: 0 auto 0.45em auto;
    border-radius: 12px;
    background: #eefaf7;
    border: 1px solid #b8ece0;
    box-sizing: border-box;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-card h3 {
    margin: 0 0 0.35em 0;
    font-size: 0.82em;
    font-weight: 800;
    color: #0c111d;
    border: none;
  }
  section[data-class~="layout-three-cards-teal-border"] .tct-card p {
    margin: 0;
    font-size: 0.66em;
    line-height: 1.35;
    color: #3d4350;
  }

  /* ---- agentic search deck additions ---- */
  section[data-class*="section-divider"] {
    display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
    padding: 64px; color: #ffffff; background-size: cover; background-position: center; background-repeat: no-repeat;
  }
  section[data-class*="section-divider"] h1,
  section[data-class*="section-divider"] marp-h1 { color: #ffffff; font-size: 2.1em; font-weight: 800; margin: 0; border: none; text-shadow: none; }
  section[data-class="section-divider-blue-a"] { background-image: url('elastic_2025_chrome_section_banner_blue_a.png'); }
  section[data-class="section-divider-blue-b"] { background-image: url('elastic_2025_chrome_section_banner_blue_b.png'); }
  section[data-class="section-divider-teal-a"] { background-image: url('elastic_2025_chrome_section_banner_teal_a.png'); }
  section[data-class="section-divider-teal-b"] { background-image: url('elastic_2025_chrome_section_banner_teal_b.png'); }
  section[data-class="section-divider-dev-blue-a"] { background-image: url('elastic_2025_chrome_section_banner_dev_blue_a.png'); }
  section[data-class~="diagram-wide"] img { max-height: 505px; margin-top: 0.1em; }
  section[data-class~="diagram-wide"] h1, section[data-class~="diagram-wide"] marp-h1 { margin-bottom: 0.3em; }
  .rail-ico { flex: 0 0 52px; width: 52px; height: 52px; object-fit: contain; }
  .tct-img { width: 56px; height: 56px; object-fit: contain; display: block; margin: 0 auto 10px; }
  section[data-class~="code-slide"] { font-size: 22px; padding-top: 48px; }
  section[data-class~="code-slide"] .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
  section[data-class~="code-slide"] h2 { font-size: 0.82em; color: #0b64dd; margin: 0 0 0.4em 0; font-weight: 700; }
  section[data-class~="code-slide"] pre { background: #0c111d; border-radius: 12px; padding: 16px 18px; margin: 0; font-size: 0.62em; line-height: 1.45; }
  section[data-class~="code-slide"] pre code { background: none; color: #e8ecf4; padding: 0; font-size: 1em; }
  section[data-class~="code-slide"] .note { font-size: 0.72em; color: #3d4350; margin-top: 0.8em; line-height: 1.4; }
  section[data-class~="code-slide"] ul { font-size: 0.85em; line-height: 1.4; color: #1c1e23; }
  section[data-class~="code-slide"] li { margin: 0.55em 0; }
  section[data-class~="closing"] .closing-sub { color: #ffffff; font-size: 0.9em; margin-top: 0.6em; }
  section table { font-size: 0.7em; }
  section[data-class~="cover"] .cover-author { margin: 0.9em 0 0.5em 0; line-height: 1.45; color: #ffffff; }
  section[data-class~="cover"] .cover-author strong { font-weight: 700; font-size: 1.1em; color: #ffffff; }
  section[data-class~="layout-split-cards-2x2-headings"] .ppt-split-cards { align-items: center; padding-top: 48px; padding-bottom: 72px; }
  section[data-class~="layout-split-blue-rail"] .ppt-split-blue-rail__aside { display: flex; flex-direction: column; justify-content: center; }
  section[data-class~="layout-three-cards-teal-border"] .tct-row { flex: 0 0 auto; align-content: center; }
  section[data-class="section-divider-teal-a"] h1, section[data-class="section-divider-teal-b"] h1 { color: #153385; }
  section[data-class~="layout-three-cards-teal-border"] { display: flex; flex-direction: column; justify-content: center; }
  section[data-class~="layout-three-cards-teal-border"] .tct-card p { font-size: 0.78em; }
  section[data-class~="code-slide"] .hljs-attr { color: #9ecbff; }
  section[data-class~="code-slide"] .hljs-string { color: #48EFCF; }
  section[data-class~="code-slide"] .hljs-number, section[data-class~="code-slide"] .hljs-literal { color: #FEC514; }
  section[data-class~="code-slide"] .hljs-punctuation { color: #e8ecf4; }
  section[data-class~="layout-roadmap-pills-dark"] .rm-phase { align-self: flex-start; }
  section[data-class~="layout-roadmap-pills-dark"] .rm-cap { min-width: 210px; max-width: 250px; }
---

<!-- _class: cover -->

# Agentic Search:<br/>When the Agent Decides What to Search

<p class="cover-author"><strong>Ashish Tiwari</strong><br/>Principal Solutions Architect (Search AI Specialist)</p>
<p class="cover-sub">September 25, 2026</p>

<!--
0:00-0:30. Introduce yourself. One line: today we let the agent decide what to search, and keep Elasticsearch deciding what's relevant.
-->

---

<!-- _class: body-accent ppt-agenda-s4 -->

# Agenda

<div class="ppt-agenda-s4-rows">
  <div class="ppt-agenda-s4-row"><span class="ppt-agenda-s4-num">01</span><span class="ppt-agenda-s4-title">Why search breaks</span></div>
  <div class="ppt-agenda-s4-rule" aria-hidden="true"></div>
  <div class="ppt-agenda-s4-row"><span class="ppt-agenda-s4-num">02</span><span class="ppt-agenda-s4-title">The autonomy ladder</span></div>
  <div class="ppt-agenda-s4-rule" aria-hidden="true"></div>
  <div class="ppt-agenda-s4-row"><span class="ppt-agenda-s4-num">03</span><span class="ppt-agenda-s4-title">Built natively in Elastic</span></div>
  <div class="ppt-agenda-s4-rule" aria-hidden="true"></div>
  <div class="ppt-agenda-s4-row"><span class="ppt-agenda-s4-num">04</span><span class="ppt-agenda-s4-title">Live demo</span></div>
  <div class="ppt-agenda-s4-rule" aria-hidden="true"></div>
  <div class="ppt-agenda-s4-row"><span class="ppt-agenda-s4-num">05</span><span class="ppt-agenda-s4-title">What it costs, and where to start</span></div>
</div>

<!-- 0:30-1:00. Don't read it. "Problem, mental model, how it's built, show it, what it costs." -->

---

<!-- _class: body-accent lr-chrome-skip ppt-appealing-layout layout-two-cards-shadow -->

<div class="ppt-two-cards-page">
  <div class="ppt-two-cards-page__header">
    <h2>“something to keep my coffee hot on a long drive”</h2>
    <p>Same index. Same Elasticsearch. Only one thing changed: who decides what to search for.</p>
  </div>
  <div class="ppt-two-cards-page__pair">
    <div class="ppt-shadow-card ppt-shadow-card--mint">
      <h3>Agentic search</h3>
      <p>Understands the <strong>need</strong>: a travel mug or thermos. Rewrites the query, picks the category, then runs hybrid search with reranking.</p>
    </div>
    <div class="ppt-shadow-card ppt-shadow-card--muted">
      <h3>Keyword search</h3>
      <p>Matches the <strong>words</strong>: coffee beans, coffee makers, anything that says “coffee”. It did exactly what we asked.</p>
    </div>
  </div>
</div>

<!--
1:00-3:00. Hook. Optionally flip to the UI "Classic vs Agentic" tab and run this live.
Say: "Nothing is broken. The engine matched words. I asked in words, but I meant a need."
-->

---

<!-- _class: section-divider-blue-a -->

# Why search breaks

---

<!-- _class: body-accent lr-chrome-skip ppt-appealing-layout layout-split-cards-2x2-headings -->

<div class="ppt-split-cards">
  <div class="ppt-split-cards__intro">
    <h2>Users describe needs, not queries</h2>
    <p>Traditional search assumes the user knows <strong>what to ask</strong> and <strong>where to look</strong>. Four real queries from the demo catalog show where that breaks.</p>
  </div>
  <div class="ppt-split-cards__grid ppt-split-cards__grid--2x2">
    <div class="ppt-accent-card"><h3>Needs, not keywords</h3><p>“keep my coffee hot” means a thermos, not coffee.</p></div>
    <div class="ppt-accent-card"><h3>Hidden constraints</h3><p>“nike running shoes under 100 dollars” is a brand, a category and a price filter.</p></div>
    <div class="ppt-accent-card"><h3>Messy input</h3><p>“samsng phone”, “sasta laal lipstick”: typos and Hinglish.</p></div>
    <div class="ppt-accent-card"><h3>Wrong place to look</h3><p>“can I return perfume?” is a policy question, not a product search.</p></div>
  </div>
</div>

<!--
3:00-5:00. India angle: "Our users type in Hinglish, abbreviate and misspell brands. Query understanding isn't nice-to-have for us, it's table stakes."
We spent 20 years teaching users to speak search engine. Agentic search flips it.
-->

---

<!-- _class: body-accent lr-chrome-skip layout-quote-single-dark -->

# The idea in one line

> “The agent decides what to search. Elasticsearch still decides what's relevant.”

<p class="qs-by">The design principle for the rest of this talk</p>

<!-- 5:00-5:30. Pause. Let it land. -->

---

<!-- _class: section-divider-teal-a -->

# The autonomy ladder

---

<!-- _class: body-accent lr-chrome-skip layout-roadmap-pills-dark -->

# “Agentic” is a ladder, not a switch

<p class="rm-sub">Each rung hands one more decision from the user to the model. Pick the rung per use case.</p>

<div class="rm-track">
  <div class="rm-phase"><span class="rm-pill">L1 Hybrid</span><p class="rm-cap">BM25 + vectors + rerank. The engine decides relevance.</p></div>
  <div class="rm-dash" aria-hidden="true"></div>
  <div class="rm-phase"><span class="rm-pill">L2 Understand</span><p class="rm-cap">The LLM picks filters, fixes typos, rewrites.</p></div>
  <div class="rm-dash" aria-hidden="true"></div>
  <div class="rm-phase"><span class="rm-pill">L3 Route</span><p class="rm-cap">The LLM picks where to search, retries on zero hits.</p></div>
  <div class="rm-dash" aria-hidden="true"></div>
  <div class="rm-phase"><span class="rm-pill">L4 Agent</span><p class="rm-cap">The agent picks which searches and how many, then combines.</p></div>
</div>

<!--
5:30-8:00. L0 is plain keyword search: the user decides everything.
"Most teams jump straight to L4 because it demos well. In production most value sits at L2 and L3: deterministic, fast, debuggable. The L4 agent should CALL L2/L3 as a tool, not replace it."
-->

---

<!-- _class: body-accent lr-chrome-skip ppt-appealing-layout layout-split-blue-rail -->

<div class="ppt-split-blue-rail">
  <div class="ppt-split-blue-rail__aside">
    <h2>Give each job to the right component</h2>
    <p>The LLM is good at judgement and bad at retrieval. Elasticsearch is the opposite. Keep them in their lanes.</p>
  </div>
  <div class="ppt-split-blue-rail__main">
    <div class="ppt-split-blue-rail__row"><img class="rail-ico" src="brain.png" alt="" /><p><strong>LLM for judgement</strong>: intent, filters, rewrite, route, as structured JSON.</p></div>
    <div class="ppt-split-blue-rail__row"><img class="rail-ico" src="vector_search.png" alt="" /><p><strong>Elasticsearch for retrieval</strong>: hybrid search, RRF, reranking, aggregations.</p></div>
    <div class="ppt-split-blue-rail__row"><img class="rail-ico" src="two_gears.png" alt="" /><p><strong>Workflows for control</strong>: deterministic steps, guardrails, a trace for every run.</p></div>
    <div class="ppt-split-blue-rail__row"><img class="rail-ico" src="plugin.png" alt="" /><p><strong>Agent Builder for reach</strong>: the same pipeline as an API, a chat agent, MCP and A2A.</p></div>
  </div>
</div>

<!-- 8:00-9:00. This is the architecture in one slide. -->

---

<!-- _class: section-divider-dev-blue-a -->

# Built natively in Elastic

---

<!-- _class: diagram-slide diagram-wide -->

# One API call, one workflow, zero glue code

![Architecture: UI calls one Agent Builder tool that runs a Kibana workflow: understand, plan, route, respond, using EIS and Elasticsearch](agentic_architecture.svg)

<!--
9:00-11:00. Walk left to right.
"The UI makes one call. Everything else runs inside Elastic. No LangChain service, no Lambda."
Per request: one LLM call + one search (two if the zero-hit retry fires).
-->

---

<!-- _class: code-slide -->

# The LLM fills a schema. It never writes query DSL.

<div class="cols">
<div class="col">

## 1 · ai.prompt output (JSON schema)

```json
{
  "intent": "product_search",
  "search_text": "running shoes",
  "categories": ["mens-shoes", "womens-shoes"],
  "brands": ["Nike"],
  "price_max": 100,
  "sort_by": "relevance",
  "reasoning": "Nike running shoes, $100 cap"
}
```

<p class="note">Grounded: the prompt carries the <strong>real</strong> category and brand list from the index, so “samsng” becomes Samsung.</p>

</div>
<div class="col">

## 2 · stored search template (mustache)

```json
"filter": [
  { "bool": { "should": [
    {{#brands}}{ "term": { "brand": "{{.}}" } },{{/brands}}
    {{^brands}}{ "match_all": {} },{{/brands}}
    { "match_none": {} } ] } },
  {{#price_max}}
  { "range": { "price": { "lte": {{price_max}} } } },
  {{/price_max}}
  { "match_all": {} }
]
```

<p class="note">The query is written and tested by us. The model only supplies parameters, so a bad answer can't produce a bad query.</p>

</div>
</div>

<!--
11:00-13:00. The most important design choice in the talk.
"That's the difference between a demo and something that passes a bank's security review."
-->

---

<!-- _class: diagram-slide diagram-wide -->

# Hybrid retrieval, reranking, self-correction

![Template params feed BM25 and semantic retrieval, fused by RRF, reranked by Jina v3; if zero hits, relax filters and retry](retrieval_pipeline.svg)

<!--
13:00-14:30. semantic_text on EIS: no model hosting, multilingual. RRF fuses. Reranker makes the top 12 the best 12.
Self-correction is the "agentic" part here: the workflow notices zero hits and changes strategy.
-->

---

<!-- _class: body-accent lr-chrome-skip ppt-appealing-layout layout-cards-grid-2x3 -->

<div class="ppt-grid-page">
  <h2 class="ppt-grid-page__title">Six Elastic building blocks, no extra services</h2>
  <div class="ppt-card-grid--2x3">
    <div class="ppt-accent-card"><h3>semantic_text on EIS</h3><p>Jina v5 embeddings created at ingest. No model hosting.</p></div>
    <div class="ppt-accent-card"><h3>Retrievers</h3><p>rrf fuses BM25 and semantic results in one request.</p></div>
    <div class="ppt-accent-card"><h3>Reranker</h3><p>text_similarity_reranker with Jina reranker v3.</p></div>
    <div class="ppt-accent-card"><h3>Search templates</h3><p>Tested query shapes. The LLM fills parameters only.</p></div>
    <div class="ppt-accent-card"><h3>Workflows</h3><p>ai.prompt, switch, if, data.set, workflow.output in YAML.</p></div>
    <div class="ppt-accent-card"><h3>Agent Builder</h3><p>Workflow tools, ES|QL tools, agents, MCP and A2A.</p></div>
  </div>
</div>

<!-- 14:30-15:00. Quick recap before the demo. -->

---

<!-- _class: section-divider-blue-b -->

# Live demo

---

<!-- _class: body-accent lr-chrome-skip layout-timeline-horizontal-white -->

# Demo run-sheet

<p class="tl-sub">ShopSphere: 194 real products with images, 20 help-centre articles, one Elastic Serverless project.</p>

<div class="tl-wrap">
  <div class="tl-line" aria-hidden="true"></div>
  <div class="tl-nodes">
    <span class="tl-node" aria-hidden="true"></span>
    <span class="tl-node" aria-hidden="true"></span>
    <span class="tl-node" aria-hidden="true"></span>
    <span class="tl-node" aria-hidden="true"></span>
  </div>
</div>
<div class="tl-grid">
  <div class="tl-col"><h3>1 · Classic vs agentic</h3><p>“keep my coffee hot on a long drive”, “red lipstick sasta”</p></div>
  <div class="tl-col"><h3>2 · Understand</h3><p>“nike running shoes under 100 dollars”, “samsng phone”, “cheapest laptop in stock”</p></div>
  <div class="tl-col"><h3>3 · Route + self-correct</h3><p>“best rated laptop brand?”, “can I return perfume?”, “capital of France”, “gucci running shoes”</p></div>
  <div class="tl-col"><h3>4 · The agent decides</h3><p>“Goa beach trip, $150 total. What should I pack?”</p></div>
</div>

<!--
15:00-25:00. Switch to the UI (localhost:8080). ~2.5 min per column.
In tab 1, open the JSON drawer once: Response, Search-template params, Workflow execution trace.
Fallback: if the network fails, use screenshots / Kibana workflow execution history.
-->

---

<!-- _class: code-slide -->

# Still Elasticsearch JSON, plus the reason why

<div class="cols">
<div class="col">

## What the API returns

```json
{
  "took": 41,
  "hits": {
    "total": { "value": 7 },
    "hits": [
      { "_score": 0.93,
        "_source": { "title": "Nike Air Jordan 1…",
                     "brand": "Nike", "price": 89.99 } }
    ]
  },
  "agentic": {
    "route": "product_search",
    "rewritten_query": "running shoes",
    "relaxed_fallback": false,
    "execution_id": "…"
  }
}
```

</div>
<div class="col">

## Why that matters

- **Your front-end doesn't change**: same `took`, `hits`, `aggregations`
- **Explainable**: the `agentic` block says what was decided and why
- **Traceable**: every run has an execution trace in Kibana, step by step
- **Reusable**: the same tool serves the UI, the agent, and MCP / A2A clients

</div>
</div>

<!-- Show this right after demo step 2, or skip if time is short. Values shown are illustrative. -->

---

<!-- _class: diagram-slide diagram-wide -->

# L4: the agent decides what, and how often, to search

![Agent Builder agent splits a trip goal into four searches, calls the agentic search tool for each, then combines results within budget](agent_loop.svg)

<!--
Demo step 4. "I didn't write this plan. The agent did. And every search it ran is the same guardrailed pipeline from L2/L3."
-->

---

<!-- _class: section-divider-teal-b -->

# What it costs, and where to start

---

# Trade-offs, and how we handled them

| Concern | What we did in the demo |
|---|---|
| **Latency** | One LLM call per search, a small fast model on EIS, `reasoning-level: none`, catalog list built into the prompt |
| **Wrong answers** | JSON schema output, index vocabulary in the prompt, stored templates, zero-hit fallback |
| **Debuggability** | Every run has a workflow execution trace; the response carries the decisions |
| **Cost** | Agent (L4) only for goals; single searches stay at L2/L3 |
| **Lock-in** | Standard ES JSON out; the tool is exposed over MCP and A2A |

<!--
25:00-27:00. Be honest: L4 agent responses take several seconds; L2/L3 search is one model call.
Run `python3 setup.py --timing` beforehand and quote your real numbers here.
-->

---

<!-- _class: body-accent lr-chrome-skip ppt-appealing-layout layout-three-cards-teal-border -->

<div class="tct-head">
  <h2>Start on Monday</h2>
  <p>You don't need a new stack. Put a thin agentic layer in front of the index you already have.</p>
</div>
<div class="tct-row">
  <div class="tct-card"><img class="tct-img" src="filters_facets.png" alt="" /><h3>1 · Understand</h3><p>One workflow: ai.prompt → search template on your existing index.</p></div>
  <div class="tct-card"><img class="tct-img" src="multiple_directions.png" alt="" /><h3>2 · Route</h3><p>Add a switch for your second index and a zero-hit fallback.</p></div>
  <div class="tct-card"><img class="tct-img" src="automation_with_AI.png" alt="" /><h3>3 · Expose</h3><p>Wrap it as an Agent Builder tool. Let agents call it over MCP.</p></div>
</div>

<!-- 27:00-28:00. Call to action. Then thank you + Q&A. -->

---

<!-- _class: closing -->

# Thank you!

<p class="closing-sub">Questions? The demo project: workflows, templates, agent and UI.</p>
