use crate::peer_node;

use anyhow::{Context, Result};
use n0_future::{Stream, StreamExt};
use iroh::SecretKey;
use serde::Serialize;
use tracing::level_filters::LevelFilter;
use tracing_subscriber_wasm::MakeConsoleWriter;
use wasm_bindgen::{JsError, prelude::wasm_bindgen};
use wasm_streams::{ReadableStream, readable::sys::ReadableStream as JsReadableStream};
use hex;

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();

    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::TRACE)
        .with_writer(
            // To avoide trace events in the browser from showing their JS backtrace
            MakeConsoleWriter::default().map_trace_level_to(tracing::Level::DEBUG),
        )
        // If we don't do this in the browser, we get a runtime error.
        .without_time()
        .with_ansi(false)
        .init();

    tracing::info!("(testing logging) Logging setup");
}

#[wasm_bindgen]
pub struct PeerNode(peer_node::PeerNode);

#[wasm_bindgen]
impl PeerNode {
    /// Spawns a new peer node.
    /// 
    /// # Arguments
    /// * `secret_key_str` - Optional hex-encoded secret key string. If None, a new key is generated.
    /// * `role_str` - The role as a string: "employee", "issuer", or "verifier"
    pub async fn spawn(secret_key_str: Option<String>, role_str: String) -> Result<Self, JsError> {
        // Parse the optional secret key
        let secret_key = if let Some(key_str) = secret_key_str {
            Some(
                key_str
                    .parse::<SecretKey>()
                    .context("failed to parse secret key")
                    .map_err(to_js_err)?
            )
        } else {
            None
        };

        // Parse the role from string
        let role = match role_str.to_lowercase().as_str() {
            "employee" => peer_node::Role::Employee,
            "issuer" => peer_node::Role::Issuer,
            "verifier" => peer_node::Role::Verifier,
            _ => return Err(JsError::new(&format!("Invalid role: {}. Must be 'employee', 'issuer', or 'verifier'", role_str))),
        };

        Ok(Self(peer_node::PeerNode::spawn(secret_key, role).await.map_err(to_js_err)?))
    }

    pub fn events(&self) -> JsReadableStream {
        let stream = self.0.accept_events();
        into_js_readable_stream(stream)
    }

    pub fn node_id(&self) -> String {
        self.0.endpoint().node_id().to_string()
    }

    pub fn secret_key(&self) -> String {
        // Convert SecretKey to hex string
        hex::encode(self.0.secret_key().to_bytes())
    }

    pub fn connect(&self, node_id: String, payload: String) -> Result<JsReadableStream, JsError> {
        let node_id = node_id
            .parse()
            .context("failed to parse node id")
            .map_err(to_js_err)?;
        let stream = self.0.connect(node_id, payload);
        Ok(into_js_readable_stream(stream))
    }
}

fn to_js_err(err: impl Into<anyhow::Error>) -> JsError {
    let err: anyhow::Error = err.into();
    JsError::new(&err.to_string())
}

fn into_js_readable_stream<T: Serialize>(
    stream: impl Stream<Item = T> + 'static,
) -> wasm_streams::readable::sys::ReadableStream {
    let stream = stream.map(|event| Ok(serde_wasm_bindgen::to_value(&event).unwrap()));
    ReadableStream::from_stream(stream).into_raw()
}

#[wasm_bindgen]
pub fn generate_key() -> String {
    let secret_key = SecretKey::generate(&mut rand::rng());
    hex::encode(secret_key.to_bytes())
}