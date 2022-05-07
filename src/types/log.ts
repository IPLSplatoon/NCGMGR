export interface LogEvent {
    message: string
    type?: 'success' | 'info' | 'error'
}

export interface ProgressEvent {
    step: number
    // eslint-disable-next-line camelcase
    max_step: number
}

export enum ActionState {
    COMPLETED_SUCCESS,
    COMPLETED_ERROR,
    INCOMPLETE
}
