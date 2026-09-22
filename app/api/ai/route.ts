import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

/* =========================================================
   RESPONSE SCHEMA
========================================================= */

const responseSchema = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
      description:
        "A concise professional title for the generated visual.",
    },

    width: {
      type: Type.NUMBER,
      description:
        "Recommended overall canvas width.",
    },

    height: {
      type: Type.NUMBER,
      description:
        "Recommended overall canvas height.",
    },

    elements: {
      type: Type.ARRAY,

      description:
        "All visual elements required to construct the diagram or UI.",

      items: {
        type: Type.OBJECT,

        properties: {
          id: {
            type: Type.STRING,
            description:
              "Unique stable identifier for this element.",
          },

          type: {
            type: Type.STRING,
            description:
              "Excalidraw-compatible visual type such as rectangle, ellipse, diamond, or text.",
          },

          x: {
            type: Type.NUMBER,
            description:
              "Horizontal position relative to the generated canvas.",
          },

          y: {
            type: Type.NUMBER,
            description:
              "Vertical position relative to the generated canvas.",
          },

          width: {
            type: Type.NUMBER,
            description:
              "Width of the element.",
          },

          height: {
            type: Type.NUMBER,
            description:
              "Height of the element.",
          },

          text: {
            type: Type.STRING,
            description:
              "Visible text inside or associated with the element.",
          },

          strokeColor: {
            type: Type.STRING,
            description:
              "Hexadecimal stroke color.",
          },

          backgroundColor: {
            type: Type.STRING,
            description:
              "Hexadecimal background/fill color.",
          },

          strokeWidth: {
            type: Type.NUMBER,
            description:
              "Professional stroke width.",
          },

          strokeStyle: {
            type: Type.STRING,
            description:
              "Stroke style, normally solid or dashed.",
          },

          fillStyle: {
            type: Type.STRING,
            description:
              "Fill style, normally solid or hachure.",
          },

          roughness: {
            type: Type.NUMBER,
            description:
              "Excalidraw roughness. Use 0 for polished professional output.",
          },

          opacity: {
            type: Type.NUMBER,
            description:
              "Opacity from 0 to 100.",
          },

          fontSize: {
            type: Type.NUMBER,
            description:
              "Font size for text.",
          },

          fontFamily: {
            type: Type.NUMBER,
            description:
              "Excalidraw font family identifier.",
          },

          textAlign: {
            type: Type.STRING,
            description:
              "Text alignment such as left, center, or right.",
          },

          verticalAlign: {
            type: Type.STRING,
            description:
              "Vertical alignment such as top, middle, or bottom.",
          },

          roundness: {
            type: Type.NUMBER,
            description:
              "Preferred corner radius/roundness.",
          },

          label: {
            type: Type.STRING,
            description:
              "Optional concise visible label.",
          },

          role: {
            type: Type.STRING,
            description:
              "Semantic role of the element, such as container, card, button, input, node, process, decision, header, sidebar, device-frame, browser-frame, database, service, etc.",
          },

          parentId: {
            type: Type.STRING,
            description:
              "ID of the visual parent container when this element is intentionally nested inside another element.",
          },

          variant: {
            type: Type.STRING,
            description:
              "Optional visual or component variant.",
          },

          zIndex: {
            type: Type.NUMBER,
            description:
              "Visual stacking order. Higher values appear above lower values.",
          },
        },

        required: [
          "id",
          "type",
          "x",
          "y",
        ],
      },
    },

    connections: {
      type: Type.ARRAY,

      description:
        "Directional relationships between diagram elements.",

      items: {
        type: Type.OBJECT,

        properties: {
          id: {
            type: Type.STRING,
            description:
              "Unique connection identifier.",
          },

          from: {
            type: Type.STRING,
            description:
              "Source element ID.",
          },

          to: {
            type: Type.STRING,
            description:
              "Target element ID.",
          },

          label: {
            type: Type.STRING,
            description:
              "Optional concise relationship label.",
          },

          strokeColor: {
            type: Type.STRING,
            description:
              "Hexadecimal connection color.",
          },

          strokeWidth: {
            type: Type.NUMBER,
            description:
              "Connection stroke width.",
          },

          strokeStyle: {
            type: Type.STRING,
            description:
              "Connection style such as solid or dashed.",
          },

          startArrowhead: {
            type: Type.STRING,
            description:
              "Optional start arrowhead.",
          },

          endArrowhead: {
            type: Type.STRING,
            description:
              "Optional end arrowhead.",
          },
        },

        required: [
          "id",
          "from",
          "to",
        ],
      },
    },
  },

  required: [
    "title",
    "elements",
    "connections",
  ],
};

/* =========================================================
   TYPES
========================================================= */

type RequestBody = {
  userInput?: string;
  type?: string;
  systemPrompt?: string;

  stylePreset?: string;
  autoLayout?: boolean;
  presentationReady?: boolean;
};

/* =========================================================
   STYLE PRESETS
========================================================= */

const STYLE_PRESETS: Record<
  string,
  {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    radius: number;
  }
> = {
  "Modern Minimal": {
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

  "SaaS Pro": {
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

  Midnight: {
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

  "Soft Gradient": {
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

  Enterprise: {
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
};

/* =========================================================
   TOOL-SPECIFIC GLOBAL RULES
========================================================= */

const getToolSpecificRules = (
  type: string
) => {
  const normalized =
    type.trim().toLowerCase();

  /* -------------------------------------------------------
     GENERATE DIAGRAMS
  ------------------------------------------------------- */

  if (
    normalized ===
    "generate diagrams"
  ) {
    return `
TOOL MODE: GENERAL DIAGRAM

Create a polished information visualization.

Infer the most useful diagram structure from the user's request.

Choose an appropriate composition:
- left-to-right
- top-to-bottom
- centered hierarchy
- grouped system
- timeline
- relationship map

Use semantic roles.

Prefer:
container
group
node
process
service
database
client
heading
paragraph
connector

Use clear hierarchy.

Do not create arbitrary decorative shapes.

Keep the diagram compact enough to understand at a glance.

If the request is vague, infer a sensible complete structure instead of producing a minimal or incomplete result.
`;
  }

  /* -------------------------------------------------------
     FLOWCHART
  ------------------------------------------------------- */

  if (
    normalized ===
    "flowchart"
  ) {
    return `
TOOL MODE: FLOWCHART

Build a complete process flow.

Use:
- start
- process
- decision
- subprocess
- input
- output
- end

Prefer a clean top-to-bottom flow.

Use consistent vertical spacing.

Decision branches should be visually separated and labeled when appropriate.

Avoid connector crossings.

Use meaningful process names rather than generic labels such as "Step 1", "Step 2", unless the user explicitly requests those names.

Start and end points should be visually obvious.

If the prompt is short, infer the most likely complete process.
`;
  }

  /* -------------------------------------------------------
     ARCHITECTURE
  ------------------------------------------------------- */

  if (
    normalized ===
    "architecture"
  ) {
    return `
TOOL MODE: SOFTWARE ARCHITECTURE

Create a realistic modern software architecture.

When relevant, consider:

Users
Clients
Web App
Mobile App
Frontend
API Gateway
Authentication
Backend Services
Business Logic
Database
Cache
Queue
Object Storage
AI / ML Service
Third-party Services
Monitoring
Infrastructure

Do not blindly include every layer.

Only include components that make architectural sense for the user's request.

Use clear architectural boundaries.

Prefer aligned layers and predictable data flow.

Use semantic roles such as:
client
frontend
gateway
api
service
database
cache
queue
storage
ai-service
external-service
monitoring
container

Use parentId for architecture groups.
`;
  }

  /* -------------------------------------------------------
     WEB MOCKUP
  ------------------------------------------------------- */

  if (
    normalized ===
    "web mockup"
  ) {
    return `
TOOL MODE: WEB UI MOCKUP

Create a complete high-fidelity desktop web interface.

Assume:
1440 × 900 viewport

The design should resemble a polished modern SaaS/product interface.

When relevant, include:
- browser frame
- top header
- branding
- navigation
- sidebar
- page title
- supporting description
- primary action
- secondary action
- metrics
- cards
- charts
- tables
- forms
- filters
- tabs
- badges
- user/profile controls

Do not include every component automatically.

Infer the components that make sense for the user's request.

SEMANTIC HIERARCHY:

browser-frame
 ├── header
 ├── sidebar
 └── content
      ├── section
      ├── card
      ├── table
      └── chart

Use parentId aggressively for containment.

IMPORTANT:

Parent/child visual overlap is intentional.

For example:
- header belongs inside browser-frame
- sidebar belongs inside browser-frame
- cards belong inside content
- chart belongs inside card
- table belongs inside content

DO NOT interpret containment as collision.

The frontend uses containment-aware layout for Web Mockup.

Therefore:
- keep children inside parents
- do not scatter children outside their containers
- do not create unnecessary gaps between parent and children
- maintain internal padding

Use a clean grid and equal gutters.

Avoid generic collision-style placement.
`;
  }

  /* -------------------------------------------------------
     MOBILE MOCKUP
  ------------------------------------------------------- */

  if (
    normalized ===
    "mobile mockup"
  ) {
    return `
TOOL MODE: MOBILE UI MOCKUP

Create a complete high-fidelity mobile application screen.

Assume:
390 × 844 viewport

Use:
- device frame
- status bar
- header
- content
- primary interaction
- bottom navigation when appropriate

Possible semantic roles:

device-frame
statusbar
header
back-button
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

Use parentId for containment.

IMPORTANT:

Mobile UI is hierarchical.

For example:

device-frame
 ├── statusbar
 ├── header
 ├── content
 │    ├── heading
 │    ├── input
 │    └── button
 └── bottom-navigation

Parent/child overlap is intentional.

DO NOT create UI components outside their parent container.

DO NOT treat children occupying the device frame as accidental overlap.

The frontend intentionally does NOT run generic overlap removal for Mobile Mockup.

Use strict vertical rhythm.

Keep bottom navigation anchored at the bottom.

Do not allow content to collide with bottom navigation.

Use comfortable mobile touch targets.

Prefer concise realistic copy.
`;
  }

  return "";
};

/* =========================================================
   UNIVERSAL DESIGN RULES
========================================================= */

const getUniversalDesignRules = () => {
  return `
=========================================================
UNIVERSAL PROFESSIONAL DESIGN SYSTEM
=========================================================

You are generating a visual artifact, not an explanation.

The output must look intentionally designed by an experienced product designer, UX designer, information architect and technical designer.

The user may provide only a few words.

When the input is underspecified:

1. Infer the likely intent.
2. Infer missing supporting components.
3. Infer appropriate hierarchy.
4. Infer useful labels.
5. Infer sensible dimensions.
6. Infer a coherent layout.
7. Infer a professional visual style.
8. Do NOT ask questions.
9. Do NOT return a simplistic skeleton.
10. Do NOT invent unnecessary complexity.

=========================================================
LAYOUT
=========================================================

Use deliberate geometry.

Never randomly position elements.

Prefer:
- alignment
- grids
- columns
- rows
- consistent gutters
- balanced whitespace
- visual rhythm
- hierarchy

Recommended spacing scale:

8
16
24
32
48
64
80

Use the smallest spacing necessary to preserve clarity.

Do not create large unexplained empty spaces.

Do not cram unrelated components together.

=========================================================
TYPOGRAPHY
=========================================================

Use a clear hierarchy.

Suggested scale:

Small supporting text:
12–14

Body:
14–16

Labels:
13–15

Section headings:
18–22

Main headings:
26–34

Large hero headings:
36–48 when appropriate.

Do not make every element use the same font size.

Keep labels concise.

Avoid paragraphs inside small UI elements.

=========================================================
COLOR
=========================================================

Use the supplied style preset.

Use:
- primary color for important actions
- secondary colors for supporting information
- accent sparingly
- neutral surfaces for most components
- muted text for secondary information
- subtle borders

Do not make every component colorful.

Do not use random gradients.

Do not use more than a few visually meaningful accent colors.

=========================================================
SHAPES
=========================================================

Use:
- rectangles for cards/components
- rounded rectangles for modern UI
- ellipses for start/end or circular UI
- diamonds for decisions
- containers for logical grouping

Use roughness = 0.

Use consistent corner treatment.

=========================================================
SEMANTIC STRUCTURE
=========================================================

Every meaningful element should have a semantic role.

Examples:

container
group
heading
paragraph
node
process
decision
start
end
client
frontend
backend
api
service
database
cache
queue
storage
external-service
browser-frame
device-frame
header
sidebar
content
section
card
metric-card
chart
table
input
button
badge
navigation
bottom-navigation
navigation-item

Use parentId whenever containment exists.

Use zIndex for intentional stacking.

=========================================================
TEXT WRAPPING
=========================================================

Long text must be wrapped intelligently.

Do not allow long labels to extend through neighboring elements.

Keep text readable.

Use concise wording whenever possible.

=========================================================
CONNECTORS
=========================================================

Every connection must reference valid element IDs.

Connections should:
- communicate a real relationship
- have clear direction
- avoid unnecessary crossings
- avoid passing through nodes
- use labels only when useful

Do not create decorative arrows.

=========================================================
VISUAL BALANCE
=========================================================

The composition should feel balanced.

Avoid:
- random clusters
- excessive empty areas
- inconsistent margins
- inconsistent card sizes
- random color changes
- unnecessary decoration
- redundant labels
- overlapping unrelated components

=========================================================
PROFESSIONAL OUTPUT
=========================================================

The final result should require minimal manual editing.

Assume the output may be shown directly to:
- a client
- manager
- stakeholder
- engineering team
- design team
- investor
- presentation audience

Therefore prioritize:
clarity
consistency
hierarchy
alignment
polish
readability

=========================================================
EXCALIDRAW
=========================================================

This is intended for a polished Excalidraw-based visual editor.

Therefore:
- roughness should normally be 0
- use clean strokes
- use hexadecimal colors
- use readable dimensions
- use consistent shapes
- use stable IDs
- use meaningful semantic roles

Do not output explanatory prose.

Return only JSON matching the supplied schema.
`;
};

/* =========================================================
   PRESENTATION READY RULES
========================================================= */

const getPresentationRules = (
  enabled: boolean
) => {
  if (!enabled) {
    return `
PRESENTATION-READY MODE:
Disabled.

Still maintain professional visual quality, but allow somewhat denser layouts where appropriate.
`;
  }

  return `
PRESENTATION-READY MODE:
Enabled.

The generated artifact must be immediately suitable for presentation.

Prioritize:
- strong visual hierarchy
- larger readable headings
- concise labels
- generous whitespace
- consistent alignment
- balanced composition
- clear grouping
- high readability
- restrained color
- minimal visual noise

Avoid:
- unnecessary tiny text
- overly dense layouts
- decorative clutter
- excessive components
- random spacing

The user should not need to manually rearrange the generated visual before showing it to others.
`;
};

/* =========================================================
   AUTO LAYOUT RULES
========================================================= */

const getAutoLayoutRules = (
  enabled: boolean,
  type: string
) => {
  if (!enabled) {
    return `
AUTO LAYOUT:
Disabled.

Respect the generated coordinates while still keeping the composition coherent.
`;
  }

  const normalized =
    type
      .trim()
      .toLowerCase();

  if (
    normalized ===
      "web mockup" ||
    normalized ===
      "mobile mockup"
  ) {
    return `
AUTO LAYOUT:
Enabled.

Use semantic containment-aware layout.

CRITICAL:

Do not use generic collision-removal logic.

Nested UI elements are intentionally positioned inside parent containers.

Use:
- parentId
- semantic roles
- internal padding
- consistent gutters
- component hierarchy
- anchored navigation
- predictable vertical flow

Keep parent containers large enough to contain their children.

Do not place children outside their parents merely to eliminate geometric intersections.
`;
  }

  return `
AUTO LAYOUT:
Enabled.

Automatically optimize:
- spacing
- alignment
- dimensions
- hierarchy
- ordering
- column/row placement
- connector routing

Avoid unnecessary overlap.

Keep related elements grouped.

Use consistent spacing.

Prefer simple readable compositions over complicated arrangements.
`;
};

/* =========================================================
   REQUEST SANITIZATION
========================================================= */

const cleanUserInput = (
  input: unknown
) => {
  if (
    typeof input !==
    "string"
  ) {
    return "";
  }

  return input
    .trim()
    .slice(0, 12000);
};

const cleanToolName = (
  input: unknown
) => {
  if (
    typeof input !==
    "string"
  ) {
    return "Generate Diagrams";
  }

  return input
    .trim()
    .slice(0, 100);
};

/* =========================================================
   ROUTE
========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    /* -----------------------------------------------------
       1. READ REQUEST
    ----------------------------------------------------- */

    const body =
      (await req.json()) as RequestBody;

    const userInput =
      cleanUserInput(
        body?.userInput
      );

    const type =
      cleanToolName(
        body?.type
      );

    const systemPrompt =
      typeof body?.systemPrompt ===
      "string"
        ? body.systemPrompt
        : "";

    const stylePresetName =
      typeof body?.stylePreset ===
      "string"
        ? body.stylePreset
        : "Modern Minimal";

    const autoLayout =
      body?.autoLayout !== false;

    const presentationReady =
      body?.presentationReady !==
      false;

    /* -----------------------------------------------------
       2. VALIDATION
    ----------------------------------------------------- */

    if (!userInput) {
      return NextResponse.json(
        {
          success: false,
          error:
            "userInput is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !process.env.GEMINI_API_KEY
    ) {
      console.error(
        "GEMINI_API_KEY is missing"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured",
        },
        {
          status: 500,
        }
      );
    }

    /* -----------------------------------------------------
       3. STYLE
    ----------------------------------------------------- */

    const stylePreset =
      STYLE_PRESETS[
        stylePresetName
      ] ||
      STYLE_PRESETS[
        "Modern Minimal"
      ];

    /* -----------------------------------------------------
       4. INITIALIZE GEMINI
    ----------------------------------------------------- */

    const ai =
      new GoogleGenAI({
        apiKey:
          process.env.GEMINI_API_KEY,
      });

    /* -----------------------------------------------------
       5. BUILD PROMPT
    ----------------------------------------------------- */

    const finalPrompt = `
You are the visual generation engine inside a professional AI design application.

Your output will be converted directly into Excalidraw elements.

You must produce a finished visual artifact.

Do NOT explain your reasoning.

Do NOT describe what you would create.

Actually create the complete structured visual.

=========================================================
USER REQUEST
=========================================================

${userInput}

=========================================================
SELECTED TOOL
=========================================================

${type}

=========================================================
STYLE PRESET
=========================================================

Name:
${stylePresetName}

Primary:
${stylePreset.primary}

Secondary:
${stylePreset.secondary}

Accent:
${stylePreset.accent}

Background:
${stylePreset.background}

Surface:
${stylePreset.surface}

Text:
${stylePreset.text}

Muted:
${stylePreset.muted}

Border:
${stylePreset.border}

Corner Radius:
${stylePreset.radius}

=========================================================
TOOL INSTRUCTIONS
=========================================================

${systemPrompt}

=========================================================
TOOL-SPECIFIC ENGINEERING RULES
=========================================================

${getToolSpecificRules(type)}

=========================================================
UNIVERSAL DESIGN RULES
=========================================================

${getUniversalDesignRules()}

=========================================================
AUTO LAYOUT
=========================================================

${getAutoLayoutRules(
  autoLayout,
  type
)}

=========================================================
PRESENTATION MODE
=========================================================

${getPresentationRules(
  presentationReady
)}

=========================================================
MISSING INFORMATION POLICY
=========================================================

The user may provide extremely little information.

For example:

"login"

"dashboard"

"AI chatbot"

"checkout"

"architecture"

"food app"

"analytics"

When the request is short:

DO NOT create a tiny simplistic result.

Instead infer the most likely professional structure.

However:

DO NOT over-invent unrelated features.

Infer only what is naturally expected for the requested artifact.

Use common professional design patterns.

=========================================================
ORDERING
=========================================================

Elements must be arranged in logical visual order.

For processes:
Start → steps → decisions → outcomes

For architecture:
Users → clients → application → services → data → external systems

For web:
Browser → header/navigation → sidebar → main content → sections → components

For mobile:
Device → status bar → header → content → primary interaction → bottom navigation

For general diagrams:
Use the most natural reading order.

=========================================================
DIMENSIONS
=========================================================

Choose dimensions based on content.

Do not make every element the same size when the content clearly requires different sizes.

Maintain consistent dimensions for repeated component types.

Examples:

Buttons:
roughly consistent height

Inputs:
roughly consistent height

Cards:
consistent repeated dimensions

Architecture services:
consistent node sizes

Flowchart processes:
consistent node sizes

=========================================================
SEMANTIC HIERARCHY
=========================================================

Whenever one element visually contains another:

Set:

parentId

to the containing element's ID.

Examples:

browser-frame
header → parentId = browser-frame

sidebar → parentId = browser-frame

content → parentId = browser-frame

card → parentId = content

chart → parentId = card

For mobile:

device-frame
header → parentId = device-frame

content → parentId = device-frame

input → parentId = content

button → parentId = content

bottom-navigation → parentId = device-frame

This hierarchy is extremely important.

=========================================================
Z-ORDER
=========================================================

Use zIndex to establish intentional visual layering.

Suggested concept:

background/container:
low zIndex

content:
medium zIndex

text:
higher zIndex

overlays:
highest zIndex

Do not use random zIndex values.

=========================================================
CONNECTION VALIDITY
=========================================================

Every connection:

from

and

to

must exactly match an existing element ID.

Never reference a missing ID.

Do not create orphan connections.

=========================================================
NO MANUAL EXPLANATION
=========================================================

Return ONLY valid JSON matching the supplied response schema.

No markdown.

No code fences.

No explanation.

No commentary.
`;

    /* -----------------------------------------------------
       6. LOG REQUEST
    ----------------------------------------------------- */

    console.log(
      "========== GEMINI REQUEST =========="
    );

    console.log({
      type,
      userInput,
      stylePreset:
        stylePresetName,
      autoLayout,
      presentationReady,
    });

    console.log(
      "===================================="
    );

    /* -----------------------------------------------------
       7. GENERATE STRUCTURED JSON
    ----------------------------------------------------- */

    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.5-flash-lite",

        contents:
          finalPrompt,

        config: {
          responseMimeType:
            "application/json",

          responseJsonSchema:
            responseSchema,
        },
      });

    /* -----------------------------------------------------
       8. RAW RESPONSE
    ----------------------------------------------------- */

    console.log(
      "========== GEMINI RAW RESPONSE =========="
    );

    console.log(
      response.text
    );

    console.log(
      "========================================="
    );

    if (
      !response.text
    ) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    /* -----------------------------------------------------
       9. PARSE JSON
    ----------------------------------------------------- */

    let diagramResult: any;

    try {
      diagramResult =
        JSON.parse(
          response.text
        );
    } catch (
      parseError
    ) {
      console.error(
        "Failed to parse Gemini JSON:",
        parseError
      );

      console.error(
        "Gemini returned:",
        response.text
      );

      throw new Error(
        "Gemini returned invalid JSON."
      );
    }

    /* -----------------------------------------------------
       10. BASIC VALIDATION
    ----------------------------------------------------- */

    if (
      !diagramResult ||
      !Array.isArray(
        diagramResult.elements
      )
    ) {
      console.error(
        "Invalid diagram returned by Gemini:",
        diagramResult
      );

      throw new Error(
        "AI response does not contain an elements array."
      );
    }

    if (
      !Array.isArray(
        diagramResult.connections
      )
    ) {
      diagramResult.connections =
        [];
    }

    /* -----------------------------------------------------
       11. NORMALIZE ELEMENT IDS
    ----------------------------------------------------- */

    const usedIds =
      new Set<string>();

    diagramResult.elements =
      diagramResult.elements.map(
        (
          element: any,
          index: number
        ) => {
          let id =
            typeof element.id ===
            "string" &&
            element.id.trim()
              ? element.id.trim()
              : `element-${index + 1}`;

          let baseId = id;

          let counter = 1;

          while (
            usedIds.has(id)
          ) {
            counter += 1;

            id =
              `${baseId}-${counter}`;
          }

          usedIds.add(id);

          return {
            ...element,

            id,

            type:
              typeof element.type ===
              "string"
                ? element.type
                : "rectangle",

            x:
              Number.isFinite(
                Number(
                  element.x
                )
              )
                ? Number(
                    element.x
                  )
                : 0,

            y:
              Number.isFinite(
                Number(
                  element.y
                )
              )
                ? Number(
                    element.y
                  )
                : 0,

            width:
              Number.isFinite(
                Number(
                  element.width
                )
              )
                ? Number(
                    element.width
                  )
                : undefined,

            height:
              Number.isFinite(
                Number(
                  element.height
                )
              )
                ? Number(
                    element.height
                  )
                : undefined,

            role:
              typeof element.role ===
              "string"
                ? element.role
                : undefined,

            parentId:
              typeof element.parentId ===
              "string"
                ? element.parentId
                : undefined,

            variant:
              typeof element.variant ===
              "string"
                ? element.variant
                : undefined,

            zIndex:
              Number.isFinite(
                Number(
                  element.zIndex
                )
              )
                ? Number(
                    element.zIndex
                  )
                : index,
          };
        }
      );

    /* -----------------------------------------------------
       12. VALIDATE PARENT IDS
    ----------------------------------------------------- */

    const validElementIds =
      new Set(
        diagramResult.elements.map(
          (element: any) =>
            element.id
        )
      );

    diagramResult.elements =
      diagramResult.elements.map(
        (element: any) => {
          if (
            element.parentId &&
            !validElementIds.has(
              element.parentId
            )
          ) {
            return {
              ...element,
              parentId:
                undefined,
            };
          }

          return element;
        }
      );

    /* -----------------------------------------------------
       13. VALIDATE CONNECTIONS
    ----------------------------------------------------- */

    diagramResult.connections =
      diagramResult.connections
        .filter(
          (connection: any) =>
            connection &&
            typeof connection.from ===
              "string" &&
            typeof connection.to ===
              "string" &&
            validElementIds.has(
              connection.from
            ) &&
            validElementIds.has(
              connection.to
            )
        )
        .map(
          (
            connection: any,
            index: number
          ) => ({
            ...connection,

            id:
              typeof connection.id ===
              "string" &&
              connection.id.trim()
                ? connection.id
                : `connection-${index + 1}`,

            strokeColor:
              typeof connection.strokeColor ===
              "string"
                ? connection.strokeColor
                : stylePreset.secondary,

            strokeWidth:
              Number.isFinite(
                Number(
                  connection.strokeWidth
                )
              )
                ? Number(
                    connection.strokeWidth
                  )
                : 1.5,

            strokeStyle:
              typeof connection.strokeStyle ===
              "string"
                ? connection.strokeStyle
                : "solid",

            endArrowhead:
              connection.endArrowhead ||
              "arrow",
          })
        );

    /* -----------------------------------------------------
       14. PROFESSIONAL DEFAULTS
    ----------------------------------------------------- */

    diagramResult.title =
      typeof diagramResult.title ===
      "string" &&
      diagramResult.title.trim()
        ? diagramResult.title.trim()
        : "AI Generated Design";

    diagramResult.width =
      Number.isFinite(
        Number(
          diagramResult.width
        )
      )
        ? Number(
            diagramResult.width
          )
        : type ===
          "Mobile Mockup"
        ? 390
        : type ===
          "Web Mockup"
        ? 1440
        : 1200;

    diagramResult.height =
      Number.isFinite(
        Number(
          diagramResult.height
        )
      )
        ? Number(
            diagramResult.height
          )
        : type ===
          "Mobile Mockup"
        ? 844
        : type ===
          "Web Mockup"
        ? 900
        : 800;

    /* -----------------------------------------------------
       15. FINAL LOG
    ----------------------------------------------------- */

    console.log(
      "========== DIAGRAM RESULT =========="
    );

    console.log(
      JSON.stringify(
        diagramResult,
        null,
        2
      )
    );

    console.log(
      "===================================="
    );

    /* -----------------------------------------------------
       16. RETURN
    ----------------------------------------------------- */

    return NextResponse.json({
      success: true,

      diagramResult,
    });
  } catch (
    error: any
  ) {
    /* -----------------------------------------------------
       ERROR HANDLING
    ----------------------------------------------------- */

    console.error(
      "========== /api/ai ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Details:",
      error?.details
    );

    console.error(
      "Stack:",
      error?.stack
    );

    console.error(
      "==================================="
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "AI generation failed.",

        details:
          error?.details ||
          null,
      },
      {
        status: 500,
      }
    );
  }
}