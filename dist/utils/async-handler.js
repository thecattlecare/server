"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.AsyncHandler = void 0;
const AsyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.AsyncHandler = AsyncHandler;
// Backward-compatible alias used by some modules.
exports.asyncHandler = exports.AsyncHandler;
