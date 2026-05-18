/**
 * useAdsViewability
 *
 * ตรวจสอบว่า user เห็น ad จริงๆ ใน viewport ตาม IAB Viewability Standard:
 *   ≥ 50% ของ ad element อยู่ใน viewport นาน ≥ 1,000ms ติดต่อกัน
 *
 * ต่างจาก impression ที่ fire ตอน render — view fire เมื่อ user เห็นจริง
 * Marketing/Ecom ควรใช้ view เป็น metric หลักแทน impression
 *
 * Usage:
 *   const { observe, unobserve, disconnectAll } = useAdsViewability(
 *     (slotId) => emitEvent('view', slotId, ...)
 *   )
 *   observe(slot.slotId, containerElement)  // เริ่ม watch หลัง inject ลง DOM
 *   unobserve(slot.slotId)                  // หยุด watch เมื่อ close
 */
export function useAdsViewability(onView: (slotId: string) => void) {
    // เก็บ observer + timer แยกตาม slotId
    const observers = new Map<string, { observer: IntersectionObserver; timer: ReturnType<typeof setTimeout> | null }>()

    function observe(slotId: string, element: HTMLElement) {
        if (observers.has(slotId)) return // ป้องกัน observe ซ้ำ

        let timer: ReturnType<typeof setTimeout> | null = null

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.intersectionRatio >= 0.5) {
                        // เข้า viewport ≥ 50% → เริ่มนับ 1 วินาที
                        if (!timer) {
                            timer = setTimeout(() => {
                                onView(slotId)
                                // view fire แล้ว → หยุด observe (fire ครั้งเดียวต่อ ad)
                                observer.disconnect()
                                observers.delete(slotId)
                            }, 1000)
                            observers.get(slotId)!.timer = timer
                        }
                    } else {
                        // ออกจาก viewport ก่อนครบ 1 วินาที → reset timer
                        if (timer) {
                            clearTimeout(timer)
                            timer = null
                            const entry = observers.get(slotId)
                            if (entry) entry.timer = null
                        }
                    }
                }
            },
            { threshold: [0, 0.5] } // trigger เมื่อข้าม 50% ทั้งขาเข้าและขาออก
        )

        observer.observe(element)
        observers.set(slotId, { observer, timer })
    }

    function unobserve(slotId: string) {
        const entry = observers.get(slotId)
        if (!entry) return
        if (entry.timer) clearTimeout(entry.timer)
        entry.observer.disconnect()
        observers.delete(slotId)
    }

    function disconnectAll() {
        observers.forEach((entry) => {
            if (entry.timer) clearTimeout(entry.timer)
            entry.observer.disconnect()
        })
        observers.clear()
    }

    return { observe, unobserve, disconnectAll }
}
