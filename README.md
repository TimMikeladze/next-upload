# React Package Starter

This is a simple and slightly opinionated starter kit for developing and publishing React packages. It comes with a several pre-configured tools, so you could focus on coding instead of configuring a project for the nth time.

## Getting started

```console
npx degit TimMikeladze/tsup-react-package-starter my-react-package

cd my-react-package && git init

yarn && yarn dev
```

❗Important note: This project uses [yarn](https://yarnpkg.com/) for managing dependencies. If you want to use another package manager, remove the `yarn.lock` and control-f for usages of `yarn` in the project and replace them with your package manager of choice.

## What's included?

- ⚡️[tsup](https://github.com/egoist/tsup) - The simplest and fastest way to bundle your TypeScript libraries. Used to bundle package as ESM and CJS modules. Supports TypeScript, Code Splitting, PostCSS, and more out of the box.
- 🔗 [Yalc](https://github.com/wclr/yalc) - Better workflow than npm | yarn link for package authors.
- 📖 [Storybook](https://storybook.js.org/) - Build UI components and pages in isolation. It streamlines UI development, testing, and documentation.
- ⚡️ [Vitest](https://vitest.dev/) - A testing framework for JavaScript. Preconfigured to work with TypeScript and JSX.
- 🔼 [Release-it](https://github.com/release-it/release-it/) - release-it is a command line tool to automatically generate a new GitHub Release and populates it with the changes (commits) made since the last release.
- 🐙 [Test & Publish via Github Actions](https://docs.github.com/en/actions) - CI/CD workflows for your package. Run tests on every commit plus integrate with Github Releases to automate publishing package to NPM and Storybook to Github Pages.
- 📄 [Commitizen](https://github.com/commitizen/cz-cli) — When you commit with Commitizen, you'll be prompted to fill out any required commit fields at commit time.
- 🚓 [Commitlint](https://github.com/conventional-changelog/commitlint) — Checks that your commit messages meet the conventional commit format.
- 🐶 [Husky](https://github.com/typicode/husky) — Running scripts before committing.
- 🚫 [lint-staged](https://github.com/okonet/lint-staged) — Run linters on git staged files
- 🖌 [Renovate](https://github.com/renovatebot/renovate) - Universal dependency update tool that fits into your workflows. Configured to periodically check your dependencies for updates and send automated pull requests.
- ☑️ [ESLint](https://eslint.org/) - A linter for JavaScript. Includes a simple configuration for React projects based on the recommended ESLint and AirBnB configs.
- 🎨 [Prettier](https://prettier.io/) - An opinionated code formatter.

## Usage

### Developing

Watch and rebuild code with `tsup` and runs Storybook to preview your UI during development.

```console
yarn dev
```

Run all tests and watch for changes

```console
yarn test
```

### Building

Build package with `tsup` for production.

```console
yarn build
```

### Linking

Often times you want to `link` the package you're developing to another project locally to test it out to circumvent the need to publish it to NPM.

For this we use [yalc](https://github.com/wclr/yalc) which is a tool for local package development and simulating the publishing and installation of packages.

In a project where you want to consume your package simply run:

```console
npx yalc link my-react-package
# or
yarn yalc add my-react-package
```

Learn more about `yalc` [here](https://github.com/wclr/yalc).

### Committing

When you are ready to commit simply run the following command to get a well formatted commit message. All staged files will automatically be linted and fixed as well.

```console
yarn commit
```

### Releasing, tagging & publishing to NPM

Create a semantic version tag and publish to Github Releases. When a new release is detected a Github Action will automatically build the package and publish it to NPM. Additionally, a Storybook will be published to Github pages.

Learn more about how to use the `release-it` command [here](https://github.com/release-it/release-it).

```console
yarn release
```

When you are ready to publish to NPM simply run the following command:

```console
yarn publish
```

#### Auto publish after Github Release

❗Important note: in order to publish package to NPM you must add your token as a Github Action secret. Learn more on how to configure your repository and publish packages through Github Actions [here](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages).

## PostCSS

[tsup](https://github.com/egoist/tsup) supports PostCSS out of the box. Simply run `yarn add postcss -D` add a `postcss.config.js` file to the root of your project, then add any plugins you need. Learn more how to configure PostCSS [here](https://tsup.egoist.dev/#css-support).

Additionally consider using the [tsup](https://github.com/egoist/tsup) configuration option `injectStyle` to inject the CSS directly into your Javascript bundle instead of outputting a separate CSS file.

## Built something using this starter-kit?

That's awesome! Feel free to add it to the list.

- [next-auth-mui](https://github.com/TimMikeladze/next-auth-mui) - Sign-in dialog for NextAuth built with MUI and React. Detects configured OAuth and Email providers and renders buttons or input fields for each respectively. Fully themeable, extensible and customizable to support custom credential flows.
