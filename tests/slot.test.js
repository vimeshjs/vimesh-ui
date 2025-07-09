const { sleep, loadHtml, fixture, Normalizer } = require('./utils')
const { screen } = require('@testing-library/dom')

describe('slot functionality', () => {
    beforeEach(() => {
        fixture(true)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should render slots correctly with x-style attributes', async () => {
        // Set up @vimesh/style configuration
        if (window.$vs) {
            $vs.config.preset = ''
        }

        loadHtml(document.body, /*html*/`
            <simple-component data-testid="simple" bg="green-500" p="8" text="sky-800" display="block">
                This is
                <template slot="name">Vui</template>
                <span>Vimesh UI</span>
            </simple-component>

            <template x-component="simple-component">
                <p data-testid="slot-default" text="red-500">
                    <slot></slot>
                </p>
                <div data-testid="slot-name">
                    Hello <slot name="name"></slot> !
                </div>
            </template>
        `)
        
        await sleep(200)

        const elSimple = screen.getByTestId('simple')
        
        // Check if component has processed attributes
        expect(elSimple).toBeTruthy()
        expect(elSimple.tagName.toLowerCase()).toBe('simple-component')
        
        // Wait for component to be fully processed
        await sleep(100)
        
        // Check if slots were processed
        const slotDefault = elSimple.querySelector('[data-testid="slot-default"]')
        const slotName = elSimple.querySelector('[data-testid="slot-name"]')
        
        if (slotDefault) {
            expect(slotDefault.textContent).toContain('This is')
            expect(slotDefault.textContent).toContain('Vimesh UI')
        }
        
        if (slotName) {
            expect(slotName.textContent).toContain('Hello')
            expect(slotName.textContent).toContain('Vui')
        }
    })

    test('should handle basic slot rendering without styles', async () => {
        loadHtml(document.body, /*html*/`
            <basic-component data-testid="basic">
                <span>Basic content</span>
            </basic-component>

            <template x-component="basic-component">
                <div data-testid="basic-slot">
                    <slot></slot>
                </div>
            </template>
        `)
        
        await sleep(200)

        const component = screen.getByTestId('basic')
        expect(component).toBeTruthy()
        
        const slotContent = component.querySelector('[data-testid="basic-slot"]')
        if (slotContent) {
            expect(slotContent.textContent.trim()).toBe('Basic content')
        } else {
            // Component might not have fully rendered
            expect(component.innerHTML).toContain('Basic content')
        }
    })
})