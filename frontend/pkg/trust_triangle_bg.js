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

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
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
        result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
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

    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

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
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
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
    wasm.__wbindgen_export_7.get(state.dtor)(state.a, state.b);
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
                wasm.__wbindgen_export_7.get(state.dtor)(a, state.b);
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
                wasm.__wbindgen_export_7.get(state.dtor)(state.a, state.b); state.a = 0;
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

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @returns {string}
 */
export function generate_key() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.generate_key();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

function __wbg_adapter_6(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h595f4163325b68dc(arg0, arg1);
}

function __wbg_adapter_11(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h78016f0c535c1275(arg0, arg1);
}

function __wbg_adapter_14(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.closure1762_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_17(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.closure3138_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_22(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h5c1ccd3ccc4abe59(arg0, arg1);
}

function __wbg_adapter_25(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.closure1419_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_32(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h7131e44d0d2d72d1(arg0, arg1);
}

function __wbg_adapter_269(arg0, arg1, arg2, arg3) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.closure3173_externref_shim(arg0, arg1, arg2, arg3);
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

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

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
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
        return __wbindgen_enum_ReadableStreamType[ret];
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, controller);
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        const ptr = this.__destroy_into_raw();
        _assertNum(ptr);
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingByteSource.prototype[Symbol.dispose] = IntoUnderlyingByteSource.prototype.free;

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));

export class IntoUnderlyingSink {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

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
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, chunk);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        const ptr = this.__destroy_into_raw();
        _assertNum(ptr);
        const ret = wasm.intounderlyingsink_close(ptr);
        return ret;
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        const ptr = this.__destroy_into_raw();
        _assertNum(ptr);
        const ret = wasm.intounderlyingsink_abort(ptr, reason);
        return ret;
    }
}
if (Symbol.dispose) IntoUnderlyingSink.prototype[Symbol.dispose] = IntoUnderlyingSink.prototype.free;

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));

export class IntoUnderlyingSource {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

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
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        const ptr = this.__destroy_into_raw();
        _assertNum(ptr);
        wasm.intounderlyingsource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingSource.prototype[Symbol.dispose] = IntoUnderlyingSource.prototype.free;

const PeerNodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_peernode_free(ptr >>> 0, 1));

export class PeerNode {

    constructor() {
        throw new Error('cannot invoke `new` directly');
    }

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
        var ptr0 = isLikeNone(secret_key_str) ? 0 : passStringToWasm0(secret_key_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_spawn(ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @returns {ReadableStream}
     */
    events() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.peernode_events(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    node_id() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.peernode_node_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    secret_key() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.peernode_secret_key(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} node_id
     * @param {string} payload
     * @returns {ReadableStream}
     */
    connect(node_id, payload) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(payload, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_connect(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Get all pending credential requests (returns JSON string)
     * @returns {Promise<string>}
     */
    get_pending_requests() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.peernode_get_pending_requests(this.__wbg_ptr);
        return ret;
    }
    /**
     * Approve a pending credential request
     * @param {string} request_id
     * @returns {Promise<void>}
     */
    approve_request(request_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_approve_request(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Reject a pending credential request
     * @param {string} request_id
     * @param {string | null} [reason]
     * @returns {Promise<void>}
     */
    reject_request(request_id, reason) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(reason) ? 0 : passStringToWasm0(reason, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_reject_request(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * Add a trusted issuer
     * @param {string} node_id
     * @returns {Promise<void>}
     */
    add_trusted_issuer(node_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_add_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Remove a trusted issuer
     * @param {string} node_id
     * @returns {Promise<void>}
     */
    remove_trusted_issuer(node_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_remove_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Check if an issuer is trusted
     * @param {string} node_id
     * @returns {Promise<boolean>}
     */
    is_trusted_issuer(node_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(node_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_is_trusted_issuer(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Get all trusted issuers (returns JSON string array)
     * @returns {Promise<string>}
     */
    get_trusted_issuers() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.peernode_get_trusted_issuers(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get all verified credentials (returns JSON string)
     * @returns {Promise<string>}
     */
    get_verified_credentials() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.peernode_get_verified_credentials(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get a specific verified credential by presentation ID (returns JSON string or null)
     * @param {string} presentation_id
     * @returns {Promise<string | undefined>}
     */
    get_verified_credential(presentation_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(presentation_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_get_verified_credential(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Get all received credentials (returns JSON string)
     * @returns {Promise<string>}
     */
    get_received_credentials() {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ret = wasm.peernode_get_received_credentials(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get a specific received credential by request ID (returns JSON string or null)
     * @param {string} request_id
     * @returns {Promise<string | undefined>}
     */
    get_received_credential(request_id) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(request_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.peernode_get_received_credential(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) PeerNode.prototype[Symbol.dispose] = PeerNode.prototype.free;

export function __wbg_Error_e17e777aac105295() { return logError(function (arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_abort_67e1b49bf6614565() { return logError(function (arg0) {
    arg0.abort();
}, arguments) };

export function __wbg_abort_d830bf2e9aa6ec5b() { return logError(function (arg0, arg1) {
    arg0.abort(arg1);
}, arguments) };

export function __wbg_addEventListener_ae4c27d78f35f886() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_append_72a3c0addd2bce38() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_arrayBuffer_9c99b8e2809e8cbb() { return handleError(function (arg0) {
    const ret = arg0.arrayBuffer();
    return ret;
}, arguments) };

export function __wbg_body_4851aa049324a851() { return logError(function (arg0) {
    const ret = arg0.body;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_buffer_8d40b1d762fb3c66() { return logError(function (arg0) {
    const ret = arg0.buffer;
    return ret;
}, arguments) };

export function __wbg_byobRequest_2c036bceca1e6037() { return logError(function (arg0) {
    const ret = arg0.byobRequest;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_byteLength_331a6b5545834024() { return logError(function (arg0) {
    const ret = arg0.byteLength;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_byteOffset_49a5b5608000358b() { return logError(function (arg0) {
    const ret = arg0.byteOffset;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_call_13410aac570ffff7() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_call_a5400b25a865cfd8() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_cancel_8bb5b8f4906b658a() { return logError(function (arg0) {
    const ret = arg0.cancel();
    return ret;
}, arguments) };

export function __wbg_catch_c80ecae90cb8ed4e() { return logError(function (arg0, arg1) {
    const ret = arg0.catch(arg1);
    return ret;
}, arguments) };

export function __wbg_clearTimeout_15dfc3d1dcb635c6() { return handleError(function (arg0, arg1) {
    arg0.clearTimeout(arg1);
}, arguments) };

export function __wbg_clearTimeout_5de27855b2967b4a() { return handleError(function (arg0, arg1) {
    arg0.clearTimeout(arg1);
}, arguments) };

export function __wbg_clearTimeout_7a42b49784aea641() { return logError(function (arg0) {
    const ret = clearTimeout(arg0);
    return ret;
}, arguments) };

export function __wbg_close_6437264570d2d37f() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_cccada6053ee3a65() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_d71a78219dc23e91() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_code_177e3bed72688e58() { return logError(function (arg0) {
    const ret = arg0.code;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_code_89056d52bf1a8bb0() { return logError(function (arg0) {
    const ret = arg0.code;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_crypto_574e78ad8b13b65f() { return logError(function (arg0) {
    const ret = arg0.crypto;
    return ret;
}, arguments) };

export function __wbg_data_9ab529722bcc4e6c() { return logError(function (arg0) {
    const ret = arg0.data;
    return ret;
}, arguments) };

export function __wbg_debug_55137df391ebfd29() { return logError(function (arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    console.debug(...v0);
}, arguments) };

export function __wbg_done_75ed0ee6dd243d9d() { return logError(function (arg0) {
    const ret = arg0.done;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_enqueue_452bc2343d1c2ff9() { return handleError(function (arg0, arg1) {
    arg0.enqueue(arg1);
}, arguments) };

export function __wbg_error_7534b8e9a36f1ab4() { return logError(function (arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
}, arguments) };

export function __wbg_error_91947ba14c44e1c9() { return logError(function (arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    console.error(...v0);
}, arguments) };

export function __wbg_fetch_74a3e84ebd2c9a0e() { return logError(function (arg0) {
    const ret = fetch(arg0);
    return ret;
}, arguments) };

export function __wbg_fetch_87aed7f306ec6d63() { return logError(function (arg0, arg1) {
    const ret = arg0.fetch(arg1);
    return ret;
}, arguments) };

export function __wbg_getRandomValues_1c61fac11405ffdc() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getRandomValues_38a1ff1ea09f6cc7() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getRandomValues_b8f5dbd5f3995a9e() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments) };

export function __wbg_getReader_48e00749fe3f6089() { return handleError(function (arg0) {
    const ret = arg0.getReader();
    return ret;
}, arguments) };

export function __wbg_getTime_6bb3f64e0f18f817() { return logError(function (arg0) {
    const ret = arg0.getTime();
    return ret;
}, arguments) };

export function __wbg_get_458e874b43b18b25() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_getdone_f026246f6bbe58d3() { return logError(function (arg0) {
    const ret = arg0.done;
    if (!isLikeNone(ret)) {
        _assertBoolean(ret);
    }
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
}, arguments) };

export function __wbg_getvalue_31e5a08f61e5aa42() { return logError(function (arg0) {
    const ret = arg0.value;
    return ret;
}, arguments) };

export function __wbg_has_b89e451f638123e3() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(arg0, arg1);
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_headers_29fec3c72865cd75() { return logError(function (arg0) {
    const ret = arg0.headers;
    return ret;
}, arguments) };

export function __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_instanceof_Blob_3db67efd3f1b960f() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof Blob;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_instanceof_Response_50fde2cd696850bf() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_iterator_f370b34483c71a1c() { return logError(function () {
    const ret = Symbol.iterator;
    return ret;
}, arguments) };

export function __wbg_length_6bb7e81f9d7713e4() { return logError(function (arg0) {
    const ret = arg0.length;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_log_e51ef223c244b133() { return logError(function (arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    console.log(...v0);
}, arguments) };

export function __wbg_message_5481231e71ccaf7b() { return logError(function (arg0, arg1) {
    const ret = arg1.message;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_msCrypto_a61aeb35a24c1329() { return logError(function (arg0) {
    const ret = arg0.msCrypto;
    return ret;
}, arguments) };

export function __wbg_new0_b0a0a38c201e6df5() { return logError(function () {
    const ret = new Date();
    return ret;
}, arguments) };

export function __wbg_new_19c25a3f2fa63a02() { return logError(function () {
    const ret = new Object();
    return ret;
}, arguments) };

export function __wbg_new_1f3a344cf3123716() { return logError(function () {
    const ret = new Array();
    return ret;
}, arguments) };

export function __wbg_new_2e3c58a15f39f5f9() { return logError(function (arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_269(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return ret;
    } finally {
        state0.a = state0.b = 0;
    }
}, arguments) };

export function __wbg_new_638ebfaedbf32a5e() { return logError(function (arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
}, arguments) };

export function __wbg_new_66b9434b4e59b63e() { return handleError(function () {
    const ret = new AbortController();
    return ret;
}, arguments) };

export function __wbg_new_8a6f238a6ece86ea() { return logError(function () {
    const ret = new Error();
    return ret;
}, arguments) };

export function __wbg_new_da9dc54c5db29dfa() { return logError(function (arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_new_e213f63d18b0de01() { return handleError(function (arg0, arg1) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_new_f6e53210afea8e45() { return handleError(function () {
    const ret = new Headers();
    return ret;
}, arguments) };

export function __wbg_newfromslice_074c56947bd43469() { return logError(function (arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_newnoargs_254190557c45b4ec() { return logError(function (arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_newwithbyteoffsetandlength_e8f53910b4d42b45() { return logError(function (arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
}, arguments) };

export function __wbg_newwithintounderlyingsource_b47f6a6a596a7f24() { return logError(function (arg0, arg1) {
    const ret = new ReadableStream(IntoUnderlyingSource.__wrap(arg0), arg1);
    return ret;
}, arguments) };

export function __wbg_newwithlength_a167dcc7aaa3ba77() { return logError(function (arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
}, arguments) };

export function __wbg_newwithstrandinit_b5d168a29a3fd85f() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_newwithstrsequence_f7e2d4848dd49d98() { return handleError(function (arg0, arg1, arg2) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_next_5b3530e612fde77d() { return logError(function (arg0) {
    const ret = arg0.next;
    return ret;
}, arguments) };

export function __wbg_next_692e82279131b03c() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_node_905d3e251edff8a2() { return logError(function (arg0) {
    const ret = arg0.node;
    return ret;
}, arguments) };

export function __wbg_now_1e80617bcee43265() { return logError(function () {
    const ret = Date.now();
    return ret;
}, arguments) };

export function __wbg_now_2c95c9de01293173() { return logError(function (arg0) {
    const ret = arg0.now();
    return ret;
}, arguments) };

export function __wbg_peernode_new() { return logError(function (arg0) {
    const ret = PeerNode.__wrap(arg0);
    return ret;
}, arguments) };

export function __wbg_performance_7a3ffd0b17f663ad() { return logError(function (arg0) {
    const ret = arg0.performance;
    return ret;
}, arguments) };

export function __wbg_process_dc0fbacc7c1c06f7() { return logError(function (arg0) {
    const ret = arg0.process;
    return ret;
}, arguments) };

export function __wbg_prototypesetcall_3d4a26c1ed734349() { return logError(function (arg0, arg1, arg2) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
}, arguments) };

export function __wbg_push_330b2eb93e4e1212() { return logError(function (arg0, arg1) {
    const ret = arg0.push(arg1);
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_queueMicrotask_25d0739ac89e8c88() { return logError(function (arg0) {
    queueMicrotask(arg0);
}, arguments) };

export function __wbg_queueMicrotask_4488407636f5bf24() { return logError(function (arg0) {
    const ret = arg0.queueMicrotask;
    return ret;
}, arguments) };

export function __wbg_randomFillSync_ac0988aba3254290() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments) };

export function __wbg_read_bc925c758aa4d897() { return logError(function (arg0) {
    const ret = arg0.read();
    return ret;
}, arguments) };

export function __wbg_readyState_b0d20ca4531d3797() { return logError(function (arg0) {
    const ret = arg0.readyState;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_reason_97efd955be6394bd() { return logError(function (arg0, arg1) {
    const ret = arg1.reason;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_releaseLock_ff29b586502a8221() { return logError(function (arg0) {
    arg0.releaseLock();
}, arguments) };

export function __wbg_removeEventListener_7d68951e6508eb3c() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_require_60cc747a6bc5215a() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments) };

export function __wbg_resolve_4055c623acdd6a1b() { return logError(function (arg0) {
    const ret = Promise.resolve(arg0);
    return ret;
}, arguments) };

export function __wbg_respond_6c2c4e20ef85138e() { return handleError(function (arg0, arg1) {
    arg0.respond(arg1 >>> 0);
}, arguments) };

export function __wbg_send_aa9cb445685f0fd0() { return handleError(function (arg0, arg1, arg2) {
    arg0.send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_send_bdda9fac7465e036() { return handleError(function (arg0, arg1, arg2) {
    arg0.send(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_setTimeout_4eb823e8b72fbe79() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.setTimeout(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_setTimeout_7bb3429662ab1e70() { return logError(function (arg0, arg1) {
    const ret = setTimeout(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_setTimeout_fe5a06d54df0b75c() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.setTimeout(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_set_1353b2a5e96bc48c() { return logError(function (arg0, arg1, arg2) {
    arg0.set(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_set_3f1d0b984ed272ed() { return logError(function (arg0, arg1, arg2) {
    arg0[arg1] = arg2;
}, arguments) };

export function __wbg_set_90f6c0f7bd8c0415() { return logError(function (arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
}, arguments) };

export function __wbg_setbinaryType_37f3cd35d7775a47() { return logError(function (arg0, arg1) {
    arg0.binaryType = __wbindgen_enum_BinaryType[arg1];
}, arguments) };

export function __wbg_setbody_c8460bdf44147df8() { return logError(function (arg0, arg1) {
    arg0.body = arg1;
}, arguments) };

export function __wbg_setcache_90ca4ad8a8ad40d3() { return logError(function (arg0, arg1) {
    arg0.cache = __wbindgen_enum_RequestCache[arg1];
}, arguments) };

export function __wbg_setcredentials_9cd60d632c9d5dfc() { return logError(function (arg0, arg1) {
    arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
}, arguments) };

export function __wbg_sethandleevent_504d6c0317f9f4e9() { return logError(function (arg0, arg1) {
    arg0.handleEvent = arg1;
}, arguments) };

export function __wbg_setheaders_0052283e2f3503d1() { return logError(function (arg0, arg1) {
    arg0.headers = arg1;
}, arguments) };

export function __wbg_sethighwatermark_3d5961f834647d41() { return logError(function (arg0, arg1) {
    arg0.highWaterMark = arg1;
}, arguments) };

export function __wbg_setmethod_9b504d5b855b329c() { return logError(function (arg0, arg1, arg2) {
    arg0.method = getStringFromWasm0(arg1, arg2);
}, arguments) };

export function __wbg_setmode_a23e1a2ad8b512f8() { return logError(function (arg0, arg1) {
    arg0.mode = __wbindgen_enum_RequestMode[arg1];
}, arguments) };

export function __wbg_setonclose_159c0332c2d91b09() { return logError(function (arg0, arg1) {
    arg0.onclose = arg1;
}, arguments) };

export function __wbg_setonerror_5d9bff045f909e89() { return logError(function (arg0, arg1) {
    arg0.onerror = arg1;
}, arguments) };

export function __wbg_setonmessage_5e486f326638a9da() { return logError(function (arg0, arg1) {
    arg0.onmessage = arg1;
}, arguments) };

export function __wbg_setonopen_3e43af381c2901f8() { return logError(function (arg0, arg1) {
    arg0.onopen = arg1;
}, arguments) };

export function __wbg_setsignal_8c45ad1247a74809() { return logError(function (arg0, arg1) {
    arg0.signal = arg1;
}, arguments) };

export function __wbg_signal_da4d466ce86118b5() { return logError(function (arg0) {
    const ret = arg0.signal;
    return ret;
}, arguments) };

export function __wbg_stack_0ed75d68575b0f3c() { return logError(function (arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_static_accessor_GLOBAL_8921f820c2ce3f12() { return logError(function () {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_static_accessor_GLOBAL_THIS_f0a4409105898184() { return logError(function () {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_static_accessor_SELF_995b214ae681ff99() { return logError(function () {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_static_accessor_WINDOW_cde3890479c675ea() { return logError(function () {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_status_3fea3036088621d6() { return logError(function (arg0) {
    const ret = arg0.status;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_stringify_b98c93d0a190446a() { return handleError(function (arg0) {
    const ret = JSON.stringify(arg0);
    return ret;
}, arguments) };

export function __wbg_subarray_70fd07feefe14294() { return logError(function (arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
}, arguments) };

export function __wbg_then_b33a773d723afa3e() { return logError(function (arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_then_e22500defe16819f() { return logError(function (arg0, arg1) {
    const ret = arg0.then(arg1);
    return ret;
}, arguments) };

export function __wbg_url_18b0690200329f32() { return logError(function (arg0, arg1) {
    const ret = arg1.url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_url_e5720dfacf77b05e() { return logError(function (arg0, arg1) {
    const ret = arg1.url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_value_dd9372230531eade() { return logError(function (arg0) {
    const ret = arg0.value;
    return ret;
}, arguments) };

export function __wbg_versions_c01dfd4722a88165() { return logError(function (arg0) {
    const ret = arg0.versions;
    return ret;
}, arguments) };

export function __wbg_view_91cc97d57ab30530() { return logError(function (arg0) {
    const ret = arg0.view;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_warn_479b8bbb8337357b() { return logError(function (arg0, arg1) {
    var v0 = getArrayJsValueFromWasm0(arg0, arg1).slice();
    wasm.__wbindgen_free(arg0, arg1 * 4, 4);
    console.warn(...v0);
}, arguments) };

export function __wbg_wasClean_ffb515fbcbcbdd3d() { return logError(function (arg0) {
    const ret = arg0.wasClean;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_wbindgenbooleanget_3fe6f642c7d97746(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? v : undefined;
    if (!isLikeNone(ret)) {
        _assertBoolean(ret);
    }
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
};

export function __wbg_wbindgencbdrop_eb10308566512b88(arg0) {
    const obj = arg0.original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    _assertBoolean(ret);
    return ret;
};

export function __wbg_wbindgendebugstring_99ef257a3ddda34d(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_wbindgenisfunction_8cee7dce3725ae74(arg0) {
    const ret = typeof(arg0) === 'function';
    _assertBoolean(ret);
    return ret;
};

export function __wbg_wbindgenisobject_307a53c6bd97fbf8(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    _assertBoolean(ret);
    return ret;
};

export function __wbg_wbindgenisstring_d4fa939789f003b0(arg0) {
    const ret = typeof(arg0) === 'string';
    _assertBoolean(ret);
    return ret;
};

export function __wbg_wbindgenisundefined_c4b71d073b92f3c5(arg0) {
    const ret = arg0 === undefined;
    _assertBoolean(ret);
    return ret;
};

export function __wbg_wbindgenstringget_0f16a6ddddef376f(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_wbindgenthrow_451ec1a8469d7eb6(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_cast_2241b6af4c4b2941() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}, arguments) };

export function __wbindgen_cast_2c88fa17cde1979b() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1600, function: Function { arguments: [], shim_idx: 1601, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 1600, __wbg_adapter_22);
    return ret;
}, arguments) };

export function __wbindgen_cast_2eb2a81026257e87() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1755, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 1762, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 1755, __wbg_adapter_14);
    return ret;
}, arguments) };

export function __wbindgen_cast_4625c577ab2ec9ee() { return logError(function (arg0) {
    // Cast intrinsic for `U64 -> Externref`.
    const ret = BigInt.asUintN(64, arg0);
    return ret;
}, arguments) };

export function __wbindgen_cast_7716cc70b73cd303() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1573, function: Function { arguments: [], shim_idx: 1574, ret: Unit, inner_ret: Some(Unit) }, mutable: false }) -> Externref`.
    const ret = makeClosure(arg0, arg1, 1573, __wbg_adapter_11);
    return ret;
}, arguments) };

export function __wbindgen_cast_829f10b963d787db() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3128, function: Function { arguments: [], shim_idx: 3129, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 3128, __wbg_adapter_32);
    return ret;
}, arguments) };

export function __wbindgen_cast_a95dc4322c0f51cc() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1873, function: Function { arguments: [], shim_idx: 1874, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 1873, __wbg_adapter_6);
    return ret;
}, arguments) };

export function __wbindgen_cast_aa70f022af4f3153() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 3137, function: Function { arguments: [Externref], shim_idx: 3138, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 3137, __wbg_adapter_17);
    return ret;
}, arguments) };

export function __wbindgen_cast_c568a8b822828d36() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 1418, function: Function { arguments: [NamedExternref("CloseEvent")], shim_idx: 1419, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, 1418, __wbg_adapter_25);
    return ret;
}, arguments) };

export function __wbindgen_cast_cb9088102bce6b30() { return logError(function (arg0, arg1) {
    // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
    const ret = getArrayU8FromWasm0(arg0, arg1);
    return ret;
}, arguments) };

export function __wbindgen_cast_d6cd19b81560fd6e() { return logError(function (arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return ret;
}, arguments) };

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_2;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

