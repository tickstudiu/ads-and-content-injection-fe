import AdsInjectorComponent from './AdsInjector.vue'
import { createApp, h } from 'vue'
import './assets/main.css'

/**
 * inject(el, options)
 *
 * @param {string|HTMLElement} el  - CSS selector หรือ DOM element ที่จะ mount widget
 * @param {object} options         - config options
 * @param {string} options.baseUrl - API base URL
 * @param {string} options.clientId
 * @param {string} options.zoneId  - Ads zone identifier (ระบุตำแหน่ง)
 * @param {Function} options.onEvent - callback รับ event (impression, click, close)
 */
function inject(el, options = {}) {
    const target = typeof el === 'string' ? document.querySelector(el) : el
    if (!target) {
        console.warn('[AdsInjector] mount target not found:', el)
        return
    }
    const app = createApp({ render: () => h(AdsInjectorComponent, { ...options }) })
    app.mount(target)
}

const AdsInjector = { inject }

export default AdsInjector
export { AdsInjector }
AdsInjector.default = AdsInjector
