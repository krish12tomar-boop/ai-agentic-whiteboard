"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";

import {
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

type Props = {
  excalidrawApi: ExcalidrawImperativeAPI | null;
  onClose: () => void;
};

type StylePreset = {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  radius: number;
};

type AiTool = {
  name: string;
  desc: string;
  icon: string;
  color: string;
  bgcolor: string;
  prompt: string;
  suggestions: string[];
};

type DiagramElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;

  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  fillStyle?: string;
  roughness?: number;
  opacity?: number;

  fontSize?: number;
  fontFamily?: number | string;
  textAlign?: string;
  verticalAlign?: string;

  roundness?: number;
  label?: string;

  role?: string;
  parentId?: string;
  variant?: string;
  zIndex?: number;
};

type DiagramConnection = {
  id: string;
  from: string;
  to: string;
  label?: string;

  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;

  startArrowhead?: string;
  endArrowhead?: string;
};

type DiagramResult = {
  title: string;
  width?: number;
  height?: number;
  elements: DiagramElement[];
  connections: DiagramConnection[];
};

/* =========================================================
   STYLE PRESETS
========================================================= */

const STYLE_PRESETS: StylePreset[] = [
  {
    name: "Modern Minimal",
    description: "Clean, bright and presentation-friendly",
    primary: "#2563EB",
    secondary: "#64748B",
    accent: "#06B6D4",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
    radius: 16,
  },
  {
    name: "SaaS Pro",
    description: "Modern product and SaaS visual language",
    primary: "#4F46E5",
    secondary: "#6366F1",
    accent: "#8B5CF6",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
    radius: 14,
  },
  {
    name: "Midnight",
    description: "Premium dark technical presentation style",
    primary: "#60A5FA",
    secondary: "#94A3B8",
    accent: "#22D3EE",
    background: "#0F172A",
    surface: "#111827",
    text: "#F8FAFC",
    muted: "#94A3B8",
    border: "#334155",
    radius: 16,
  },
  {
    name: "Soft Gradient",
    description: "Contemporary visual product style",
    primary: "#7C3AED",
    secondary: "#6366F1",
    accent: "#EC4899",
    background: "#FAF5FF",
    surface: "#FFFFFF",
    text: "#1E1B4B",
    muted: "#6B7280",
    border: "#E9D5FF",
    radius: 18,
  },
  {
    name: "Enterprise",
    description: "Structured corporate architecture style",
    primary: "#0F766E",
    secondary: "#475569",
    accent: "#0284C7",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#CBD5E1",
    radius: 12,
  },
];

/* =========================================================
   AI TOOL PROMPTS
========================================================= */

const AiTools: AiTool[] = [
  {
    name: "Generate Diagrams",
    desc: "Create polished diagrams from natural language",
    icon: "✦",
    color: "#4F46E5",
    bgcolor: "#EEF2FF",

    suggestions: [
      "User login flow",
      "E-commerce system",
      "AI workflow",
      "Project lifecycle",
    ],

    prompt: `
You are an expert information architect, systems designer and visual communication designer.

Your task is to transform even a very short or vague user request into a complete, polished, presentation-ready diagram.

Do NOT simply visualize the exact words supplied by the user.

Instead:
- Understand the likely intent.
- Infer sensible missing steps, entities, relationships and supporting details.
- Build a coherent visual story.
- Remove unnecessary complexity.
- Prefer clarity over quantity.
- Make reasonable assumptions when the request is underspecified.
- Never ask the user for clarification.
- Produce the finished visual structure directly.

DESIGN QUALITY:

Create a modern professional diagram comparable to a high-quality product design document or technical presentation.

Use:
- strong visual hierarchy
- consistent node dimensions
- consistent spacing
- aligned rows and columns
- balanced whitespace
- restrained modern colors
- subtle borders
- rounded corners where appropriate
- clear typography
- consistent stroke widths
- clean directional connectors
- minimal visual noise
- concise labels

LAYOUT:

Prefer:
- left-to-right for systems and relationships
- top-to-bottom for sequential processes
- centered hierarchy for organizational structures
- grouped sections for related concepts

Never scatter elements randomly.

Use a consistent spacing system such as:
8 / 16 / 24 / 32 / 48 / 64 / 80 pixels.

Maintain visual rhythm throughout the entire canvas.

SEMANTIC STRUCTURE:

Every meaningful element should use an appropriate role.

Possible roles include:
container
group
node
process
decision
start
end
service
database
client
frontend
backend
api
external-service
heading
paragraph
card
input
button
navigation
connector

Use parentId when an element belongs inside another visual container.

Use zIndex to establish intentional visual layering.

CONNECTORS:

Connections must:
- reference valid element IDs
- clearly communicate direction
- originate from the correct side of nodes
- avoid unnecessary crossings
- avoid passing through node bodies
- use labels only when useful
- use arrowheads appropriately

Do not create decorative connections that do not communicate meaning.

PRESENTATION QUALITY:

The final diagram must look finished without requiring manual cleanup.

Use concise professional wording.

Avoid:
- excessive text
- random colors
- excessive decoration
- unnecessary icons
- inconsistent sizing
- overlapping unrelated nodes
- awkward empty areas
- tiny unreadable labels

The result should look like a deliberately designed professional artifact rather than raw AI output.

Return only the structured JSON requested by the schema.
`,
  },

  {
    name: "Flowchart",
    desc: "Build clean process flows and decision trees",
    icon: "⌁",
    color: "#0891B2",
    bgcolor: "#ECFEFF",

    suggestions: [
      "User signup",
      "Checkout process",
      "Support ticket flow",
      "Approval workflow",
    ],

    prompt: `
You are an expert process designer and professional UX information architect.

Transform even a very short user request into a complete, logically correct, presentation-ready flowchart.

Do not merely repeat the user's words.

Infer the most sensible missing process steps and create a realistic end-to-end workflow.

Never ask for clarification.

FLOWCHART STRUCTURE:

Use clear semantic roles:

start
process
decision
subprocess
input
output
end

Use:
- rounded/ellipse shapes for Start and End
- rounded rectangles or clean rectangles for processes
- diamonds for decisions
- consistent node dimensions
- clear labels
- directional arrows

LAYOUT:

Prefer a clean top-to-bottom structure.

Use approximately:
48–80px vertical spacing
40–64px horizontal spacing

Align related nodes into consistent columns.

Branch decisions cleanly.

Decision branches should use meaningful labels such as:
Yes / No
Approved / Rejected
Valid / Invalid
Success / Failure

Avoid unnecessary connector crossings.

Never place nodes randomly.

VISUAL DESIGN:

Use a restrained modern professional palette.

Use:
- one primary accent
- one secondary accent
- neutral backgrounds
- subtle borders
- consistent typography
- consistent corner radius
- consistent stroke width

Keep the entire flowchart visually balanced.

TEXT:

Use short, readable labels.

Automatically wrap long labels.

Do not put paragraphs inside nodes.

QUALITY:

The result must look suitable for:
- product documentation
- engineering documentation
- business presentations
- technical presentations
- product planning

Infer missing steps when the prompt is incomplete.

Do not add unnecessary complexity merely to make the diagram larger.

Every element must have a semantic role.

Use parentId for grouped process sections where appropriate.

Use zIndex when layering is required.

Return only structured JSON matching the supplied schema.
`,
  },

  {
    name: "Architecture",
    desc: "Design modern software and system architecture",
    icon: "⬡",
    color: "#7C3AED",
    bgcolor: "#F5F3FF",

    suggestions: [
      "SaaS application",
      "AI chatbot",
      "E-commerce platform",
      "Mobile backend",
    ],

    prompt: `
You are a senior software architect and technical presentation designer.

Transform even a short user request into a complete, realistic, modern and presentation-ready system architecture.

Do not merely echo the user's requested technology names.

Infer sensible supporting layers and services when required.

Never ask the user for clarification.

ARCHITECTURE THINKING:

When appropriate, organize systems into layers such as:

Users / Clients
↓
Web / Mobile Frontend
↓
API / Gateway
↓
Application / Business Services
↓
Data / Storage
↓
External Services / AI / Infrastructure

Do not force all layers when they are not relevant.

Only include components that make architectural sense.

SEMANTIC ROLES:

Use roles such as:

client
mobile-client
web-client
frontend
gateway
api
service
backend
worker
queue
database
cache
storage
ai-service
external-service
authentication
monitoring
container
group

Use parentId for logical architecture boundaries.

LAYOUT:

Create clear architectural layers.

Use:
- consistent node widths
- consistent node heights
- aligned columns
- balanced whitespace
- predictable spacing
- clear hierarchy

Prefer a left-to-right or top-to-bottom data flow.

Related services should be grouped visually.

Do not create a tangled network of lines.

CONNECTORS:

Connections should clearly communicate:
- request flow
- data flow
- dependency
- event flow
- external integration

Use arrowheads where direction matters.

Avoid crossing lines whenever a cleaner route is possible.

VISUAL STYLE:

Create a premium modern technical design.

Use:
- subtle neutral surfaces
- one primary accent
- restrained secondary accents
- clear borders
- rounded containers
- professional typography
- consistent icon-like visual treatment through shapes
- generous whitespace

Do not make every component a different color.

PRESENTATION-READY:

The architecture should look appropriate for a technical presentation or architecture review.

Use concise component names.

Add small useful labels where they clarify protocols or relationships.

Avoid unnecessary implementation detail unless implied by the request.

Even if the user says something as short as:

"AI chatbot architecture"

produce a complete sensible architecture such as:

Client
→ UI
→ API
→ Authentication
→ AI orchestration
→ Model provider
→ Conversation storage
→ Observability

while avoiding unnecessary components.

Return only structured JSON matching the supplied schema.
`,
  },

  {
    name: "Web Mockup",
    desc: "Generate polished modern desktop UI mockups",
    icon: "▣",
    color: "#2563EB",
    bgcolor: "#EFF6FF",

    suggestions: [
      "Analytics dashboard",
      "Landing page",
      "Admin dashboard",
      "Pricing page",
    ],

    prompt: `
You are a world-class product designer specializing in modern SaaS, enterprise and consumer web interfaces.

Transform even an extremely short user request into a complete polished desktop web UI mockup.

If the user says only:

"dashboard"

do not create a few random boxes.

Infer a complete realistic dashboard experience with:
- browser/page frame
- top navigation
- branding
- navigation/sidebar where appropriate
- page title
- supporting information
- primary actions
- meaningful content sections
- cards
- metrics
- tables/charts/forms when appropriate
- realistic empty states or supporting UI where useful

Never ask the user for clarification.

CANVAS:

Assume approximately:
1440 × 900 desktop viewport

Use a professional responsive-style grid.

DESIGN SYSTEM:

Use a consistent:
8px spacing system

Common spacing:
8 / 16 / 24 / 32 / 48 / 64

Use consistent:
- typography hierarchy
- border radius
- card padding
- button height
- input height
- border treatment
- alignment
- visual density

VISUAL LANGUAGE:

Default to a modern premium SaaS/product design.

Prefer:
- clean white or subtle neutral surfaces
- restrained accent colors
- subtle borders
- generous whitespace
- clear headings
- compact supporting text
- professional cards
- minimal decoration

Avoid:
- random gradients everywhere
- excessive shadows
- excessive colors
- unnecessary icons
- inconsistent card sizes
- random positioning
- clutter

SEMANTIC ROLES:

Use roles such as:

browser-frame
header
navigation
sidebar
content
section
heading
paragraph
card
metric-card
chart
table
table-row
input
button
badge
avatar
footer

Use parentId to establish hierarchy.

For example:

browser-frame
 ├── header
 ├── sidebar
 └── content
      ├── section
      │    ├── heading
      │    └── metric-card
      └── section
           └── table

IMPORTANT CONTAINMENT RULE:

Web UI elements are intentionally nested inside their parent containers.

Do NOT treat parent/child containment as accidental overlap.

Do NOT use generic collision-removal logic conceptually.

Children should remain visually inside their intended parent containers.

LAYOUT:

Create a deliberate grid.

Align:
- headers
- cards
- columns
- forms
- tables
- navigation

Keep equal gutters.

Ensure no content accidentally touches the browser edges.

Use responsive-like proportions even though the final output is an Excalidraw mockup.

TEXT:

Use realistic concise product copy.

Do not use long paragraphs.

Automatically wrap longer text.

PRESENTATION QUALITY:

The result should look like a finished product design concept suitable for:
- product presentations
- portfolio screenshots
- UX reviews
- stakeholder demos

Do not create a wireframe unless the user explicitly asks for one.

Create a polished high-fidelity visual structure.

Return only structured JSON matching the supplied schema.
`,
  },

  {
    name: "Mobile Mockup",
    desc: "Create polished modern mobile app screens",
    icon: "▯",
    color: "#DB2777",
    bgcolor: "#FDF2F8",

    suggestions: [
      "Login screen",
      "Finance dashboard",
      "Food delivery home",
      "Profile screen",
    ],

    prompt: `
You are a world-class mobile product designer specializing in modern iOS and Android application interfaces.

Transform even an extremely short user request into a complete polished mobile app screen.

Never ask for clarification.

Infer the missing interface structure intelligently.

For example, if the user says:

"login"

create a complete professional authentication experience including appropriate:
- device frame
- status bar
- branding
- heading
- supporting text
- input fields
- primary CTA
- secondary actions
- authentication alternatives where appropriate
- legal/support text where useful

Do not create every possible component. Choose the components that make sense.

CANVAS:

Assume approximately:
390 × 844 mobile viewport

Use:
24px outer content margins
8px spacing system

Typical spacing:
8 / 12 / 16 / 24 / 32 / 40

DESIGN LANGUAGE:

Create a modern production-quality mobile UI.

Prefer:
- clean surfaces
- strong typography hierarchy
- subtle borders
- restrained shadows
- clear primary CTA
- accessible contrast
- consistent corner radius
- comfortable touch targets

Buttons and inputs should generally feel touch-friendly.

SEMANTIC ROLES:

Use roles such as:

device-frame
statusbar
header
back-button
navigation
content
section
heading
paragraph
logo
input
button
secondary-button
link
card
list
list-item
badge
bottom-navigation
navigation-item
illustration

Use parentId to express containment.

Example:

device-frame
 ├── statusbar
 ├── header
 ├── content
 │    ├── heading
 │    ├── input
 │    └── button
 └── bottom-navigation

IMPORTANT CONTAINMENT RULE:

Mobile UI elements are intentionally nested inside the phone/device frame.

Do NOT treat child elements overlapping the device frame as accidental collisions.

Do NOT use a generic overlap-removal algorithm.

The device frame is a parent container and UI components should remain inside it.

LAYOUT:

Use a strict vertical rhythm.

Primary content should flow naturally from top to bottom.

Keep bottom navigation anchored near the bottom when present.

Do not allow content to collide with the bottom navigation.

Keep meaningful whitespace.

Avoid random coordinates.

TEXT:

Use concise realistic product copy.

Automatically wrap long labels and descriptions.

Do not create unnecessary paragraphs.

QUALITY:

The final mockup should look like a polished modern product screen that requires minimal or no manual cleanup.

It should be suitable for:
- product presentations
- portfolio work
- design reviews
- app concept demonstrations

Return only structured JSON matching the supplied schema.
`,
  },
];

/* =========================================================
   HELPERS
========================================================= */

const AI_PLACEHOLDER_IDS = {
  container: "ai-placeholder-container",
  title: "ai-placeholder-title",
  subtitle: "ai-placeholder-subtitle",
  skeleton1: "ai-placeholder-skeleton-1",
  skeleton2: "ai-placeholder-skeleton-2",
  skeleton3: "ai-placeholder-skeleton-3",
  skeleton4: "ai-placeholder-skeleton-4",
  skeleton5: "ai-placeholder-skeleton-5",
};

const getSafeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const safeNumber = (
  value: unknown,
  fallback: number
): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const safeColor = (
  value: unknown,
  fallback: string
): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  const color = value.trim();

  if (
    /^#[0-9A-Fa-f]{6}$/.test(color) ||
    /^#[0-9A-Fa-f]{3}$/.test(color)
  ) {
    return color;
  }

  return fallback;
};

const clamp = (
  value: number,
  min: number,
  max: number
) => {
  return Math.max(min, Math.min(max, value));
};

/* =========================================================
   TEXT WRAPPING
========================================================= */

const wrapText = (
  text: string,
  maxWidth: number,
  fontSize: number
) => {
  const clean = getSafeText(text).trim();

  if (!clean) {
    return "";
  }

  const approximateCharacterWidth =
    Math.max(5, fontSize * 0.52);

  const maxCharacters = Math.max(
    8,
    Math.floor(maxWidth / approximateCharacterWidth)
  );

  const originalLines = clean.split(/\r?\n/);
  const wrappedLines: string[] = [];

  originalLines.forEach((line) => {
    const words = line.split(/\s+/);
    let currentLine = "";

    words.forEach((word) => {
      if (!currentLine) {
        currentLine = word;
        return;
      }

      const candidate =
        `${currentLine} ${word}`;

      if (candidate.length <= maxCharacters) {
        currentLine = candidate;
      } else {
        wrappedLines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  });

  return wrappedLines.join("\n");
};

/* =========================================================
   BOUNDS
========================================================= */

const getElementBounds = (
  element: DiagramElement
) => {
  const x = safeNumber(element.x, 0);
  const y = safeNumber(element.y, 0);

  const width = Math.max(
    1,
    safeNumber(
      element.width,
      element.type === "text"
        ? 160
        : 200
    )
  );

  const height = Math.max(
    1,
    safeNumber(
      element.height,
      element.type === "text"
        ? 40
        : 80
    )
  );

  return {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
  };
};

const rectanglesOverlap = (
  a: DiagramElement,
  b: DiagramElement,
  gap = 16
) => {
  const A = getElementBounds(a);
  const B = getElementBounds(b);

  return !(
    A.right + gap <= B.left ||
    B.right + gap <= A.left ||
    A.bottom + gap <= B.top ||
    B.bottom + gap <= A.top
  );
};

/* =========================================================
   NORMALIZE ELEMENT SIZES
========================================================= */

const normalizeElementSizes = (
  elements: DiagramElement[],
  toolName: string
) => {
  return elements.map((element) => {
    const type = getSafeText(
      element.type
    ).toLowerCase();

    const role = getSafeText(
      element.role
    ).toLowerCase();

    let width = safeNumber(
      element.width,
      type === "text"
        ? 180
        : 220
    );

    let height = safeNumber(
      element.height,
      type === "text"
        ? 40
        : 90
    );

    if (type === "text") {
      width = Math.max(width, 120);
      height = Math.max(height, 32);
    }

    if (
      toolName === "Mobile Mockup"
    ) {
      if (role === "button") {
        height = Math.max(height, 48);
      }

      if (role === "input") {
        height = Math.max(height, 48);
      }

      if (
        role === "bottom-navigation"
      ) {
        height = Math.max(height, 64);
      }
    }

    if (
      toolName === "Web Mockup"
    ) {
      if (role === "button") {
        height = Math.max(height, 40);
      }

      if (role === "input") {
        height = Math.max(height, 42);
      }
    }

    const fontSize = safeNumber(
      element.fontSize,
      role === "heading"
        ? 24
        : 16
    );

    const originalText =
      element.text ||
      element.label ||
      "";

    const wrappedText =
      originalText
        ? wrapText(
            originalText,
            width - 24,
            fontSize
          )
        : originalText;

    return {
      ...element,
      width,
      height,
      text: wrappedText,
      label: element.label
        ? wrapText(
            element.label,
            width - 24,
            fontSize
          )
        : element.label,
      roughness: 0,
      strokeWidth: safeNumber(
        element.strokeWidth,
        1.5
      ),
      opacity: safeNumber(
        element.opacity,
        100
      ),
    };
  });
};

/* =========================================================
   GENERIC OVERLAP REMOVAL
   IMPORTANT:
   THIS IS NOT USED FOR WEB/MOBILE MOCKUPS.
========================================================= */

const removeOverlaps = (
  elements: DiagramElement[],
  gap = 20
) => {
  const result = elements.map(
    (element) => ({
      ...element,
    })
  );

  for (
    let i = 0;
    i < result.length;
    i++
  ) {
    const current = result[i];

    for (
      let j = 0;
      j < i;
      j++
    ) {
      const previous = result[j];

      /*
       * Parent-child overlap is intentional.
       */
      if (
        current.parentId &&
        current.parentId ===
          previous.id
      ) {
        continue;
      }

      if (
        previous.parentId &&
        previous.parentId ===
          current.id
      ) {
        continue;
      }

      /*
       * If both belong to the same
       * parent, they are sibling UI
       * elements. For diagram layouts
       * this still means accidental overlap.
       */
      if (
        rectanglesOverlap(
          current,
          previous,
          gap
        )
      ) {
        const previousBounds =
          getElementBounds(
            previous
          );

        const currentBounds =
          getElementBounds(
            current
          );

        const moveDown =
          previousBounds.bottom +
          gap -
          currentBounds.top;

        if (moveDown > 0) {
          current.y =
            safeNumber(
              current.y,
              0
            ) + moveDown;
        }
      }
    }
  }

  return result;
};

/* =========================================================
   CONTAINMENT-AWARE MOCKUP LAYOUT
========================================================= */

const buildElementMap = (
  elements: DiagramElement[]
) => {
  const map = new Map<
    string,
    DiagramElement
  >();

  elements.forEach(
    (element) => {
      map.set(element.id, element);
    }
  );

  return map;
};

const keepChildrenInsideParents = (
  elements: DiagramElement[],
  options: {
    horizontalPadding: number;
    verticalPadding: number;
    bottomPadding: number;
  }
) => {
  const result = elements.map(
    (element) => ({
      ...element,
    })
  );

  const map =
    buildElementMap(result);

  result.forEach((element) => {
    if (!element.parentId) {
      return;
    }

    const parent =
      map.get(element.parentId);

    if (!parent) {
      return;
    }

    const parentBounds =
      getElementBounds(parent);

    const childBounds =
      getElementBounds(element);

    const minX =
      parentBounds.left +
      options.horizontalPadding;

    const maxX =
      parentBounds.right -
      options.horizontalPadding -
      childBounds.width;

    const minY =
      parentBounds.top +
      options.verticalPadding;

    const maxY =
      parentBounds.bottom -
      options.bottomPadding -
      childBounds.height;

    if (maxX >= minX) {
      element.x = clamp(
        safeNumber(
          element.x,
          minX
        ),
        minX,
        maxX
      );
    } else {
      element.x = minX;
    }

    if (maxY >= minY) {
      element.y = clamp(
        safeNumber(
          element.y,
          minY
        ),
        minY,
        maxY
      );
    } else {
      element.y = minY;
    }
  });

  return result;
};

/* =========================================================
   MOBILE LAYOUT
========================================================= */

const normalizeMobileLayout = (
  elements: DiagramElement[]
) => {
  const result =
    elements.map(
      (element) => ({
        ...element,
      })
    );

  const device =
    result.find(
      (element) =>
        element.role ===
          "device-frame" ||
        element.role ===
          "phone-frame" ||
        element.variant ===
          "device"
    );

  if (!device) {
    return result;
  }

  const deviceBounds =
    getElementBounds(device);

  /*
   * The device frame is the outer
   * containment boundary.
   */
  const contentLeft =
    deviceBounds.left + 24;

  const contentRight =
    deviceBounds.right - 24;

  const contentTop =
    deviceBounds.top + 48;

  const contentBottom =
    deviceBounds.bottom - 24;

  result.forEach(
    (element) => {
      if (
        element.id ===
        device.id
      ) {
        return;
      }

      const role =
        getSafeText(
          element.role
        ).toLowerCase();

      /*
       * Bottom navigation gets
       * special anchoring.
       */
      if (
        role ===
        "bottom-navigation"
      ) {
        const bounds =
          getElementBounds(
            element
          );

        element.x =
          deviceBounds.left +
          Math.max(
            12,
            (
              deviceBounds.width -
              bounds.width
            ) / 2
          );

        element.y =
          deviceBounds.bottom -
          bounds.height -
          12;

        return;
      }

      /*
       * Status bar is anchored
       * near the top.
       */
      if (
        role ===
        "statusbar"
      ) {
        element.x =
          deviceBounds.left +
          16;

        element.y =
          deviceBounds.top +
          10;

        return;
      }

      const bounds =
        getElementBounds(
          element
        );

      const maxX =
        contentRight -
        bounds.width;

      const maxY =
        contentBottom -
        bounds.height;

      element.x = clamp(
        safeNumber(
          element.x,
          contentLeft
        ),
        contentLeft,
        Math.max(
          contentLeft,
          maxX
        )
      );

      element.y = clamp(
        safeNumber(
          element.y,
          contentTop
        ),
        contentTop,
        Math.max(
          contentTop,
          maxY
        )
      );
    }
  );

  /*
   * Respect semantic parent
   * relationships after the main
   * device boundary is established.
   */
  return keepChildrenInsideParents(
    result,
    {
      horizontalPadding: 12,
      verticalPadding: 8,
      bottomPadding: 8,
    }
  );
};

/* =========================================================
   WEB LAYOUT
========================================================= */

const normalizeWebLayout = (
  elements: DiagramElement[]
) => {
  const result =
    elements.map(
      (element) => ({
        ...element,
      })
    );

  const browser =
    result.find(
      (element) =>
        element.role ===
          "browser-frame" ||
        element.role ===
          "web-frame"
    );

  if (!browser) {
    return result;
  }

  const browserBounds =
    getElementBounds(browser);

  result.forEach(
    (element) => {
      if (
        element.id ===
        browser.id
      ) {
        return;
      }

      const role =
        getSafeText(
          element.role
        ).toLowerCase();

      const bounds =
        getElementBounds(
          element
        );

      /*
       * Browser header stays near
       * the top.
       */
      if (
        role === "header"
      ) {
        element.x =
          browserBounds.left;

        element.y =
          browserBounds.top;

        return;
      }

      /*
       * Sidebar stays against
       * the left side.
       */
      if (
        role === "sidebar"
      ) {
        element.x =
          browserBounds.left;

        element.y =
          browserBounds.top +
          64;

        return;
      }

      /*
       * Everything else remains
       * inside the browser boundary.
       */
      const minX =
        browserBounds.left +
        16;

      const maxX =
        browserBounds.right -
        16 -
        bounds.width;

      const minY =
        browserBounds.top +
        16;

      const maxY =
        browserBounds.bottom -
        16 -
        bounds.height;

      element.x = clamp(
        safeNumber(
          element.x,
          minX
        ),
        minX,
        Math.max(
          minX,
          maxX
        )
      );

      element.y = clamp(
        safeNumber(
          element.y,
          minY
        ),
        minY,
        Math.max(
          minY,
          maxY
        )
      );
    }
  );

  /*
   * IMPORTANT:
   * We are NOT running removeOverlaps()
   * here.
   *
   * Web UI elements intentionally
   * live inside their parent containers.
   */
  return keepChildrenInsideParents(
    result,
    {
      horizontalPadding: 12,
      verticalPadding: 12,
      bottomPadding: 12,
    }
  );
};

/* =========================================================
   CONNECTION POINTS
========================================================= */

const getConnectionPoints = (
  fromNode: DiagramElement,
  toNode: DiagramElement,
  origin: {
    x: number;
    y: number;
  }
) => {
  const fromX =
    origin.x +
    Number(
      fromNode.x || 0
    );

  const fromY =
    origin.y +
    Number(
      fromNode.y || 0
    );

  const fromWidth =
    Number(
      fromNode.width || 200
    );

  const fromHeight =
    Number(
      fromNode.height || 80
    );

  const toX =
    origin.x +
    Number(
      toNode.x || 0
    );

  const toY =
    origin.y +
    Number(
      toNode.y || 0
    );

  const toWidth =
    Number(
      toNode.width || 200
    );

  const toHeight =
    Number(
      toNode.height || 80
    );

  const fromCenterX =
    fromX +
    fromWidth / 2;

  const fromCenterY =
    fromY +
    fromHeight / 2;

  const toCenterX =
    toX +
    toWidth / 2;

  const toCenterY =
    toY +
    toHeight / 2;

  const dx =
    toCenterX -
    fromCenterX;

  const dy =
    toCenterY -
    fromCenterY;

  if (
    Math.abs(dy) >=
    Math.abs(dx)
  ) {
    if (dy > 0) {
      return {
        startX:
          fromCenterX,
        startY:
          fromY +
          fromHeight,
        endX:
          toCenterX,
        endY:
          toY,
      };
    }

    return {
      startX:
        fromCenterX,
      startY:
        fromY,
      endX:
        toCenterX,
      endY:
        toY +
        toHeight,
    };
  }

  if (dx > 0) {
    return {
      startX:
        fromX +
        fromWidth,
      startY:
        fromCenterY,
      endX:
        toX,
      endY:
        toCenterY,
    };
  }

  return {
    startX:
      fromX,
    startY:
      fromCenterY,
    endX:
      toX +
      toWidth,
    endY:
      toCenterY,
  };
};

/* =========================================================
   CANVAS POSITION
========================================================= */

const getEmptyCanvasPosition = (
  excalidrawApi:
    | ExcalidrawImperativeAPI
    | null
) => {
  const elements =
    excalidrawApi
      ?.getSceneElements?.() ||
    [];

  const visibleElements =
    elements.filter(
      (element: any) =>
        !element.isDeleted
    );

  if (
    !visibleElements.length
  ) {
    return {
      x: 100,
      y: 100,
    };
  }

  const maxRight =
    Math.max(
      ...visibleElements.map(
        (element: any) =>
          Number(
            element.x || 0
          ) +
          Number(
            element.width || 0
          )
      )
    );

  const minTop =
    Math.min(
      ...visibleElements.map(
        (element: any) =>
          Number(
            element.y || 0
          )
      )
    );

  return {
    x:
      maxRight + 150,
    y: Math.max(
      100,
      minTop
    ),
  };
};

/* =========================================================
   PARSER
========================================================= */

const parseAIResponse = (
  rawResponse: any
): DiagramResult => {
  let data =
    rawResponse;

  if (
    data?.diagramResult
  ) {
    data =
      data.diagramResult;
  }

  if (
    data?.data
      ?.diagramResult
  ) {
    data =
      data.data.diagramResult;
  }

  if (
    data?.data?.elements
  ) {
    data =
      data.data;
  }

  if (data?.diagram) {
    data =
      data.diagram;
  }

  if (
    data?.choices?.[0]
      ?.message?.content
  ) {
    data =
      data.choices[0]
        .message.content;
  }

  if (data?.output) {
    data =
      data.output;
  }

  if (data?.response) {
    data =
      data.response;
  }

  if (
    typeof data ===
    "string"
  ) {
    data =
      data
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /\s*```$/i,
          ""
        )
        .trim();

    data =
      JSON.parse(data);
  }

  if (
    !data ||
    !Array.isArray(
      data.elements
    )
  ) {
    throw new Error(
      "AI response does not contain diagram elements."
    );
  }

  return {
    title:
      data.title ||
      "AI Generated Diagram",

    width:
      data.width,

    height:
      data.height,

    elements:
      data.elements,

    connections:
      Array.isArray(
        data.connections
      )
        ? data.connections
        : [],
  };
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AIFloatingSidebar({
  excalidrawApi,
  onClose,
}: Props) {
  const [
    selectedTool,
    setSelectedTool,
  ] = useState(
    "Generate Diagrams"
  );

  const [
    prompt,
    setPrompt,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedPreset,
    setSelectedPreset,
  ] = useState(
    "Modern Minimal"
  );

  const [
    autoLayout,
    setAutoLayout,
  ] = useState(true);

  const [
    presentationReady,
    setPresentationReady,
  ] = useState(true);

  const currentTool =
    useMemo(
      () =>
        AiTools.find(
          (tool) =>
            tool.name ===
            selectedTool
        ) ||
        AiTools[0],
      [selectedTool]
    );

  const currentPreset =
    STYLE_PRESETS.find(
      (preset) =>
        preset.name ===
        selectedPreset
    ) ||
    STYLE_PRESETS[0];

  /* =======================================================
     PLACEHOLDER
  ======================================================= */

  const removeAiPlaceholder =
    () => {
      if (!excalidrawApi) {
        return;
      }

      const currentElements =
        excalidrawApi.getSceneElements();

      const placeholderIds =
        new Set(
          Object.values(
            AI_PLACEHOLDER_IDS
          )
        );

      const filtered =
        currentElements.filter(
          (element: any) =>
            !placeholderIds.has(
              element.id
            )
        );

      excalidrawApi.updateScene({
        elements: filtered,
      });
    };

  const addAiPlaceholder = () => {
    if (!excalidrawApi) {
      return;
    }

    removeAiPlaceholder();

    const origin =
      getEmptyCanvasPosition(
        excalidrawApi
      );

    const placeholder =
      [
        {
          id:
            AI_PLACEHOLDER_IDS.container,
          type: "rectangle",
          x: origin.x,
          y: origin.y,
          width: 720,
          height: 430,
          strokeColor: "#CBD5E1",
          backgroundColor: "#F8FAFC",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },

        {
          id:
            AI_PLACEHOLDER_IDS.title,
          type: "text",
          x:
            origin.x + 32,
          y:
            origin.y + 28,
          width: 420,
          height: 36,
          text:
            `Designing ${selectedTool}`,
          fontSize: 22,
          strokeColor: "#0F172A",
          backgroundColor: "transparent",
          roughness: 0,
        },

        {
          id:
            AI_PLACEHOLDER_IDS.subtitle,
          type: "text",
          x:
            origin.x + 32,
          y:
            origin.y + 68,
          width: 540,
          height: 28,
          text:
            "Analyzing your request and creating a polished layout…",
          fontSize: 14,
          strokeColor: "#64748B",
          roughness: 0,
        },

        {
          id:
            AI_PLACEHOLDER_IDS.skeleton1,
          type: "rectangle",
          x:
            origin.x + 32,
          y:
            origin.y + 124,
          width: 200,
          height: 112,
          strokeColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },

        {
          id:
            AI_PLACEHOLDER_IDS.skeleton2,
          type: "rectangle",
          x:
            origin.x + 256,
          y:
            origin.y + 124,
          width: 200,
          height: 112,
          strokeColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },

        {
          id:
            AI_PLACEHOLDER_IDS.skeleton3,
          type: "rectangle",
          x:
            origin.x + 480,
          y:
            origin.y + 124,
          width: 208,
          height: 112,
          strokeColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },

        {
          id:
            AI_PLACEHOLDER_IDS.skeleton4,
          type: "rectangle",
          x:
            origin.x + 32,
          y:
            origin.y + 264,
          width: 656,
          height: 58,
          strokeColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },

        {
          id:
            AI_PLACEHOLDER_IDS.skeleton5,
          type: "rectangle",
          x:
            origin.x + 32,
          y:
            origin.y + 342,
          width: 440,
          height: 46,
          strokeColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 0,
          roundness: {
            type: 3,
          },
        },
      ];

    const converted =
      convertToExcalidrawElements(
        placeholder as any,
        {
          regenerateIds: false,
        }
      );

    const currentElements =
      excalidrawApi.getSceneElements();

    excalidrawApi.updateScene({
      elements: [
        ...currentElements,
        ...converted,
      ],
    });
  };

  /* =======================================================
     RENDER DIAGRAM
  ======================================================= */

  const renderAllDiagram = (
    diagram: DiagramResult
  ) => {
    if (!excalidrawApi) {
      throw new Error(
        "Excalidraw API is not available."
      );
    }

    let aiElements =
      diagram.elements ||
      [];

    if (
      !aiElements.length
    ) {
      throw new Error(
        "AI returned no visual elements."
      );
    }

    /*
     * Step 1:
     * Normalize dimensions,
     * typography and text.
     */
    aiElements =
      normalizeElementSizes(
        aiElements,
        selectedTool
      );

    /*
     * Step 2:
     * Apply the correct layout
     * strategy.
     */
    if (
      autoLayout &&
      selectedTool ===
        "Mobile Mockup"
    ) {
      /*
       * IMPORTANT:
       * Mobile UI does NOT use
       * generic overlap removal.
       */
      aiElements =
        normalizeMobileLayout(
          aiElements
        );
    } else if (
      autoLayout &&
      selectedTool ===
        "Web Mockup"
    ) {
      /*
       * IMPORTANT:
       * Web UI does NOT use
       * generic overlap removal.
       *
       * Nested elements are expected
       * to overlap their parent
       * containers.
       */
      aiElements =
        normalizeWebLayout(
          aiElements
        );
    } else if (
      autoLayout
    ) {
      /*
       * Diagram / Flowchart /
       * Architecture only.
       *
       * Generic collision correction
       * is appropriate here.
       */
      aiElements =
        removeOverlaps(
          aiElements,
          20
        );
    }

    /*
     * Step 3:
     * Establish visual layering.
     */
    aiElements =
      aiElements
        .map(
          (
            element,
            index
          ) => ({
            ...element,
            zIndex:
              safeNumber(
                element.zIndex,
                index
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            safeNumber(
              a.zIndex,
              0
            ) -
            safeNumber(
              b.zIndex,
              0
            )
        );

    const origin =
      getEmptyCanvasPosition(
        excalidrawApi
      );

    const getNode = (
      id: string
    ) =>
      aiElements.find(
        (element) =>
          element.id === id
      );

    const elementsToConvert:
      any[] = [];

    /*
     * Step 4:
     * Convert visual elements.
     */
    aiElements.forEach(
      (element) => {
        const type =
          getSafeText(
            element.type
          ).toLowerCase();

        const role =
          getSafeText(
            element.role
          ).toLowerCase();

        const width =
          safeNumber(
            element.width,
            type === "text"
              ? 180
              : 220
          );

        const height =
          safeNumber(
            element.height,
            type === "text"
              ? 40
              : 90
          );

        const fontSize =
          safeNumber(
            element.fontSize,
            role === "heading"
              ? 24
              : 16
          );

        const strokeColor =
          safeColor(
            element.strokeColor,
            currentPreset.primary
          );

        const backgroundColor =
          safeColor(
            element.backgroundColor,
            currentPreset.surface
          );

        const text =
          wrapText(
            getSafeText(
              element.text ||
                element.label
            ),
            Math.max(
              100,
              width - 24
            ),
            fontSize
          );

        const common = {
          id: element.id,

          x:
            origin.x +
            safeNumber(
              element.x,
              0
            ),

          y:
            origin.y +
            safeNumber(
              element.y,
              0
            ),

          width,
          height,

          strokeColor,

          backgroundColor,

          strokeWidth:
            safeNumber(
              element.strokeWidth,
              1.5
            ),

          strokeStyle:
            element.strokeStyle ||
            "solid",

          fillStyle:
            element.fillStyle ||
            "solid",

          roughness: 0,

          opacity:
            safeNumber(
              element.opacity,
              100
            ),

          roundness: {
            type: 3,
          },

          label: text
            ? {
                text,
                fontSize,
              }
            : undefined,
        };

        if (
          type === "text"
        ) {
          elementsToConvert.push({
            ...common,

            type: "text",

            text,

            fontSize,

            fontFamily:
              typeof element.fontFamily ===
              "number"
                ? element.fontFamily
                : 1,

            textAlign:
              element.textAlign ||
              "left",

            verticalAlign:
              element.verticalAlign ||
              "middle",

            backgroundColor:
              "transparent",
          });

          return;
        }

        if (
          type === "ellipse" ||
          type === "circle"
        ) {
          elementsToConvert.push({
            ...common,
            type: "ellipse",
          });

          return;
        }

        if (
          type === "diamond"
        ) {
          elementsToConvert.push({
            ...common,
            type: "diamond",
          });

          return;
        }

        elementsToConvert.push({
          ...common,
          type: "rectangle",
        });
      }
    );

    /*
     * Step 5:
     * Create connections AFTER
     * layout corrections.
     *
     * This is important because
     * node positions may have changed.
     */
    const connections =
      diagram.connections ||
      [];

    connections.forEach(
      (connection) => {
        const fromNode =
          getNode(
            connection.from
          );

        const toNode =
          getNode(
            connection.to
          );

        if (
          !fromNode ||
          !toNode
        ) {
          return;
        }

        const {
          startX,
          startY,
          endX,
          endY,
        } =
          getConnectionPoints(
            fromNode,
            toNode,
            origin
          );

        const arrowX =
          Math.min(
            startX,
            endX
          );

        const arrowY =
          Math.min(
            startY,
            endY
          );

        const arrowWidth =
          Math.abs(
            endX -
              startX
          );

        const arrowHeight =
          Math.abs(
            endY -
              startY
          );

        elementsToConvert.push({
          id:
            connection.id,

          type: "arrow",

          x: arrowX,

          y: arrowY,

          width:
            arrowWidth,

          height:
            arrowHeight,

          points: [
            [
              startX -
                arrowX,
              startY -
                arrowY,
            ],
            [
              endX -
                arrowX,
              endY -
                arrowY,
            ],
          ],

          strokeColor:
            safeColor(
              connection.strokeColor,
              currentPreset.secondary
            ),

          strokeWidth:
            safeNumber(
              connection.strokeWidth,
              1.5
            ),

          strokeStyle:
            connection.strokeStyle ||
            "solid",

          roughness: 0,

          startArrowhead:
            connection.startArrowhead ||
            null,

          endArrowhead:
            connection.endArrowhead ||
            "arrow",

          startBinding: {
            elementId:
              connection.from,

            focus: 0,

            gap: 4,
          },

          endBinding: {
            elementId:
              connection.to,

            focus: 0,

            gap: 4,
          },

          label:
            connection.label
              ? {
                  text:
                    connection.label,
                  fontSize: 13,
                }
              : undefined,
        });
      }
    );

    const newElements =
      convertToExcalidrawElements(
        elementsToConvert as any,
        {
          regenerateIds: false,
        }
      );

    const currentElements =
      excalidrawApi.getSceneElements();

    excalidrawApi.updateScene({
      elements: [
        ...currentElements,
        ...newElements,
      ],
    });
  };

  /* =======================================================
     GENERATE
  ======================================================= */

  const onClickGenerate =
    async () => {
      if (
        !excalidrawApi ||
        loading
      ) {
        return;
      }

      if (
        !prompt.trim()
      ) {
        setError(
          "Describe what you want to create."
        );

        return;
      }

      setError("");

      addAiPlaceholder();

      setLoading(true);

      try {
        const styleInstructions = `
SELECTED STYLE PRESET:
${currentPreset.name}

Preset description:
${currentPreset.description}

Design tokens:
Primary: ${currentPreset.primary}
Secondary: ${currentPreset.secondary}
Accent: ${currentPreset.accent}
Background: ${currentPreset.background}
Surface: ${currentPreset.surface}
Text: ${currentPreset.text}
Muted: ${currentPreset.muted}
Border: ${currentPreset.border}
Corner radius: ${currentPreset.radius}

Use this visual direction consistently throughout the generated design.
Do not randomly introduce unrelated colors.

AUTO LAYOUT:
${autoLayout ? "ENABLED" : "DISABLED"}

PRESENTATION READY:
${presentationReady ? "ENABLED" : "DISABLED"}

When presentation-ready mode is enabled:
- use strong hierarchy
- use generous whitespace
- keep labels concise
- align everything carefully
- avoid visual clutter
- use consistent dimensions
- maintain a premium professional appearance
- make the output look finished without manual cleanup
`;

        const result =
          await axios.post(
            "/api/ai",
            {
              userInput:
                prompt.trim(),

              type:
                currentTool.name,

              systemPrompt:
                `${currentTool.prompt}\n\n${styleInstructions}`,

              stylePreset:
                currentPreset.name,

              autoLayout,

              presentationReady,
            }
          );

        const diagram =
          parseAIResponse(
            result.data
          );

        removeAiPlaceholder();

        renderAllDiagram(
          diagram
        );

        setPrompt("");
      } catch (
        error: any
      ) {
        console.error(
          "AI diagram generation failed:",
          error
        );

        removeAiPlaceholder();

        const message =
          error?.response
            ?.data?.error ||
          error?.message ||
          "Unable to generate diagram.";

        setError(message);
      } finally {
        removeAiPlaceholder();

        setLoading(false);
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        fixed
        right-6
        bottom-24
        z-9999
        w-102.5
        max-h-[calc(100vh-120px)]
        overflow-y-auto
        rounded-[24px]
        border
        border-slate-200
        bg-white
        shadow-[0_24px_80px_rgba(15,23,42,0.18)]
      "
    >
      {/* HEADER */}

      <div
        className="
          sticky
          top-0
          z-10
          border-b
          border-slate-100
          bg-white/95
          px-5
          py-4
          backdrop-blur-xl
        "
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                bg-linear-to-br
                from-indigo-500
                via-violet-500
                to-fuchsia-500
                text-lg
                text-white
                shadow-lg
                shadow-indigo-200
              "
            >
              ✦
            </div>

            <div>
              <div className="text-[15px] font-semibold text-slate-900">
                AI Designer
              </div>

              <div className="text-[11px] text-slate-500">
                Professional visual generation
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* TOOLS */}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Create
            </div>

            <div className="text-[10px] text-slate-400">
              AI assisted
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {AiTools.map(
              (tool) => {
                const active =
                  selectedTool ===
                  tool.name;

                return (
                  <button
                    key={
                      tool.name
                    }
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={() => {
                      setSelectedTool(
                        tool.name
                      );
                      setError("");
                    }}
                    className={`
                      group
                      rounded-2xl
                      border
                      p-3
                      text-left
                      transition-all
                      ${
                        active
                          ? "border-indigo-200 bg-indigo-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          text-sm
                        "
                        style={{
                          backgroundColor:
                            tool.bgcolor,
                          color:
                            tool.color,
                        }}
                      >
                        {
                          tool.icon
                        }
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-900">
                          {
                            tool.name
                          }
                        </div>

                        <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                          {
                            tool.desc
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* SUGGESTIONS */}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">
              Quick ideas
            </div>

            <div className="text-[10px] text-slate-400">
              Click to use
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {currentTool.suggestions.map(
              (suggestion) => (
                <button
                  key={
                    suggestion
                  }
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() =>
                    setPrompt(
                      suggestion
                    )
                  }
                  className="
                    rounded-full
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    py-1.5
                    text-[11px]
                    font-medium
                    text-slate-600
                    transition
                    hover:border-indigo-200
                    hover:bg-indigo-50
                    hover:text-indigo-700
                  "
                >
                  {
                    suggestion
                  }
                </button>
              )
            )}
          </div>
        </div>

        {/* PROMPT */}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="ai-prompt"
              className="text-xs font-semibold text-slate-700"
            >
              Describe your idea
            </label>

            <span className="text-[10px] text-slate-400">
              Short prompts are supported
            </span>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-2
              transition
              focus-within:border-indigo-300
              focus-within:bg-white
              focus-within:ring-4
              focus-within:ring-indigo-50
            "
          >
            <textarea
              id="ai-prompt"
              value={prompt}
              disabled={
                loading
              }
              onChange={(event) =>
                setPrompt(
                  event.target.value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  (event.metaKey ||
                    event.ctrlKey)
                ) {
                  event.preventDefault();

                  void onClickGenerate();
                }
              }}
              placeholder={
                selectedTool ===
                "Mobile Mockup"
                  ? "e.g. Login screen"
                  : selectedTool ===
                    "Web Mockup"
                  ? "e.g. Analytics dashboard"
                  : "e.g. User signup flow"
              }
              className="
                min-h-27.5
                w-full
                resize-none
                border-0
                bg-transparent
                px-2
                py-2
                text-sm
                leading-6
                text-slate-800
                outline-none
                placeholder:text-slate-400
              "
            />

            <div className="flex items-center justify-between px-2 pb-1">
              <div className="text-[10px] text-slate-400">
                AI will infer sensible missing details.
              </div>

              <div className="text-[10px] font-medium text-slate-400">
                {prompt.length}
              </div>
            </div>
          </div>
        </div>

        {/* DESIGN CONTROLS */}

        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">
            Design system
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-3
              "
            >
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Style
              </div>

              <select
                value={
                  selectedPreset
                }
                disabled={
                  loading
                }
                onChange={(event) =>
                  setSelectedPreset(
                    event.target.value
                  )
                }
                className="
                  w-full
                  bg-transparent
                  text-xs
                  font-medium
                  text-slate-800
                  outline-none
                "
              >
                {STYLE_PRESETS.map(
                  (preset) => (
                    <option
                      key={
                        preset.name
                      }
                      value={
                        preset.name
                      }
                    >
                      {
                        preset.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                setAutoLayout(
                  (value) =>
                    !value
                )
              }
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-3
                text-left
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Auto Layout
                  </div>

                  <div className="mt-1 text-xs font-medium text-slate-800">
                    {autoLayout
                      ? "Optimized"
                      : "Manual"}
                  </div>
                </div>

                <div
                  className={`
                    h-5
                    w-9
                    rounded-full
                    p-0.5
                    transition
                    ${
                      autoLayout
                        ? "bg-indigo-500"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      h-4
                      w-4
                      rounded-full
                      bg-white
                      shadow-sm
                      transition
                      ${
                        autoLayout
                          ? "translate-x-4"
                          : "translate-x-0"
                      }
                    `}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* PRESENTATION READY */}

        <button
          type="button"
          disabled={
            loading
          }
          onClick={() =>
            setPresentationReady(
              (value) =>
                !value
            )
          }
          className="
            flex
            w-full
            items-center
            justify-between
            rounded-2xl
            border
            border-slate-200
            bg-linear-to-r
            from-slate-50
            to-white
            p-3
            text-left
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
                text-indigo-600
              "
            >
              ✨
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800">
                Presentation-ready
              </div>

              <div className="text-[10px] text-slate-500">
                Balanced spacing, hierarchy and polish
              </div>
            </div>
          </div>

          <div
            className={`
              h-5
              w-9
              rounded-full
              p-0.5
              transition
              ${
                presentationReady
                  ? "bg-indigo-500"
                  : "bg-slate-300"
              }
            `}
          >
            <div
              className={`
                h-4
                w-4
                rounded-full
                bg-white
                shadow-sm
                transition
                ${
                  presentationReady
                    ? "translate-x-4"
                    : "translate-x-0"
                }
              `}
            />
          </div>
        </button>

        {/* GENERATE BUTTON */}

        <button
          type="button"
          disabled={
            loading ||
            !prompt.trim() ||
            !excalidrawApi
          }
          onClick={() =>
            void onClickGenerate()
          }
          className="
            group
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-2xl
            bg-linear-to-r
            from-indigo-600
            via-violet-600
            to-fuchsia-600
            px-4
            py-3.5
            text-sm
            font-semibold
            text-white
            shadow-lg
            shadow-indigo-200
            transition
            hover:-translate-y-0.5
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-50
            disabled:hover:translate-y-0
          "
        >
          {loading ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/30
                  border-t-white
                "
              />

              <span>
                Designing {selectedTool}…
              </span>
            </>
          ) : (
            <>
              <span className="text-base">
                ✦
              </span>

              <span>
                Generate {selectedTool}
              </span>
            </>
          )}
        </button>

        {/* LOADING INFORMATION */}

        {loading && (
          <div
            className="
              rounded-2xl
              border
              border-indigo-100
              bg-indigo-50/70
              p-3
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  mt-0.5
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-white
                  text-indigo-600
                  shadow-sm
                "
              >
                ✦
              </div>

              <div>
                <div className="text-xs font-semibold text-indigo-900">
                  Building your design
                </div>

                <div className="mt-1 text-[11px] leading-5 text-indigo-700/80">
                  Understanding your request, arranging components, refining spacing and preparing the final visual layout.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-3
              text-xs
              leading-5
              text-red-700
            "
          >
            <div className="mb-1 font-semibold">
              Generation failed
            </div>

            {error}
          </div>
        )}

        {/* FOOTER */}

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <span>AI-assisted</span>
          <span>•</span>
          <span>Auto-layout</span>
          <span>•</span>
          <span>Presentation-ready</span>
        </div>
      </div>
    </div>
  );
}


