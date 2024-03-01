import fs from "fs";
import parser from "gitignore-parser";
import { bold, cyan, gray, green } from "kleur/colors";
import path from "path";
import prompts from "prompts/lib/index";
import glob from "tiny-glob/sync.js";
import { viaContentsApi } from "./github.js";
import { version } from "../package.json";
import degit from "degit";
import prettier from "prettier/esm/standalone.mjs";
import prettierBabel from "prettier/esm/parser-babel.mjs";
import yargsParser from "yargs-parser";

const gitIgnore = `
dist
.vinxi
.output
.vercel
.netlify
netlify

# dependencies
/node_modules

# IDEs and editors
/.idea
.project
.classpath
*.launch
.settings/

# Temp
gitignore

# System Files
.DS_Store
Thumbs.db
`;

const disclaimer = `
Welcome to the Quyx setup wizard!
`;

function mkdirp(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e.code === "EEXIST") return;
    throw e;
  }
}

async function main() {
  console.log(gray(`\ncreate-quyx version ${version}`));
  console.log(green(disclaimer));

  let args = yargsParser(process.argv.slice(2));

  const target = process.argv[2] || ".";

  let config = {
    directory: args.example_dir ? args.example_dir : "examples",
    repository: args.repo ? args.repo.split("/")[1] : "quyx",
    user: args.repo ? args.repo.split("/")[0] : "AndrejNemec",
    ref: args.branch ? args.branch : "master"
  };

  let templates = {};
  const templateDirs = (await viaContentsApi(config)).filter(
    d => d !== config.directory + "/" + ".DS_Store"
  );

  templateDirs.forEach(dir => {
    let template = dir.replace("examples/", "");
    if (!templates[template]) {
      templates[template] = {
        name: template,
        client: true,
        ssr: true,
        js: true,
        ts: true
      };
    }
  });

  let templateNames = [...Object.values(templates)];

  const templateName = (
    await prompts({
      type: "select",
      name: "template",
      message: "Which template do you want to use?",
      choices: templateNames.map(template => ({ title: template.name, value: template.name })),
      initial: 0
    })
  ).template;

  if (!templateName) {
    throw new Error("No template selected");
  }

  if (fs.existsSync(target)) {
    if (fs.readdirSync(target).length > 0) {
      const response = await prompts({
        type: "confirm",
        name: "value",
        message: "Directory not empty. Continue?",
        initial: false
      });

      if (!response.value) {
        process.exit(1);
      }
    }
  } else {
    mkdirp(target);
  }

  let tempTemplate = path.join(target, ".quyx");

  await new Promise((res, rej) => {
    const emitter = degit(
      `${config.user}/${config.repository}/${config.directory}/${templateName}#${config.ref}`,
      {
        cache: false,
        force: true,
        verbose: true
      }
    );

    emitter.on("info", info => {
      console.log(info.message);
    });

    emitter.clone(path.join(process.cwd(), tempTemplate)).then(() => {
      res({});
    });
  });

  const templateDir = path.join(process.cwd(), tempTemplate);
  const gitignore_contents = gitIgnore;
  const gitignore = parser.compile(gitignore_contents);

  const files = glob("**/*", { cwd: templateDir }).filter(gitignore.accepts);

  files.forEach(file => {
    const src = path.join(templateDir, file);
    const dest = path.join(target, file);

    if (fs.statSync(src).isDirectory()) {
      mkdirp(dest);
    } else {
      let code = fs.readFileSync(src).toString();

      if (src.endsWith(".ts") || src.endsWith(".tsx")) {
          fs.writeFileSync(
            dest,
            prettier.format(code, { parser: "babel-ts", plugins: [prettierBabel] })
          );
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  });

  fs.writeFileSync(path.join(target, ".gitignore"), gitignore_contents);

  const name = path.basename(path.resolve(target));
  const pkg_file = path.join(target, "package.json");
  const pkg_json = JSON.parse(
    fs
      .readFileSync(pkg_file, "utf-8")
      .replace(/"name": ".+"/, _m => `"name": "${name}"`)
      .replace(/"(.+)": "workspace:.+"/g, (_m, name) => `"${name}": "next"`)
  ); // TODO ^${versions[name]}

  fs.writeFileSync(pkg_file, JSON.stringify(pkg_json, null, 2));

  fs.rmSync(path.join(process.cwd(), tempTemplate), {
    recursive: true,
    force: true
  });

  console.log(bold(green("✔ Copied project files")));

  console.log("\nNext steps:");
  let i = 1;

  const relative = path.relative(process.cwd(), target);
  if (relative !== "") {
    console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
  }

  console.log(`  ${i++}: ${bold(cyan("npm install"))} (or pnpm install, or yarn)`);
  console.log(`  ${i++}: ${bold(cyan("npm run dev -- --open"))}`);

  console.log(`\nTo close the dev server, hit ${bold(cyan("Ctrl-C"))}`);
}

main();