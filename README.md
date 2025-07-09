# Vimesh UI

[![npm version](https://badge.fury.io/js/@vimesh%2Fui.svg)](https://badge.fury.io/js/@vimesh%2Fui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vimesh UI is an ultra-lightweight component library for Alpine.js that enables building reusable UI components without complex build toolchains like webpack, rollup, or vite. Built on top of Alpine.js, it provides a simple yet powerful way to create custom elements and manage component lifecycle.

**Quality Assured**: With 163 comprehensive tests and 87% code coverage, Vimesh UI ensures reliability and stability across all core features including component creation, remote loading, styling, and complex integration scenarios.

## Features

- **Zero Build Process**: Works directly in the browser without compilation
- **Web Components**: Native custom elements with Alpine.js reactivity
- **Remote Loading**: Import components from local or remote URLs
- **Slot Support**: Named and default slots for flexible content projection
- **Component API**: Built-in `$api` and `$prop` magics for component interaction
- **Auto Import**: Automatically import custom HTML elements
- **TypeScript Support**: Full type definitions for better IDE experience
- **Lightweight**: No runtime dependencies, only development dependencies
- **Well Tested**: 163 tests with 87% code coverage ensuring reliability

## Why Vimesh UI?

Alpine.js is clean, powerful, and requires no build process. However, developing a comprehensive UI component library directly with Alpine.js presents challenges. Vimesh UI solves this by providing:

- A structured way to create reusable components
- Component encapsulation and lifecycle management
- Remote component loading capabilities
- A simple API that feels natural with Alpine.js

## Quick Start

### Installation

Add Vimesh UI before Alpine.js in your HTML:

```html
<script src="https://unpkg.com/@vimesh/ui"></script>
<script src="https://unpkg.com/alpinejs" defer></script>
```

Or install via npm:

```bash
npm install @vimesh/ui
```

### Core Directives

Vimesh UI provides three powerful Alpine.js directives for component development:

### 1. x-component

Creates HTML native custom elements from Alpine.js templates.

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>

<body>
  <vui-greeting>Vimesh UI</vui-greeting>

  <template x-component="greeting">
    <h1>Hello <slot></slot></h1>
  </template>
</body>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/mdKKMpb)

It shows `Hello Vimesh UI`. The slots could have their default content. 

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>

<body>
  <vui-greeting>Vimesh UI</vui-greeting>

  <vui-greeting><span slot="from">Team Vimesh</span></vui-greeting>

  <template x-component="greeting">
    <h1>Hello <slot>World</slot> from <slot name="from">Team Default</slot></h1>
  </template>
</body>
```
Now there are `Hello Vimesh UI from Team Default` and `Hello World from Team Vimesh`. 

Let's add some interaction logic. There are two magics `$api` and `$prop` for a Vimesh UI component. `$api` comes from the return object of the first `<script>` inside of component template. `$prop` is function to get the passed value of component property:

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>

<body x-data="{name: 'Vimesh UI'}">
  <vui-greeting greeting-word="Hi" :who="name"></vui-greeting>

  <template x-component="greeting">
    <h1>
      <span x-text="$prop('greeting-word')"></span>
      <span x-text="$prop('who')"></span>
    </h1>
    <button @click="$api.say()">Click me</button>
    <script>
      return {
        say() {
          alert(this.$prop("greeting-word") + " " + this.$prop("who"));
        },
      };
    </script>
  </template>
</body>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/JjZBvPy)

The default custom element namespace is `vui`, which could be modified in config. You could also give a different namespace with format `x-component:{namespace}="component name"`

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
  <script>
    $vui.config = {
      namespace: "myui",
    };
  </script>
</head>

<body x-data>
  <myui-greeting>My UI</myui-greeting>
  <new-greeting>My UI</new-greeting>

  <template x-component="greeting">
    <h1>Hello <slot></slot></h1>
  </template>

  <template x-component:new="greeting">
    <h1>Hi <slot></slot></h1>
  </template>
</body>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/LYrrjdq)

The final html result will be

```html
...

<body x-data>
  <myui-greeting><h1>Hello My UI</h1></myui-greeting>
  <new-greeting><h1>Hi My UI</h1></new-greeting>
</body>
```

In some cases, we do not want the component tag to exist in the result. We could just add an `unwrap` modifier in `x-component`.

```html
...

<body x-data>
  <myui-greeting>My UI</myui-greeting>
  <new-greeting>My UI</new-greeting>

  <template x-component.unwrap="greeting">
    <h1>Hello <slot></slot></h1>
  </template>

  <template x-component:new.unwrap="greeting">
    <h1>Hi <slot></slot></h1>
  </template>
</body>
```

The component tags `myui-greeting` and `new-greeting` will no longer exist in the final html result

```html
...

<body x-data>
  <h1>Hello My UI</h1>
  <h1>Hi My UI</h1>
</body>
```

### 2. x-import

Loads components asynchronously from local or remote URLs, perfect for creating reusable component libraries.

> /hello-remote.html

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
  <script>
    $vui.config.importMap = {
      "*": "./components/${component}.html",
    };
  </script>
  <style>
    [x-cloak] {
      display: none !important;
    }
  </style>
</head>

<body x-cloak x-import="greeting">
  <vui-greeting>Vimesh UI</vui-greeting>
</body>
```

> /components/greeting.html

```html
<template x-component="greeting">
  <h1>Cloud Hello <slot></slot></h1>
</template>
```

The components could be loaded from anywhere, like

```html
<script>
  $vui.config.importMap = {
    "*": "https://unpkg.com/@vimesh/ui/examples/components/${component}.html",
  };
</script>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/poKKrYd)

`x-import` could load components from different namespaces. The syntax is `x-import="namespace1:comp11,comp12;namespace2:comp21,comp22;..."`. For default namespace, it could be omitted.
Here is a more complete example:

> /counters.html

```html
<head>
  <script src="https://unpkg.com/@vimesh/style" defer></script>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>

  <script>
    $vui.config.importMap = {
      "*": "./components/${component}.html",
    };
  </script>
  <style>
    [x-cloak] {
      display: none !important;
    }
  </style>
</head>

<body
  x-cloak
  x-import="counter;counter-trigger"
  class="p-2"
  x-data="{name: 'Counter to rename', winner: 'Jacky'}"
>
  Rename the 2nd counter :
  <input
    type="text"
    x-model="name"
    class="rounded-md border-2 border-blue-500"
  />
  <vui-counter
    x-data="{step: 1}"
    :primary="true"
    title="First"
    x-init="console.log('This is the first one')"
    owner-name="Tom"
  ></vui-counter>
  <vui-counter
    x-data="{step: 5}"
    :title="name + ' @ ' + $prop('owner-name')"
    owner-name="Frank"
  ></vui-counter>
  <vui-counter x-data="{step: 10, value: 1000}" :owner-name="winner">
    <vui-counter-trigger></vui-counter-trigger>
  </vui-counter>
</body>
```

> /components/counter.html

```html
<template
  x-component.unwrap="counter"
  :class="$prop('primary') ? 'text-red-500' : 'text-blue-500'"
  x-data="{ step : 1, value: 0}"
  x-init="$api && $api.init()"
  title="Counter"
  owner-name="nobody"
>
  <div>
    <span x-text="$prop('title')"></span><br />
    Owner: <span x-text="$prop('owner-name')"></span><br />
    Step: <span x-text="step"></span><br />
    Value : <span x-text="value"></span><br />
    <button
      @click="$api.increase()"
      class="inline-block rounded-lg bg-indigo-600 px-4 py-1.5 text-white shadow ring-1 ring-indigo-600 hover:bg-indigo-700 hover:ring-indigo-700"
    >
      Increase
    </button>
    <slot></slot>
  </div>
  <script>
    return {
      init() {
        console.log(`Value : ${this.value} , Step : ${this.step}`);
      },
      increase() {
        this.value += this.step;
      },
    };
  </script>
</template>
```

> /components/counter-trigger.html

```html
<template x-component="counter-trigger">
  <button
    @click="$api.$of('counter').increase()"
    class="inline-block rounded-lg mt-2 bg-green-600 px-4 py-1.5 text-white shadow ring-1 ring-green-600 hover:bg-green-700 hover:ring-green-700"
  >
    Tigger from child element
  </button>
</template>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/RwJBygE)

### How to import dynamic components ?

Add `dynamic` modifier to `x-import`, it will evaluate the express to a string or array and then import all these components. Please refer the example in `examples/spa/app.html`.

```html
<template
  x-component="router-view"
  x-shtml="$api && $api.pageContent || ''"
  x-import:dynamic="$api && $api.pageToImport"
>
  ...
</template>
```

### Auto import all components

Set the `autoImport` config to `true`, Vimesh UI will automatically try to import all custom html elements. Most `x-import` could be omitted. For example the previous `counters.html` could be rewritten as

```html
<head>
  <script src="https://unpkg.com/@vimesh/style" defer></script>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>

  <script>
    $vui.config.importMap = {
      "*": "./components/${component}.html",
    };
    $vui.config.autoImport = true;
  </script>
  <style>
    [x-cloak] {
      display: none !important;
    }
  </style>
</head>

<body x-cloak class="p-2" x-data="{name: 'Counter to rename', winner: 'Jacky'}">
  Rename the 2nd counter :
  <input
    type="text"
    x-model="name"
    class="rounded-md border-2 border-blue-500"
  />
  <vui-counter
    x-data="{step: 1}"
    :primary="true"
    title="First"
    x-init="console.log('This is the first one')"
    owner-name="Tom"
  ></vui-counter>
  <vui-counter
    x-data="{step: 5}"
    :title="name + ' @ ' + $prop('owner-name')"
    owner-name="Frank"
  ></vui-counter>
  <vui-counter x-data="{step: 10, value: 1000}" :owner-name="winner">
    <vui-counter-trigger></vui-counter-trigger>
  </vui-counter>
</body>
```

### 3. x-include

Includes HTML fragments directly into your page. Use the `unwrap` modifier to remove the host element.

> /include-article.html

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>

<body x-data>
  Load into the external "div" tag:<br />
  <div style="background-color: #888;" x-include="./static/article"></div>

  Unwrap the external "div" tag:<br />
  <div
    style="background-color: #888;"
    x-include.unwrap="./static/article"
  ></div>
</body>
```

> /static/article.html

```html
<h1>Title</h1>
<p>Content</p>
```

The final result will be

```html
<head>
  <script src="https://unpkg.com/@vimesh/ui"></script>
  <script src="https://unpkg.com/alpinejs" defer></script>
</head>

<body x-data>
  Load into the external "div" tag:<br />
  <div style="background-color: #888;">
    <h1>Title</h1>
    <p>Content</p>
  </div>

  Unwrap the external "div" tag:<br />
  <h1>Title</h1>
  <p>Content</p>
</body>
```

[Run on codepen](https://codepen.io/vimeshjs/pen/ExRpLbb)

### 4. x-shtml

A replacement for Alpine.js's `x-html` directive that properly handles component lifecycle in complex scenarios.

## Advanced Usage

### Component API (`$api`)

While `x-data` is accessible to all descendant elements, `$api` provides **private** properties and methods for component encapsulation. It prevents naming conflicts and provides better component isolation while still inheriting from `x-data` when needed.

#### Predefined Properties and Methods

| Properties | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| $meta      | Get the meta info of current component, including type, namespace, prefix. |
| $parent    | Get the closest parent component element                                   |

| Methods               | Description                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| $of('component type') | Find the $api of specific component type of its ancestors. If the component type is empty, it will return the $api of its closest parent component |
| $closest(filter)      | Find the closest ancestor component element according to the filter, which could be component type or a function                                   |
| $find(filter)         | Find all descendant component element according to the filter, which could be component type or a function                                         |
| $findOne(filter)      | It is similar to $find, but only return the first component element match the filter                                                               |

#### Lifecycle Hooks

| x-data | $api |
| ----------- | ----------- |
| init() | onMounted() |
| destroy() | onUnmounted() |

### Global API (`$vui`)

The global `$vui` object provides utilities and configuration options:

| Property/Method                               | Description                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| $vui.config                                   | A config object of `debug` mode flag and `importMap`                                                                                   |
| $vui.\_                                       | An utility object of some most used functions: `isString`, `isArray`, `isFunction`, `isPlainObject`, `each`, `map`, `filter`, `extend` |
| $vui.getComponentMeta(element)                | Get component type and namespace from html element                                                                                     |
| $vui.isComponent(element)                     | Return true if an html element is a Vimesh UI component                                                                                |
| $vui.visitComponents(elContainer, callback)   | Recursively visit all components inside an html container element with callback                                                        |
| $vui.findChildComponents(elContainer, filter) | Find all child component inside an html container element with specific filter, which could be component type or a function            |
| $vui.getParentComponent(element)              | Get the parent component of specific html element                                                                                      |
| $vui.findClosestComponent(element, filter)    | Find the closest ancestor component element according to the filter, which could be component type or a function                       |
| $vui.$api(element)                            | Get $api of a component element                                                                                                        |
| $vui.$data(element)                           | Alias of Alpine.$data(element)                                                                                                         |
| $vui.setHtml(elContainer, html)               | Load html into a container element. And Vimesh UI components in the html will be correctly initialized                                 |
| $vui.defer(callback)                          | Execute callback in next event loop.                                                                                                   |
| $vui.dom(html)                                | Load a plain html into dom with Vimesh UI components correctly initialized                                                             |
| $vui.nextTick(callback)                       | Alias of Alpine.nextTick(callback)                                                                                                     |
| $vui.effect(callback)                         | Alias of Alpine.effect(callback)                                                                                                       |
| $vui.focus(element, option)                   | Try to make an html element focused                                                                                                    |
| $vui.scrollIntoView(element)                  | Try to scroll an html element into view                                                                                                |

## Examples

### Multi-Page Application (MPA)
Check the [MPA example](/examples/mpa) for traditional multi-page setups.

### Single-Page Application (SPA)  
See the [SPA example](/examples/spa/app.html) for dynamic routing and page management.

## Ecosystem

### Vimesh Headless UI
[Vimesh Headless UI](https://github.com/vimeshjs/vimesh-headless) provides production-ready components including:

- **Form Controls**: Listbox, Combobox, Switch
- **Navigation**: Menu, Tabs
- **Overlays**: Dialog, Modal
- **And more...**

Perfect starting point for building your own UI component library.

![Vimesh Headless UI Components](./assets/vimesh002.jpg)

![Vimesh UI Component Examples](./assets/vimesh003.jpg)

## Configuration

Configure Vimesh UI through the global `$vui.config` object:

```javascript
$vui.config = {
  // Default namespace for components (default: "vui")
  namespace: "myui",
  
  // Import map for component loading
  importMap: {
    "*": "./components/${component}.html",
    "ui": "https://cdn.example.com/ui/${component}.html"
  },
  
  // Auto-import all custom elements (default: false)
  autoImport: true,
  
  // Debug mode (default: false)
  debug: true
};
```

## Browser Support

Vimesh UI works in all modern browsers that support:
- ES6+ features
- Custom Elements v1
- Alpine.js v3+

## Development & Testing

Vimesh UI has comprehensive test coverage to ensure reliability and stability.

### Running Tests

```bash
# Install dependencies
yarn install

# Run all tests
yarn test

# Run tests with coverage report
yarn test:coverage

# Run tests in watch mode during development
yarn test:watch

# Run tests in CI mode
yarn test:ci
```

### Test Coverage

The project maintains high test coverage across all core functionality:

- **163 tests** across 11 test suites
- **87% statement coverage**
- **78% branch coverage**  
- **91% function coverage**
- **90% line coverage**

### Test Categories

- **Core utilities** - Essential helper functions and configuration
- **Component system** - x-component directive and custom element creation
- **Import system** - x-import directive and remote component loading
- **Include system** - x-include directive and HTML fragment inclusion
- **Style system** - x-style directive and styling functionality
- **Slot system** - Named and default slot handling
- **Alpine.js integration** - Core framework integration
- **Edge cases** - Error handling and boundary conditions
- **Integration scenarios** - Complex multi-component workflows

### Building

```bash
# Build all distribution formats
yarn build

# Clean distribution files
yarn clean
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`yarn test`)
5. Ensure all tests pass and coverage is maintained
6. Build the library (`yarn build`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- **Documentation**: [GitHub Repository](https://github.com/vimeshjs/vimesh-ui)
- **Examples**: [Live Examples on CodePen](https://codepen.io/collection/vimesh-ui)
- **Vimesh Headless UI**: [Component Library](https://github.com/vimeshjs/vimesh-headless)
- **Alpine.js**: [Official Website](https://alpinejs.dev/)
