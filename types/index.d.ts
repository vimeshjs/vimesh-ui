// Type definitions for Vimesh UI
// Project: https://github.com/vimeshjs/vimesh-ui

declare namespace VimeshUI {

  export interface Config {
    debug?: boolean;
    namespace?: string;
    autoImport?: boolean;
    importMap?: Record<string, string>;
    styleVariantPrefix?: string;
  }

  export interface ComponentMeta {
    type: string;
    namespace: string;
    prefix?: string;
  }

  export interface ComponentAPI {
    // Lifecycle hooks
    onMounted?(): void;
    onUnmounted?(): void;
    onAttributeChanged?(name: string, oldValue: string, newValue: string): void;
    
    // Built-in methods
    $of(type?: string): ComponentAPI | null;
    $meta: ComponentMeta;
    $parent: HTMLElement | null;
    $closest(filter: string | ((el: HTMLElement) => boolean)): HTMLElement | null;
    $find(filter: string | ((el: HTMLElement) => boolean)): HTMLElement[];
    $findOne(filter: string | ((el: HTMLElement) => boolean)): HTMLElement | null;
    $prop(name: string, fallback?: any): any;
    $el: HTMLElement;
    
    // User-defined methods and properties
    [key: string]: any;
  }

  export interface StyleConfig {
    base?: string;
    variants?: Record<string, Record<string, string>>;
    compoundVariants?: Array<{
      conditions: Record<string, any> | string | ((variants: Record<string, any>, el: HTMLElement) => boolean);
      classes: string;
    }>;
    defaultVariants?: Record<string, string>;
    parts?: Record<string, string>;
    parent?: string;
    config?: {
      exclude?: string[] | RegExp | RegExp[];
    };
  }

  export interface Utils {
    elapse(): number;
    isString(value: any): value is string;
    isArray(value: any): value is any[];
    isFunction(value: any): value is Function;
    isPlainObject(value: any): value is object;
    each<T>(collection: T[] | Record<string, T>, callback: (value: T, key: string | number, index: number) => void): void;
    map<T, R>(collection: T[] | Record<string, T>, callback: (value: T, key: string | number, index: number) => R): R[];
    filter<T>(collection: T[] | Record<string, T>, callback: (value: T, key: string | number, index: number) => boolean): T[];
    extend<T extends object>(target: T, ...sources: Partial<T>[]): T;
  }

  export interface Core {
    // Configuration
    config: Config;
    
    // Utilities
    _: Utils;
    
    // Core methods
    ready(callback: () => void): void;
    
    // Component management
    setups: Record<string, (el: HTMLElement) => ComponentAPI>;
    components: Record<string, typeof HTMLElement>;
    addNamespace(namespace: string): void;
    getComponentMeta(el: HTMLElement): ComponentMeta | null;
    isComponent(el: HTMLElement): boolean;
    visitComponents(container: HTMLElement, callback: (el: HTMLElement) => void): void;
    findChildComponents(container: HTMLElement, filter: string | ((el: HTMLElement) => boolean)): HTMLElement[];
    getParentComponent(el: HTMLElement): HTMLElement | null;
    findClosestComponent(el: HTMLElement, filter: string | ((el: HTMLElement) => boolean)): HTMLElement | null;
    
    // API access
    $api(el: HTMLElement): ComponentAPI | null;
    $data(el: HTMLElement): any;
    
    // DOM manipulation
    setHtml(el: HTMLElement, html: string): void;
    defer(callback: () => void): void;
    dom(html: string): HTMLElement | HTMLElement[];
    nextTick(callback: () => void): Promise<void>;
    effect(callback: () => void | (() => void)): () => void;
    focus(el: HTMLElement, options?: FocusOptions): void;
    scrollIntoView(el: HTMLElement, options?: ScrollIntoViewOptions): void;
    
    // Component loading
    import(components: string | string[]): Promise<void>;
    imports?: Record<string, any>;
    
    // HTML inclusion
    include(el: HTMLElement, urls: string[]): Promise<void>;
    
    // Styling
    setStyle(name: string, config: StyleConfig): void;
    setStyle(theme: string, name: string, config: StyleConfig): void;
    getStyle(name: string): StyleConfig | undefined;
    getStyle(theme: string, name: string): StyleConfig | undefined;
    loadStyles(styles: Record<string, StyleConfig>): void;
    loadThemes(themes: Record<string, Record<string, StyleConfig>>): void;
    setTheme(theme: string): void;
    getTheme(): string;
    configClassCategories(categories: Record<string, any>): void;
    
    // Internal methods (prefixed with _ or in specific contexts)
    extractNamespaces(container: HTMLElement): void;
    prepareComponents(container: HTMLElement): void;
  }

  // Component definition helper
  export interface ComponentDefinition<T extends ComponentAPI = ComponentAPI> {
    template: string;
    setup?: (el: HTMLElement) => T;
    namespace?: string;
    unwrap?: boolean;
  }

}

// Global declarations
declare global {
  interface Window {
    $vui: VimeshUI.Core;
    Alpine: any;
  }

  const $vui: VimeshUI.Core;
}

// Export namespace
export = VimeshUI;
export as namespace VimeshUI;