export interface LogEvent {
    message: string
    type?: 'success' | 'info' | 'error'
}
