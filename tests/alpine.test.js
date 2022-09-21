const { sleep, loadHtml, fixture } = require('./utils')
const { waitFor, screen } = require('@testing-library/dom')

test('alpine basic', async () => {
    fixture()
    loadHtml(document.body, /*html*/`
            <div data-testid='container' class="text-red-500" @click="name='from click'" x-data="buildData()">hello <span x-text="name"></span></div>
            <script>
                function buildData(){
                    return {name:'from script'}
                }
            </script>
        `)
    await sleep(1)
    let el = screen.getByText('from script')
    expect(el).not.toBeNull()
    expect(el.getAttribute('x-text')).toBe('name')
    let elContainer = screen.getByTestId('container')
    await elContainer.click()
    expect(() => {
        el = screen.getByText('from script')
    }).toThrow()
    el = screen.getByText('from click')
    expect(el.getAttribute('x-text')).toBe('name')
})