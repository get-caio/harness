import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Project Docs",
    description:
      "Living project documentation — auto-generated during development",

    themeConfig: {
      nav: [
        { text: "Guide", link: "/guide/" },
        { text: "Architecture", link: "/architecture/" },
        { text: "Components", link: "/components/" },
        { text: "API", link: "/api/" },
      ],

      sidebar: [
        {
          text: "Guide",
          items: [
            { text: "Overview", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Architecture",
          items: [
            { text: "Overview", link: "/architecture/" },
            { text: "Data Model", link: "/architecture/data-model" },
            { text: "API", link: "/architecture/api" },
            { text: "Auth Flow", link: "/architecture/auth" },
          ],
        },
        {
          text: "Components",
          items: [{ text: "Inventory", link: "/components/" }],
        },
        {
          text: "API Reference",
          items: [{ text: "Overview", link: "/api/" }],
        },
        {
          text: "Decisions",
          items: [{ text: "Index", link: "/decisions/" }],
        },
      ],

      socialLinks: [],

      search: {
        provider: "local",
      },
    },

    mermaid: {},
  }),
);
