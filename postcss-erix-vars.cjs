// postcss-erix-vars.cjs
module.exports = () => ({
  postcssPlugin: "postcss-erix-vars",
  Declaration(decl) {
    const brandVars = [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "destructive-foreground",
      "border",
      "input",
      "ring",
      "radius",
    ];

    // 1. Rename --tw-* to --erix-*
    if (decl.prop.startsWith("--tw-")) {
      decl.prop = decl.prop.replace("--tw-", "--erix-");
    }

    // 2. Rename standard brand variables (e.g., --primary -> --erix-primary)
    // Only rename if it's exactly one of the brand vars (prefixed with --)
    for (const v of brandVars) {
      if (decl.prop === `--${v}`) {
        decl.prop = `--erix-${v}`;
        break;
      }
    }

    // 3. Rename references in values
    if (decl.value.includes("var(--")) {
      // Handle --tw- first
      decl.value = decl.value.replace(/var\(--tw-/g, "var(--erix-");

      // Handle brand vars
      for (const v of brandVars) {
        const regex = new RegExp(`var\\(--${v}(?![a-zA-Z0-9-])`, "g");
        if (decl.value.includes(`var(--${v}`)) {
          decl.value = decl.value.replace(regex, `var(--erix-${v}`);
        }
      }
    }
  },
});
module.exports.postcss = true;
