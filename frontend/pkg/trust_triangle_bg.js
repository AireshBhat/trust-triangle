let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(
state => {
    wasm.__wbindgen_export_4.get(state.dtor)(state.a, state.b);
}
);

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_4.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_4.get(state.dtor)(state.a, state.b); state.a = 0;
                CLOSURE_DTORS.unregister(state);
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

export function start() {
    wasm.start();
}

/**
 * @returns {string}
 */
export function generate_key() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.generate_key(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
    }
}

function __wbg_adapter_6(arg0, arg1) {
    wasm.__wbindgen_export_5(arg0, arg1);
}

function __wbg_adapter_9(arg0, arg1, arg2) {
    wasm.__wbindgen_export_6(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_12(arg0, arg1) {
    wasm.__wbindgen_export_7(arg0, arg1);
}

function __wbg_adapter_15(arg0, arg1) {
    wasm.__wbindgen_export_8(arg0, arg1);
}

function __wbg_adapter_20(arg0, arg1, arg2) {
    wasm.__wbindgen_export_9(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_25(arg0, arg1, arg2) {
    wasm.__wbindgen_export_10(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_266(arg0, arg1, arg2, arg3) {
    wasm.__wbindgen_export_11(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const __wbindgen_enum_BinaryType = ["blob", "arraybuffer"];

const __wbindgen_enum_ReadableStreamType = ["bytes"];

const __wbindgen_enum_RequestCache = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));

export class IntoUnderlyingByteSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
     * @returns {ReadableStreamType}
     */
    get type() {
        const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
        return __wbindgen_enum_ReadableStreamType[ret];
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, addHeapObject(controller));
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingByteSource.prototype[Symbol.dispose] = IntoUnderlyingByteSource.prototype.free;

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));

export class IntoUnderlyingSink {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
     * @param {any} chunk
     * @returns {Promise<any>}
     */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, addHeapObject(chunk));
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return takeObject(ret);
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, addHeapObject(reason));
        return takeObject(ret);
    }
}
if (Symbol.dispose) IntoUnderlyingSink.prototype[Symbol.dispose] = IntoUnderlyingSink.prototype.free;

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));

export class IntoUnderlyingSource {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(IntoUnderlyingSource.prototype);
        obj.__wbg_ptr = ptr;
        IntoUnderlyingSourceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
     * @param {ReadableStreamDefaultController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingSource.prototype[Symbol.dispose] = IntoUnderlyingSource.prototype.free;

const PeerNodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_peernode_free(ptr >>> 0, 1));

export class PeerNode {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PeerNode.prototype);
        obj.__wbg_ptr = ptr;
        PeerNodeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PeerNodeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_peernode_free(ptr, 0);
    }
    /**
     * Spawns a new peer node.
     *
     * # Arguments
     * * `secret_key_str` - Optional hex-encoded secret key string. If None, a new key is generated.
     * * `role_str` - The role as a string: "employee", "issuer", or "verifier"
     * @param {string | null | undefined} secret_key_str
     * @param {string} role_str
     * @returns {Promise<PeerNode>}
     */
    static spawn(secret_key_str, role_str) {
        var ptr0 = isLikeNone(secret_key_str) ? 0 : passStringToWasm0(secret_key_str, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        var len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role_str, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_spawn(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @returns {ReadableStream}
     */
    events() {
        const ret = wasm.peernode_events(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @returns {string}
     */
    node_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.peernode_node_id(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    secret_key() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.peernode_secret_key(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} node_id
     * @param {string} payload
     * @returns {ReadableStream}
     */
    connect(node_id, payload) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(payload, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
            const len1 = WASM_VECTOR_LEN;
            wasm.peernode_connect(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get all pending credential requests (returns JSON string)
     * @returns {Promise<string>}
     */
    get_pending_requests() {
        const ret = wasm.peernode_get_pending_requests(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Approve a pending credential request
     * @param {string} request_id
     * @returns {Promise<void>}
     */
    approve_request(request_id) {
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_approve_request(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Reject a pending credential request
     * @param {string} request_id
     * @param {string | null} [reason]
     * @returns {Promise<void>}
     */
    reject_request(request_id, reason) {
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(reason) ? 0 : passStringToWasm0(reason, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_reject_request(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * Add a trusted issuer
     * @param {string} node_id
     * @returns {Promise<void>}
     */
    add_trusted_issuer(node_id) {
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_add_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Remove a trusted issuer
     * @param {string} node_id
     * @returns {Promise<void>}
     */
    remove_trusted_issuer(node_id) {
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_remove_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Check if an issuer is trusted
     * @param {string} node_id
     * @returns {Promise<boolean>}
     */
    is_trusted_issuer(node_id) {
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_is_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Get all trusted issuers (returns JSON string array)
     * @returns {Promise<string>}
     */
    get_trusted_issuers() {
        const ret = wasm.peernode_get_trusted_issuers(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get all verified credentials (returns JSON string)
     * @returns {Promise<string>}
     */
    get_verified_credentials() {
        const ret = wasm.peernode_get_verified_credentials(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a specific verified credential by presentation ID (returns JSON string or null)
     * @param {string} presentation_id
     * @returns {Promise<string | undefined>}
     */
    get_verified_credential(presentation_id) {
        const ptr0 = passStringToWasm0(presentation_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_get_verified_credential(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Get all received credentials (returns JSON string)
     * @returns {Promise<string>}
     */
    get_received_credentials() {
        const ret = wasm.peernode_get_received_credentials(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get a specific received credential by request ID (returns JSON string or null)
     * @param {string} request_id
     * @returns {Promise<string | undefined>}
     */
    get_received_credential(request_id) {
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_get_received_credential(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
}
if (Symbol.dispose) PeerNode.prototype[Symbol.dispose] = PeerNode.prototype.free;

export function __wbg_Error_e17e777aac105295(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_abort_67e1b49bf6614565(arg0) {
    getObject(arg0).abort();
};

export function __wbg_abort_d830bf2e9aa6ec5b(arg0, arg1) {
    getObject(arg0).abort(getObject(arg1));
};

export function __wbg_addEventListener_ae4c27d78f35f886() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_append_72a3c0addd2bce38() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_arrayBuffer_9c99b8e2809e8cbb() { return handleError(function (arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_body_4851aa049324a851(arg0) {
    const ret = getObject(arg0).body;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_buffer_8d40b1d762fb3c66(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_byobRequest_2c036bceca1e6037(arg0) {
    const ret = getObject(arg0).byobRequest;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_byteLength_331a6b5545834024(arg0) {
    const ret = getObject(arg0).byteLength;
    return ret;
};

export function __wbg_byteOffset_49a5b5608000358b(arg0) {
    const ret = getObject(arg0).byteOffset;
    return ret;
};

export function __wbg_call_13410aac570ffff7() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_a5400b25a865cfd8() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_cancel_8bb5b8f4906b658a(arg0) {
    const ret = getObject(arg0).cancel();
    return addHeapObject(ret);
};

export function __wbg_catch_c80ecae90cb8ed4e(arg0, arg1) {
    const ret = getObject(arg0).catch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_clearTimeout_7a42b49784aea641(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_clearTimeout_cbe3107816206ed5() { return handleError(function (arg0, arg1) {
    getObject(arg0).clearTimeout(takeObject(arg1));
}, arguments) };

export function __wbg_close_6437264570d2d37f() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_close_cccada6053ee3a65() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_close_d71a78219dc23e91() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };

export function __wbg_code_177e3bed72688e58(arg0) {
    const ret = getObject(arg0).code;
    return ret;
};

export function __wbg_code_89056d52bf1a8bb0(arg0) {
    const ret = getObject(arg0).code;
    return ret;
};

export function __wbg_crypto_574e78ad8b13b65f(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_data_9ab529722bcc4e6c(arg0) {
    const ret = getObject(arg0).data;
    return addHeapObject(ret);
};

export function __wbg_debug_55137df391ebfd29(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_export_1(arg0, arg1 * 4, 4);
    console.debug(...v0);
};

export function __wbg_done_75ed0ee6dd243d9d(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_enqueue_452bc2343d1c2ff9() { return handleError(function (arg0, arg1) {
    getObject(arg0).enqueue(getObject(arg1));
}, arguments) };

export function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_export_1(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_error_91947ba14c44e1c9(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_export_1(arg0, arg1 * 4, 4);
    console.error(...v0);
};

export function __wbg_fetch_74a3e84ebd2c9a0e(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_fetch_87aed7f306ec6d63(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_getRandomValues_1c61fac11405ffdc() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getRandomValues_38a1ff1ea09f6cc7() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getRandomValues_b8f5dbd5f3995a9e() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_getReader_48e00749fe3f6089() { return handleError(function (arg0) {
    const ret = getObject(arg0).getReader();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getTime_6bb3f64e0f18f817(arg0) {
    const ret = getObject(arg0).getTime();
    return ret;
};

export function __wbg_get_458e874b43b18b25() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getdone_f026246f6bbe58d3(arg0) {
    const ret = getObject(arg0).done;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

export function __wbg_getvalue_31e5a08f61e5aa42(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_has_b89e451f638123e3() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_headers_29fec3c72865cd75(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Blob_3db67efd3f1b960f(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Blob;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Response_50fde2cd696850bf(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_iterator_f370b34483c71a1c() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_length_6bb7e81f9d7713e4(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_log_e51ef223c244b133(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_export_1(arg0, arg1 * 4, 4);
    console.log(...v0);
};

export function __wbg_message_5481231e71ccaf7b(arg0, arg1) {
    const ret = getObject(arg1).message;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_msCrypto_a61aeb35a24c1329(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_new0_b0a0a38c201e6df5() {
    const ret = new Date();
    return addHeapObject(ret);
};

export function __wbg_new_19c25a3f2fa63a02() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_new_1f3a344cf3123716() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_new_2e3c58a15f39f5f9(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_266(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_new_638ebfaedbf32a5e(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_new_66b9434b4e59b63e() { return handleError(function () {
    const ret = new AbortController();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_8a6f238a6ece86ea() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_new_da9dc54c5db29dfa(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_new_e213f63d18b0de01() { return handleError(function (arg0, arg1) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_f6e53210afea8e45() { return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newfromslice_074c56947bd43469(arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_newnoargs_254190557c45b4ec(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_e8f53910b4d42b45(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithintounderlyingsource_b47f6a6a596a7f24(arg0, arg1) {
    const ret = new ReadableStream(IntoUnderlyingSource.__wrap(arg0), takeObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_newwithlength_a167dcc7aaa3ba77(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithstrandinit_b5d168a29a3fd85f() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newwithstrsequence_f7e2d4848dd49d98() { return handleError(function (arg0, arg1, arg2) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_next_5b3530e612fde77d(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_692e82279131b03c() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_node_905d3e251edff8a2(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_now_1e80617bcee43265() {
    const ret = Date.now();
    return ret;
};

export function __wbg_now_2c95c9de01293173(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_peernode_new(arg0) {
    const ret = PeerNode.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_performance_7a3ffd0b17f663ad(arg0) {
    const ret = getObject(arg0).performance;
    return addHeapObject(ret);
};

export function __wbg_process_dc0fbacc7c1c06f7(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_prototypesetcall_3d4a26c1ed734349(arg0, arg1, arg2) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
};

export function __wbg_push_330b2eb93e4e1212(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_queueMicrotask_25d0739ac89e8c88(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_queueMicrotask_4488407636f5bf24(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_ac0988aba3254290() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_read_bc925c758aa4d897(arg0) {
    const ret = getObject(arg0).read();
    return addHeapObject(ret);
};

export function __wbg_readyState_b0d20ca4531d3797(arg0) {
    const ret = getObject(arg0).readyState;
    return ret;
};

export function __wbg_reason_97efd955be6394bd(arg0, arg1) {
    const ret = getObject(arg1).reason;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_releaseLock_ff29b586502a8221(arg0) {
    getObject(arg0).releaseLock();
};

export function __wbg_removeEventListener_7d68951e6508eb3c() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_require_60cc747a6bc5215a() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_resolve_4055c623acdd6a1b(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_respond_6c2c4e20ef85138e() { return handleError(function (arg0, arg1) {
    getObject(arg0).respond(arg1 >>> 0);
}, arguments) };

export function __wbg_send_aa9cb445685f0fd0() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_send_bdda9fac7465e036() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).send(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_setTimeout_282db1c50d4a7304() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(takeObject(arg1), arg2);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_setTimeout_7bb3429662ab1e70(arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
};

export function __wbg_set_1353b2a5e96bc48c(arg0, arg1, arg2) {
    getObject(arg0).set(getArrayU8FromWasm0(arg1, arg2));
};

export function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_set_90f6c0f7bd8c0415(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_setbinaryType_37f3cd35d7775a47(arg0, arg1) {
    getObject(arg0).binaryType = __wbindgen_enum_BinaryType[arg1];
};

export function __wbg_setbody_c8460bdf44147df8(arg0, arg1) {
    getObject(arg0).body = getObject(arg1);
};

export function __wbg_setcache_90ca4ad8a8ad40d3(arg0, arg1) {
    getObject(arg0).cache = __wbindgen_enum_RequestCache[arg1];
};

export function __wbg_setcredentials_9cd60d632c9d5dfc(arg0, arg1) {
    getObject(arg0).credentials = __wbindgen_enum_RequestCredentials[arg1];
};

export function __wbg_sethandleevent_504d6c0317f9f4e9(arg0, arg1) {
    getObject(arg0).handleEvent = getObject(arg1);
};

export function __wbg_setheaders_0052283e2f3503d1(arg0, arg1) {
    getObject(arg0).headers = getObject(arg1);
};

export function __wbg_sethighwatermark_3d5961f834647d41(arg0, arg1) {
    getObject(arg0).highWaterMark = arg1;
};

export function __wbg_setmethod_9b504d5b855b329c(arg0, arg1, arg2) {
    getObject(arg0).method = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmode_a23e1a2ad8b512f8(arg0, arg1) {
    getObject(arg0).mode = __wbindgen_enum_RequestMode[arg1];
};

export function __wbg_setonclose_159c0332c2d91b09(arg0, arg1) {
    getObject(arg0).onclose = getObject(arg1);
};

export function __wbg_setonerror_5d9bff045f909e89(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_setonmessage_5e486f326638a9da(arg0, arg1) {
    getObject(arg0).onmessage = getObject(arg1);
};

export function __wbg_setonopen_3e43af381c2901f8(arg0, arg1) {
    getObject(arg0).onopen = getObject(arg1);
};

export function __wbg_setsignal_8c45ad1247a74809(arg0, arg1) {
    getObject(arg0).signal = getObject(arg1);
};

export function __wbg_signal_da4d466ce86118b5(arg0) {
    const ret = getObject(arg0).signal;
    return addHeapObject(ret);
};

export function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_static_accessor_GLOBAL_8921f820c2ce3f12() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_GLOBAL_THIS_f0a4409105898184() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_SELF_995b214ae681ff99() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_static_accessor_WINDOW_cde3890479c675ea() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_status_3fea3036088621d6(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_stringify_b98c93d0a190446a() { return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_subarray_70fd07feefe14294(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_then_b33a773d723afa3e(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_then_e22500defe16819f(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_url_18b0690200329f32(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_url_e5720dfacf77b05e(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_value_dd9372230531eade(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_versions_c01dfd4722a88165(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_view_91cc97d57ab30530(arg0) {
    const ret = getObject(arg0).view;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_warn_479b8bbb8337357b(arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_export_1(arg0, arg1 * 4, 4);
    console.warn(...v0);
};

export function __wbg_wasClean_ffb515fbcbcbdd3d(arg0) {
    const ret = getObject(arg0).wasClean;
    return ret;
};

export function __wbg_wbindgenbooleanget_3fe6f642c7d97746(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? v : undefined;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

export function __wbg_wbindgencbdrop_eb10308566512b88(arg0) {
    const obj = getObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbg_wbindgendebugstring_99ef257a3ddda34d(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_wbindgenisfunction_8cee7dce3725ae74(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_wbindgenisobject_307a53c6bd97fbf8(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_wbindgenisstring_d4fa939789f003b0(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_wbindgenisundefined_c4b71d073b92f3c5(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_wbindgenstringget_0f16a6ddddef376f(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_wbindgenthrow_451ec1a8469d7eb6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_cast_1f619bcbfb4be480(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 2203, function: Function { arguments: [], shim_idx: 2204, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 2203, __wbg_adapter_12);
    return addHeapObject(ret);
};

export function __wbindgen_cast_21609215504de59b(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1844, function: Function { arguments: [], shim_idx: 1845, ret: Unit, inner_ret: Some(Unit) }, mutable: false }) -> Externref`.
    const ret = makeClosure(arg0, arg1, 1844, __wbg_adapter_6);
    return addHeapObject(ret);
};

export function __wbindgen_cast_2241b6af4c4b2941(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_cast_4625c577ab2ec9ee(arg0) {
    // Cast intrinsic for `U64 -> Externref`.
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_cast_50021721f1608f25(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 2128, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 2129, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 2128, __wbg_adapter_9);
    return addHeapObject(ret);
};

export function __wbindgen_cast_6393160445cf4f0a(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 679, function: Function { arguments: [NamedExternref("CloseEvent")], shim_idx: 680, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 679, __wbg_adapter_25);
    return addHeapObject(ret);
};

export function __wbindgen_cast_a55e0f507077fb29(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3249, function: Function { arguments: [], shim_idx: 3250, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 3249, __wbg_adapter_15);
    return addHeapObject(ret);
};

export function __wbindgen_cast_a90358623acaf8ed(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3257, function: Function { arguments: [Externref], shim_idx: 3258, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 3257, __wbg_adapter_20);
    return addHeapObject(ret);
};

export function __wbindgen_cast_cb9088102bce6b30(arg0, arg1) {
    // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
    const ret = getArrayU8FromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_cast_d6cd19b81560fd6e(arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

