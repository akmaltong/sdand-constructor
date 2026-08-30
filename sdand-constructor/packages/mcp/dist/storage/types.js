export class SceneNotFoundError extends Error {
    code = 'not_found';
    constructor(message = 'Scene not found') {
        super(message);
        this.name = 'SceneNotFoundError';
    }
}
export class SceneVersionConflictError extends Error {
    code = 'version_conflict';
    constructor(message = 'Scene version conflict') {
        super(message);
        this.name = 'SceneVersionConflictError';
    }
}
export class SceneInvalidError extends Error {
    code = 'invalid';
    constructor(message = 'Scene invalid') {
        super(message);
        this.name = 'SceneInvalidError';
    }
}
export class SceneTooLargeError extends Error {
    code = 'too_large';
    constructor(message = 'Scene too large') {
        super(message);
        this.name = 'SceneTooLargeError';
    }
}
