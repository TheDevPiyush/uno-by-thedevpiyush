# backend

A Node.js TypeScript project with modern development setup.

## Features

- 🚀 TypeScript with strict configuration
- 🔧 ESLint for code quality
- 📦 Express for APIs and middleware
- 🔄️ Nodemon for hot reload
- 📦 Modern build setup with tsx for development
- 🎯 Source maps and declarations
- 📦 Project intialized by PyCLI

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

### Build

Build the project for production:

```bash
npm run build
```

### Start Production

Run the built project:

```bash
npm start
```

### Linting

Check code quality:

```bash
npm run lint
```

Fix linting issues automatically:

```bash
npm run lint:fix
```

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Main application file
├── dist/                 # Built files (generated)
├── package.json
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.json        # ESLint configuration
├── .gitignore
└── README.md
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
