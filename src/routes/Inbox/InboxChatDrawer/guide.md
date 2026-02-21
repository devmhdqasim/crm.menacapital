Uncaught (in promise) TypeError: messageWaId.includes is not a function
    at index.jsx:175:41
    at WebSocketContext.tsx:270:11
    at Set.forEach (<anonymous>)
    at Socket2.<anonymous> (WebSocketContext.tsx:269:37)
    at Emitter.emit (socket__io-client.js?v=d9172612:819:20)
    at Socket2.emitEvent (socket__io-client.js?v=d9172612:3158:16)
    at Socket2.onevent (socket__io-client.js?v=d9172612:3146:12)
    at Socket2.onpacket (socket__io-client.js?v=d9172612:3117:14)
    at Emitter.emit (socket__io-client.js?v=d9172612:819:20)
    at socket__io-client.js?v=d9172612:3721:12
(anonymous) @ index.jsx:175
(anonymous) @ WebSocketContext.tsx:270
(anonymous) @ WebSocketContext.tsx:269
Emitter.emit @ socket__io-client.js?v=d9172612:819
emitEvent @ socket__io-client.js?v=d9172612:3158
onevent @ socket__io-client.js?v=d9172612:3146
onpacket @ socket__io-client.js?v=d9172612:3117
Emitter.emit @ socket__io-client.js?v=d9172612:819
(anonymous) @ socket__io-client.js?v=d9172612:3721
Promise.then
(anonymous) @ socket__io-client.js?v=d9172612:837
ondecoded @ socket__io-client.js?v=d9172612:3720
Emitter.emit @ socket__io-client.js?v=d9172612:819
add @ socket__io-client.js?v=d9172612:2541
ondata @ socket__io-client.js?v=d9172612:3709
Emitter.emit @ socket__io-client.js?v=d9172612:819
_onPacket @ socket__io-client.js?v=d9172612:1844
Emitter.emit @ socket__io-client.js?v=d9172612:819
onPacket @ socket__io-client.js?v=d9172612:1018
onData @ socket__io-client.js?v=d9172612:1010
ws.onmessage @ socket__io-client.js?v=d9172612:1474Understand this error