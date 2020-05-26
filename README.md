# function-call-interceptor

_Status_: Developing proof-of-concept

This project aims to provide language agnostic embedded development tooling to
help inspect and simulate different execution paths in full-stack projects. The
aim is to allow developers and testers to more easily trigger e.g. non-happy
-path code, when developing, demoing, or testing.

Conceptually the project aims to have break-point-like functionality,
suspending predetermined asynchronous calls for the user, so the user can
decide what to do with the specific call, e.g. trigger an error state, or
manipulate the function call arguments, return value, or timing.

The current design contains three components:

- Interceptor that wraps desired existing asynchronous function calls
- CLI/UI prompting user to decide what to do with each call when triggered
- Server to allow interacting with intercepted code remotely (e.g. API code)

Server component is not needed if only UI code is being inspected, and the
interceptor UI is mounted to it. Communicatioon goes essentially through a
"loopback".

## Event bus

A bus is a process-/browser-local shared resource that connects the intercepted
functions with a dispatcher.

The dispatcher can be:

- UI, used by human to modify the function call
- Function, for scripted functionality
- Bridge, allowing connection to another bus, and therefore possible external
  dispatchers (see below).

```
    BUS
     +--[ UI/function dispatcher ]
     |
     |   // Any async function can be wrapped by interceptor, suspending it for
     |   // manupilation before the call, before return, both, or bypassing
     |   // the real call altogether
     +--[ intercept('call', func)(args) ]
     +--[ intercept('return', func)(args) ]
     +--[ intercept('both', func)(args) ]
     +--[ intercept('bypass', func)(args) ]
     |
     X
```

## Event bridge

For distributed applications, interaction e.g. in UI can go through the full
application stack that may include multiple layers. A bridge connects multiple
buses together, allowing any connected dispatcher to interact with intercepted
functions that are connected to any part of the network.

```
 Browser          API
   BUS            BUS
    |              |
    +=== BRIDGE ===+--[ intercept('call', func)(args) ]
    |  dispatcher  |
    |              X
    |
    |            API 2
    |             BUS
    +=== BRIDGE ===+--[ intercept('call', func)(args) ]
    |  dispatcher  |
    |              X
    |
    +--[ intercept('return', func)(args) ]
    |
    +--[ UI/function dispatcher ]
    |
    X
```

## Events

```
BUS
 |  intercept  +-------------+
 |<------------|             |
 |             | INTERCEPTOR |
 +------------>|             |
 |   dispatch  +-------------+
 |
 |  intercept  +-------------+
 +------------>|             |
 |             | DISPATCHER  |
 |<------------|             |
 |   dispatch  +-------------+
 |
 X
```

## Loopback demo

UI-only setup

```
App                 Intercepted code   Loopback     UI

const val =         .                      .
  await wrapper() --+ catch args           .
                    |                      .
                    + --------event------> +
                    .                      |     Trigger prompt
                    .                      +-----+
                    .                      .     | user dispatches [args]
                    .                      +-----+
                    receive event          |
                    + <-------event------- +
                    |                      .
                    | [value] = await call([args])
                    |                      .
                    + --------event------> +
                    .                      |     Trigger prompt
                    .                      +-----+
                    .                      .     | user return [value]
                    .                      +-----|
                    receive event          |
                    + <-------event------- +
                    |
val === [value]  ---+ return event value
```
