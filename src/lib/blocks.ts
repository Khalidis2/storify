export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "productGrid"
  | "banner"
  | "footer"
  | "spacer";

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, string | number>;
}

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "image" | "select" | "number";
  options?: string[];
}

export interface BlockDef {
  type: BlockType;
  label: string;
  description: string;
  defaultProps: Record<string, string | number>;
  fields: FieldDef[];
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  hero: {
    type: "hero",
    label: "Hero banner",
    description: "Big headline with a call to action.",
    defaultProps: {
      heading: "Welcome to our shop",
      subheading: "Handmade goods, made with care.",
      buttonLabel: "Shop now",
      backgroundColor: "#111827",
      textColor: "#ffffff",
      imageUrl: "",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subheading", label: "Subheading", type: "textarea" },
      { key: "buttonLabel", label: "Button label", type: "text" },
      { key: "backgroundColor", label: "Background color", type: "color" },
      { key: "textColor", label: "Text color", type: "color" },
      { key: "imageUrl", label: "Background image URL", type: "image" },
    ],
  },
  text: {
    type: "text",
    label: "Text block",
    description: "A heading and paragraph of text.",
    defaultProps: {
      heading: "About us",
      body: "Tell your customers what makes your shop special.",
      align: "left",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body text", type: "textarea" },
      {
        key: "align",
        label: "Alignment",
        type: "select",
        options: ["left", "center", "right"],
      },
    ],
  },
  image: {
    type: "image",
    label: "Image",
    description: "A single full-width image.",
    defaultProps: {
      imageUrl: "",
      caption: "",
    },
    fields: [
      { key: "imageUrl", label: "Image URL", type: "image" },
      { key: "caption", label: "Caption", type: "text" },
    ],
  },
  productGrid: {
    type: "productGrid",
    label: "Product grid",
    description: "Shows your products in a grid.",
    defaultProps: {
      heading: "Our products",
      columns: 3,
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "columns",
        label: "Columns",
        type: "select",
        options: ["2", "3", "4"],
      },
    ],
  },
  banner: {
    type: "banner",
    label: "Announcement banner",
    description: "A slim strip for promos or announcements.",
    defaultProps: {
      message: "Free shipping on all orders this week!",
      backgroundColor: "#facc15",
      textColor: "#111827",
    },
    fields: [
      { key: "message", label: "Message", type: "text" },
      { key: "backgroundColor", label: "Background color", type: "color" },
      { key: "textColor", label: "Text color", type: "color" },
    ],
  },
  footer: {
    type: "footer",
    label: "Footer",
    description: "Closing section with shop info.",
    defaultProps: {
      text: "© 2026 My Shop. All rights reserved.",
      backgroundColor: "#f4f4f5",
      textColor: "#52525b",
    },
    fields: [
      { key: "text", label: "Text", type: "text" },
      { key: "backgroundColor", label: "Background color", type: "color" },
      { key: "textColor", label: "Text color", type: "color" },
    ],
  },
  spacer: {
    type: "spacer",
    label: "Spacer",
    description: "Adds vertical space between sections.",
    defaultProps: {
      height: 48,
    },
    fields: [{ key: "height", label: "Height (px)", type: "number" }],
  },
};

export const BLOCK_ORDER: BlockType[] = [
  "hero",
  "banner",
  "text",
  "image",
  "productGrid",
  "spacer",
  "footer",
];

export function createBlock(type: BlockType): Block {
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    props: { ...BLOCK_DEFS[type].defaultProps },
  };
}

export function defaultLayout(): Block[] {
  return [
    createBlock("hero"),
    createBlock("productGrid"),
    createBlock("footer"),
  ];
}
