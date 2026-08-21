export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "imageText"
  | "productGrid"
  | "banner"
  | "testimonial"
  | "faq"
  | "video"
  | "social"
  | "footer"
  | "spacer";

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, string | number>;
}

export type FieldType =
  | "text"
  | "textarea"
  | "color"
  | "image"
  | "select"
  | "number"
  | "url";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

/** Fields edited inline on the canvas (click the text on the page) rather than in the settings panel. */
export const INLINE_FIELD_TYPES: FieldType[] = ["text", "textarea"];

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
  imageText: {
    type: "imageText",
    label: "Image + text",
    description: "An image alongside a heading and paragraph.",
    defaultProps: {
      heading: "Made by hand",
      body: "Tell the story behind your products — materials, process, or what makes them special.",
      buttonLabel: "Learn more",
      imageUrl: "",
      imagePosition: "left",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body text", type: "textarea" },
      { key: "buttonLabel", label: "Button label", type: "text" },
      { key: "imageUrl", label: "Image URL", type: "image" },
      {
        key: "imagePosition",
        label: "Image position",
        type: "select",
        options: ["left", "right"],
      },
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
  testimonial: {
    type: "testimonial",
    label: "Testimonial",
    description: "A customer quote with their name.",
    defaultProps: {
      quote: "I love this shop! The quality is amazing and shipping was fast.",
      authorName: "Jamie R.",
      authorRole: "Verified customer",
      avatarUrl: "",
    },
    fields: [
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "authorName", label: "Name", type: "text" },
      { key: "authorRole", label: "Role / subtitle", type: "text" },
      { key: "avatarUrl", label: "Avatar image URL", type: "image" },
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ",
    description: "Three frequently asked questions.",
    defaultProps: {
      heading: "Frequently asked questions",
      question1: "How long does shipping take?",
      answer1: "Most orders arrive within 3-5 business days.",
      question2: "Do you accept returns?",
      answer2: "Yes, within 30 days of delivery.",
      question3: "Where are you located?",
      answer3: "We're a small shop shipping from the US.",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "question1", label: "Question 1", type: "text" },
      { key: "answer1", label: "Answer 1", type: "textarea" },
      { key: "question2", label: "Question 2", type: "text" },
      { key: "answer2", label: "Answer 2", type: "textarea" },
      { key: "question3", label: "Question 3", type: "text" },
      { key: "answer3", label: "Answer 3", type: "textarea" },
    ],
  },
  video: {
    type: "video",
    label: "Video",
    description: "An embedded YouTube/Vimeo video or direct video file.",
    defaultProps: {
      heading: "",
      videoUrl: "",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "videoUrl", label: "Video URL (YouTube, Vimeo, or .mp4)", type: "url" },
    ],
  },
  social: {
    type: "social",
    label: "Social links",
    description: "Links to your shop's social media.",
    defaultProps: {
      heading: "Follow us",
      instagramUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      tiktokUrl: "",
    },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "instagramUrl", label: "Instagram URL", type: "url" },
      { key: "facebookUrl", label: "Facebook URL", type: "url" },
      { key: "twitterUrl", label: "Twitter / X URL", type: "url" },
      { key: "tiktokUrl", label: "TikTok URL", type: "url" },
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
  "imageText",
  "productGrid",
  "testimonial",
  "faq",
  "video",
  "social",
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
