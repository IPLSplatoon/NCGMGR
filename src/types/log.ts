export interface LogEvent {
    message: string
    type?: 'success' | 'info' | 'error'
}

export interface ProgressEvent {
    message: string
    step?: number
    maxStep?: number
}

export enum ActionState {
    COMPLETED_SUCCESS,
    COMPLETED_ERROR,
    INCOMPLETE
}
