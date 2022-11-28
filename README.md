# Why Vimesh UI
I hate compiling frontend code with complex toolchains, like webpack, rollup, vite etc. Unfortunately, most frontend frameworks heavily depends on them. Alpine.js is clean, powerful and without extra build process. While it is a challenge to develop a UI library directly with Alpine.js. Vimesh UI is an ultra lightweight library to build UI components for Alpine.js. 

# Basic Usages
Just add Vimesh UI CDN url before Alpine.js
```html
    <script src="https://unpkg.com/@vimesh/ui"></script>
    <script src="https://unpkg.com/alpinejs" defer></script>
```
Now there are three important Alpine.js directives to build your own UI components

## x-component
This directive creates an HTML native custom element around Alpine.js template.

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

It shows `Hello Vimesh UI`. There is a default custom element prefix `vui-`. You could change the default component namespace.

```html
<head>
    <script src="https://unpkg.com/@vimesh/ui"></script>
    <script src="https://unpkg.com/alpinejs" defer></script>
    <script>
        $vui.config = {
            namespace: 'myui'
        }
    </script>
</head>

<body>
    <myui-greeting>My UI</myui-greeting>

    <template x-component="greeting">
        <h1>Hello <slot></slot>
        </h1>
    </template>
</body>
```
[Run on codepen](https://codepen.io/vimeshjs/pen/LYrrjdq)

## x-import
Of course, we don't want to embed common components in every page. The `x-import` directive helps to load remote components asynchronously. Let's extract the greeting component into a standalone file. 
> /hello-remote.html
```html
<head>
    <script src="https://unpkg.com/@vimesh/ui"></script>
    <script src="https://unpkg.com/alpinejs" defer></script>
    <script>
        $vui.config.importMap = {
            "*": './components/${component}.html'
        }
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
    <h1>Cloud Hello <slot></slot>
    </h1>
</template>
```
The components could be loaded from anywhere, like 
```html
    <script>
        $vui.config.importMap = {
            "*": 'https://unpkg.com/@vimesh/ui/examples/components/${component}.html'
        }
    </script>
```
[Run on codepen](https://codepen.io/vimeshjs/pen/poKKrYd)

## x-include
Sometimes we just need to load a piece of html. The `x-include` is convenient to use in this case.
> /include-article.html
```html
<head>
    <script src="https://unpkg.com/@vimesh/ui"></script>
    <script src="https://unpkg.com/alpinejs" defer></script>      
</head>

<body x-data>
    Load into the external "div" tag:<br>
    <div style="background-color: #888;" x-include="./static/article"></div>

    Unwrap the external "div" tag:<br>
    <div style="background-color: #888;" x-include.unwrap="./static/article"></div>
</body>
```
> /static/article.html
```html
<h1>Title</h1>
<p>
    Content
</p>
```
[Run on codepen](https://codepen.io/vimeshjs/pen/poKKrYd)

