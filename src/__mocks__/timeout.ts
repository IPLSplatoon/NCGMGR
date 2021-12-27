export function mockTimeout (): void {
    jest.spyOn(window, 'setTimeout').mockImplementation(handler => {
        // noinspection SuspiciousTypeOfGuard
        if (typeof handler !== 'string') {
            handler()
        }
        return 0
    })
}
