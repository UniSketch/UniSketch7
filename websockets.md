# Table of Contents
- [Websocket Sketch Protocol](#websocket-sketch-protocol)
- [Client-to-Server Messages](#client-to-server-messages)
  * [Join Session](#join-session)
  * [Start Line](#start-line)
  * [Continue Line](#continue-line)
  * [Move Last Vertex](#move-last-vertex)
  * [Delete Line](#delete-line)
  * [Set Background Color](#set-background-color)
- [Server-to-Client Messages](#server-to-client-messages)
  * [Welcome Message](#welcome-message)
  * [Sketch Properties](#sketch-properties)
  * [Partial Sketch Lines](#partial-sketch-lines)
  * [Line Drawn](#line-drawn)
  * [Line Continued](#line-continued)
  * [Line Confirmed](#line-confirmed)
  * [Line Deleted](#line-deleted)
  * [Background Color Updated](#background-color-updated)
  * [Participant Joined](#participant-joined)
  * [Participant Left](#participant-left)
  * [Client Role Updated](#client-role-updated)
  * [Client Kicked](#client-kicked)
  * [Request Failed](#request-failed)

# Websocket Sketch Protocol
In order to connect to the WebSocket server, the client must first authenticate via the `/unisketch4/api/auth/` REST endpoint.

Upon successful connection to the server, the server will respond with a `hello` message.

Before any of the messages can be sent, a sketch must be joined via the `join_sketch` message.
In case of error, a `fail` message will be sent.

In this document, whenever "users" are mentioned, it's assumed to be active sketch participants.

# Client-to-Server Messages

## Join Session
### Name
`join_sketch`

### Description
Joins the sketch with the given id. Requires at least viewer role on the sketch.

### Required Body
| Name      | Type   | Description               |
| --------- | ------ | ------------------------- |
| sketch_id | number | ID of the sketch to join. |

### Expected Response
* User will receive the full sketch via `sketch` and `sketch_part`.
* Other users will be notified of the new participant via `user_join`.



## Start Line
### Name
`start_line`

### Description
Starts drawing a new line at the specified position.

### Required Body
| Name  | Type   | Description                               |
| ----- | ------ | ----------------------------------------- |
| x     | number | X position of the new line.               |
| y     | number | Y position of the new line.               |
| color | string | Hex string of the color for the new line. |
| width | number | Width of the new line.                    |

### Expected Response
* User will received confirmation via `confirm_line`.
* Other users will receive the new line via `draw_line`.



## Continue Line
### Name
`continue_line`

### Description
Appends vertices to the last drawn line by this client. Requires `start_line` to be sent first.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |

### Expected Response
* Other users will receive the new vertices via `continue_line`.



## Move Last Vertex
### Name
`move_last_vertex`

### Description
Allows clients to move the last vertex of their last drawn line. Used for client-side line optimization. Requires start_line to be sent first. Note that this is only necessary when the batch interval is set to immediate mode.

### Required Body
| Name | Type   | Description                            |
| ---- | ------ | -------------------------------------- |
| x    | number | X position to move the last vertex to. |
| y    | number | Y position to move the last vertex to. |

### Expected Response
* Other users will receive the moved vertex via `continue_line`.



## Delete Line
### Name
`delete_line`

### Description
Deletes a line by its id.

### Required Body
| Name    | Type   | Description                   |
| ------- | ------ | ----------------------------- |
| line_id | number | ID of the line to be deleted. |

### Expected Response
* All users will be notified via `delete_line`.



## Set Background Color
### Name
`background_color`

### Description
Changes the background color of this sketch.

### Required Body
| Name  | Type   | Description                             |
| ----- | ------ | --------------------------------------- |
| color | string | Hex string of the new background color. |

### Expected Response
* All users will be notified via `background_color`.

# Server-to-Client Messages

## Welcome Message
### Name
`hello`

### Description
The first packet sent to a new client. The batch interval determines at which interval the client may send new line vertices while drawing.
The batch interval is in milliseconds. A batch interval of `0` means instant updates, `-1` means lines are only sent once the line is finished.

### Required Body
| Name           | Type   | Description                                                               |
| -------------- | ------ | ------------------------------------------------------------------------- |
| batch_interval | number | Interval at which the client should send new line vertices while drawing. |



## Sketch Properties
### Name
`sketch`

### Description
Sent when the client joins a sketch. Contains sketch properties like title and background color.

### Required Body
| Name             | Type   | Description                                |
| ---------------- | ------ | ------------------------------------------ |
| title            | string | Title of the sketch.                       |
| background_color | string | Hex string of the sketch background color. |
| role             | number | Role ID of this client for this sketch.    |



## Partial Sketch Lines
### Name
`sketch_part`

### Description
Partial sketch lines. Multiple of these are sent following the `sketch` message, depending on the size of the sketch.

### Required Body
| Name  | Type   | Description            |
| ----- | ------ | ---------------------- |
| lines | array  | Array of line objects. |

### Line Object Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the line.                                           |
| color    | string | Hex string of the line color.                             |
| width    | number | Width of the line.                                        |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Drawn
### Name
`draw_line`

### Description
Notifies clients about a new line.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the new line.                                       |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Continued
### Name
`continue_line`

### Description
Notifies clients about new vertices added to a line.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the altered line.                                   |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Confirmed
### Name
`confirm_line`

### Description
Sent to a client in response to `start_line`.

### Required Body
| Name     | Type   | Description               |
| -------- | ------ | ------------------------- |
| line_id  | number | ID of the confirmed line. |



## Line Deleted
### Name
`delete_line`

### Description
Notifies clients about a line deletion.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the deleted line.                                   |



## Background Color Updated
### Name
`background_color`

### Description
Notifies clients about a background color change.

### Required Body
| Name  | Type   | Description                             |
| ----- | ------ | --------------------------------------- |
| color | string | Hex string of the new background color. |



## Participant Joined
### Name
`user_join`

### Description
Notifies clients about a new participant joining a sketching session.

### Required Body
| Name | Type   | Description                  |
| ---- | ------ | ---------------------------- |
| name | string | Name of the new participant. |



## Participant Left
### Name
`user_leave`

### Description
Notifies clients about a participant leaving a sketching session.

### Required Body
| Name | Type   | Description                      |
| ---- | ------ | -------------------------------- |
| name | string | Name of the leaving participant. |



## Client Role Updated
### Name
`role_updated`

### Description
Sent to a client when their role in this sketch is updated.

### Required Body
| Name | Type   | Description                                 |
| ---- | ------ | ------------------------------------------- |
| role | number | New role ID for this client on this sketch. |



## Client Kicked
### Name
`kicked`

### Description
Sent to a client when they are kicked from the session. Reasons can currently only be `rights_revoked`.

### Required Body
| Name    | Type   | Description              |
| ------- | ------ | ------------------------ |
| message | string | Reason for being kicked. |



### Request Failed
### Name
`fail`

### Description
Sent to a client in case of an error. Only message is `no_permission` currently, and it is only sent if `join_sketch` fails.

### Required Body
| Name    | Type   | Description         |
| ------- | ------ | ------------------- |
| message | string | Error message code. |

  * [Client Role Updated](#client-role-updated)
    + [Name](#name-16)
    + [Description](#description-16)
    + [Required Body](#required-body-16)
  * [Client Kicked](#client-kicked)
    + [Name](#name-17)
    + [Description](#description-17)
    + [Required Body](#required-body-17)
    + [Request Failed](#request-failed)
    + [Name](#name-18)
    + [Description](#description-18)
    + [Required Body](#required-body-18)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>


# Websocket Sketch Protocol
In order to connect to the WebSocket server, the client must first authenticate via the `/unisketch4/api/auth/` REST endpoint.

Upon successful connection to the server, the server will respond with a `hello` message.

Before any of the messages can be sent, a sketch must be joined via the `join_sketch` message.
In case of error, a `fail` message will be sent.

In this document, whenever "users" are mentioned, it's assumed to be active sketch participants.

# Client-to-Server Messages

## Join Session
### Name
`join_sketch`

### Description
Joins the sketch with the given id. Requires at least viewer role on the sketch.

### Required Body
| Name      | Type   | Description               |
| --------- | ------ | ------------------------- |
| sketch_id | number | ID of the sketch to join. |

### Expected Response
* User will receive the full sketch via `sketch` and `sketch_part`.
* Other users will be notified of the new participant via `user_join`.



## Start Line
### Name
`start_line`

### Description
Starts drawing a new line at the specified position.

### Required Body
| Name  | Type   | Description                               |
| ----- | ------ | ----------------------------------------- |
| x     | number | X position of the new line.               |
| y     | number | Y position of the new line.               |
| color | string | Hex string of the color for the new line. |
| width | number | Width of the new line.                    |

### Expected Response
* User will received confirmation via `confirm_line`.
* Other users will receive the new line via `draw_line`.



## Continue Line
### Name
`continue_line`

### Description
Appends vertices to the last drawn line by this client. Requires `start_line` to be sent first.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |

### Expected Response
* Other users will receive the new vertices via `continue_line`.



## Move Last Vertex
### Name
`move_last_vertex`

### Description
Allows clients to move the last vertex of their last drawn line. Used for client-side line optimization. Requires start_line to be sent first. Note that this is only necessary when the batch interval is set to immediate mode.

### Required Body
| Name | Type   | Description                            |
| ---- | ------ | -------------------------------------- |
| x    | number | X position to move the last vertex to. |
| y    | number | Y position to move the last vertex to. |

### Expected Response
* Other users will receive the moved vertex via `continue_line`.



## Delete Line
### Name
`delete_line`

### Description
Deletes a line by its id.

### Required Body
| Name    | Type   | Description                   |
| ------- | ------ | ----------------------------- |
| line_id | number | ID of the line to be deleted. |

### Expected Response
* All users will be notified via `delete_line`.



## Set Background Color
### Name
`background_color`

### Description
Changes the background color of this sketch.

### Required Body
| Name  | Type   | Description                             |
| ----- | ------ | --------------------------------------- |
| color | string | Hex string of the new background color. |

### Expected Response
* All users will be notified via `background_color`.

# Server-to-Client Messages

## Welcome Message
### Name
`hello`

### Description
The first packet sent to a new client. The batch interval determines at which interval the client may send new line vertices while drawing.
The batch interval is in milliseconds. A batch interval of `0` means instant updates, `-1` means lines are only sent once the line is finished.

### Required Body
| Name           | Type   | Description                                                               |
| -------------- | ------ | ------------------------------------------------------------------------- |
| batch_interval | number | Interval at which the client should send new line vertices while drawing. |



## Sketch Properties
### Name
`sketch`

### Description
Sent when the client joins a sketch. Contains sketch properties like title and background color.

### Required Body
| Name             | Type   | Description                                |
| ---------------- | ------ | ------------------------------------------ |
| title            | string | Title of the sketch.                       |
| background_color | string | Hex string of the sketch background color. |
| role             | number | Role ID of this client for this sketch.    |



## Partial Sketch Lines
### Name
`sketch_part`

### Description
Partial sketch lines. Multiple of these are sent following the `sketch` message, depending on the size of the sketch.

### Required Body
| Name  | Type   | Description            |
| ----- | ------ | ---------------------- |
| lines | array  | Array of line objects. |

### Line Object Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the line.                                           |
| color    | string | Hex string of the line color.                             |
| width    | number | Width of the line.                                        |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Drawn
### Name
`draw_line`

### Description
Notifies clients about a new line.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the new line.                                       |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Continued
### Name
`continue_line`

### Description
Notifies clients about new vertices added to a line.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the altered line.                                   |
| vertices | array  | Vertex positions in number sequence (x1, y1, x2, y2, ...) |



## Line Confirmed
### Name
`confirm_line`

### Description
Sent to a client in response to `start_line`.

### Required Body
| Name     | Type   | Description               |
| -------- | ------ | ------------------------- |
| line_id  | number | ID of the confirmed line. |



## Line Deleted
### Name
`delete_line`

### Description
Notifies clients about a line deletion.

### Required Body
| Name     | Type   | Description                                               |
| -------- | ------ | --------------------------------------------------------- |
| line_id  | number | ID of the deleted line.                                   |



## Background Color Updated
### Name
`background_color`

### Description
Notifies clients about a background color change.

### Required Body
| Name  | Type   | Description                             |
| ----- | ------ | --------------------------------------- |
| color | string | Hex string of the new background color. |



## Participant Joined
### Name
`user_join`

### Description
Notifies clients about a new participant joining a sketching session.

### Required Body
| Name | Type   | Description                  |
| ---- | ------ | ---------------------------- |
| name | string | Name of the new participant. |



## Participant Left
### Name
`user_leave`

### Description
Notifies clients about a participant leaving a sketching session.

### Required Body
| Name | Type   | Description                      |
| ---- | ------ | -------------------------------- |
| name | string | Name of the leaving participant. |



## Client Role Updated
### Name
`role_updated`

### Description
Sent to a client when their role in this sketch is updated.

### Required Body
| Name | Type   | Description                                 |
| ---- | ------ | ------------------------------------------- |
| role | number | New role ID for this client on this sketch. |



## Client Kicked
### Name
`kicked`

### Description
Sent to a client when they are kicked from the session. Reasons can currently only be `rights_revoked`.

### Required Body
| Name    | Type   | Description              |
| ------- | ------ | ------------------------ |
| message | string | Reason for being kicked. |



## Request Failed
### Name
`fail`

### Description
Sent to a client in case of an error. Only message is `no_permission` currently, and it is only sent if `join_sketch` fails.

### Required Body
| Name    | Type   | Description         |
| ------- | ------ | ------------------- |
| message | string | Error message code. |
