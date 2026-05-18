export function useAdsTarget() {
    function getTargetElement(selector?: string): Element | null {
        if (!selector) return null
        return document.querySelector(selector)
    }

    function injectBefore(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        target?.parentElement?.insertBefore(node, target)
    }

    function injectAfter(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        target?.parentElement?.insertBefore(node, target.nextSibling)
    }

    function injectReplace(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        if (target?.parentElement) {
            target.parentElement.replaceChild(node, target)
        }
    }

    function injectTop(containerSelector: string, node: HTMLElement) {
        const container = getTargetElement(containerSelector)
        if (container) {
            container.insertBefore(node, container.firstChild)
        }
    }

    function injectBottom(containerSelector: string, node: HTMLElement) {
        const container = getTargetElement(containerSelector)
        container?.appendChild(node)
    }

    return { getTargetElement, injectBefore, injectAfter, injectReplace, injectTop, injectBottom }
}
