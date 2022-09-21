const { sleep, loadHtml, fixture, Normalizer } = require('./utils')
const { screen } = require('@testing-library/dom')


test('display dialog', async () => {
    fixture(true)

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
    await sleep(1)
    let elSimple = screen.getByTestId('simple')
    expect(elSimple).toHaveClass('bg-green-500 p-8 text-sky-800 block')
    let elDefault = screen.getByTestId('slot-default')
    let normalizer = new Normalizer()
    let expectedHtml = normalizer.domString(`<p class="text-red-500"> 
    This is 
    <span>Vimesh UI</span>
    </p>`)
    expect(normalizer.domNode(elDefault)).toEqual(expectedHtml)
    expectedHtml = normalizer.domString(`<div > Hello Vui ! </div>`)
    let elName = screen.getByTestId('slot-name')
    expect(normalizer.domNode(elName)).toEqual(expectedHtml)
})