# Auto-Collapse Tab Groups

This is a Chromium browser extension which keeps the tab group with active tab expanded, and the other groups collapsed for each window. It can be used along with [the Auto Tab Group extension](https://github.com/ZhangTianrong/auto-group-tabs) to keep the tabs organized and [QuicKey](https://fwextensions.github.io/QuicKey/) for easy navigation. Most of the codes are generated using [Cline](https://github.com/cline/cline) with Claude 3.5 Sonnet models.

## Development

This project is built with [Vite 3](https://vitejs.dev/) in [library mode](https://vitejs.dev/guide/build.html#library-mode).

### Setup

Clone this project:

```bash
git clone https://github.com/loilo/auto-collapse-tab-groups.git
```

Step into the cloned folder and install [npm](https://www.npmjs.com/) dependencies:

```bash
npm ci
```

You can create a production build with `npm run build` or run the build in watch mode with `npm run dev`.
