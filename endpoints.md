# Table of Contents
- [Response Format](#response-format)
- [Authentication](#authentication)
- [User Sketch Roles](#user-sketch-roles)
- [Endpoints](#endpoints)
  * [Login](#login)
  * [Logout](#logout)
  * [Request Password Reset](#request-password-reset)
  * [Check Password Reset](#check-password-reset)
  * [Complete Password Reset](#complete-password-reset)
  * [Create User](#create-user)
  * [Get User](#get-user)
  * [Update User](#update-user)
  * [Delete User](#delete-user)
  * [Get Sketches](#get-sketches)
  * [Create Sketch](#create-sketch)
  * [Update Sketch Metadata](#update-sketch-metadata)
  * [Get Sketch Preview](#get-sketch-preview)
  * [Update Sketch Preview](#update-sketch-preview)
  * [Delete Sketch](#delete-sketch)
  * [List Rights](#list-rights)
  * [Grant Right](#grant-right)
  * [Revoke Right](#revoke-right)

# Response Format
All endpoints will return a json string of the following form, indicating success or failure of the request.
```json
{
    "success": false,
    "error": "Everything is on fire.",
    
    "...": "... more data, see each endpoint individually ..."
}
```

The error field is omitted if the request was successful.

In addition to the errors listed below, nearly every endpoint will also error with 'bad_request' if the body sent is malformed. Endpoints that require authentication will error with 'not_logged_in' if the user is not logged in. In case of a runtime error in the server, the error will be 'internal_server_error'.

# Authentication
Upon successful authentication, a session id will be stored in a cookie called `connect.sid`. Additionally, a cookie `UniSketchUserId` will be set, which can be read by JavaScript.

# User Sketch Roles
| Role ID | Name   | Permissions                                                         |
| ------- | ------ | ------------------------------------------------------------------- |
| 1       | Viewer | May view the sketch this role was granted for.                      |
| 2       | Editor | May update the sketch this role was granted for.                    |
| 3       | Owner  | May delete and grant roles on the sketch this role was granted for. |

# Endpoints

## Login
Authenticates this client.

### URL
`POST /unisketch4/api/auth`

### Required Body
| Name          | Type   | Description                               |
| ------------- | ------ | ----------------------------------------- |
| email_address | string | Email address of the user to log in.      |
| password      | string | Plaintext password of the user to log in. |

### Example Response
```json
{
    "success": true,
    "user_id": 123
}
```
| Response Field | Type   | Description               |
| -------------- | ------ | ------------------------- |
| user_id        | number | ID of the logged in user. |

### Possible Errors
| Error Code         | Description                                     |
| ------------------ | ----------------------------------------------- |
| user_not_found     | No user with the given email address was found. |
| incorrect_password | The password given is incorrect.                |



## Logout
Destroys the current session, logging this client out.

### Authentication
User must be logged in.

### URL
`POST /unisketch4/api/auth/logout`



## Request Password Reset
Generates a password request token and sends it to the user via email.

### URL
`POST /unisketch4/api/auth/request_password_reset`

### Required Body
| Name          | Type   | Description                                                |
| ------------- | ------ | ---------------------------------------------------------- |
| email_address | string | Email address of the user to request a password reset for. |

### Possible Errors
| Error Code     | Description                                     |
| -------------- | ----------------------------------------------- |
| user_not_found | No user with the given email address was found. |



## Check Password Reset
Checks a password reset token for validity.

### URL
`GET /unisketch4/api/auth/password_reset`

### Required Body
| Name        | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| reset_token | string | Password reset token to check for validity. |

### Possible Errors
| Error Code     | Description                           |
| -------------- | ------------------------------------- |
| user_not_found | The password reset token is invalid.  |
| token_expired  | The password reset token has expired. |



## Complete Password Reset
Completes a password reset, changing the user password and invalidating the token.

### URL
`POST /unisketch4/api/auth/password_reset`

### Required Body
| Name        | Type   | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| reset_token | string | Password reset token the user was sent per mail. |
| password    | string | New plaintext password for the user.             |

### Possible Errors
| Error Code     | Description                           |
| -------------- | ------------------------------------- |
| token_expired  | The password reset token has expired. |



## Create User
Registers a new user.

### URL
`POST /unisketch4/api/auth/register`

### Required Body
| Name          | Type   | Description                             |
| ------------- | ------ | --------------------------------------- |
| name          | string | The username of the new user.           |
| email_address | string | The email address of the new user.      |
| password      | string | The plaintext password of the new user. |

### Example Response
```json
{ 
    "success": true,
    "user_id": 533
}
```
| Response Field | Type   | Description                   |
| -------------- | ------ | ----------------------------- |
| user_id        | number | ID of the newly created user. |

### Possible Errors
| Error Code    | Description                                  |
| ------------- | -------------------------------------------- |
| email_in_use  | User with this email address already exists. |



## Get User
Gets information on the currently logged in user.

### Authentication
User must be logged in.

### URL
`GET /unisketch4/api/user`

### Example Response
```json
{ 
    "id": 43,
    "name": "TestUser",
    "email_address": "test@example.com",
    "avatar_sketch_id": 32
}
```
| Response Field    | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| id                | number | ID of the currently logged in user.            |
| name              | string | Username of the currently logged in user.      |
| email_address     | string | Email address of the currently logged in user. |
| avatar_sketch_id  | number | Sketch ID of the sketch used as an avatar.     |



## Update User
Updates user information of the currently logged in user.

### Authentication
User must be logged in.

### URL
`POST /unisketch4/api/user`

### Optional Body
| Name             | Type   | Description                                                         |
| ---------------- | ------ | ------------------------------------------------------------------- |
| old_password     | string | The current plaintext password. Optional when only changing avatar. |
| name             | string | The new username for the user. Requires old_password.          |
| email_address    | string | The new email address for the user. Requires old_password.          |
| password         | string | The new plaintext password for the user. Required old_password.     |
| avatar_sketch_id | number | The new avatar sketch id for the user.                              |


### Possible Errors
| Error Code         | Description                                       |
| ------------------ | ------------------------------------------------- |
| incorrect_password | The old password given is incorrect.              |
| no_permission      | The selected sketch can not be used as an avatar. |



## Delete User
Deletes the currently logged in user.

### Authentication
User must be logged in.

### URL
`POST /unisketch4/api/user/delete`



## Get Sketches
Gets information on all sketches the current user is allowed to view.

### Authentication
User must be logged in.

### URL
`GET /unisketch4/api/sketches`

### Example Response
```json
{
    "success": true,
    "sketches": [
        {
            "id": 1,
            "title": "New Sketch #1",
            "is_owner": true,
            "is_editor": true,
            "updated_at": "2017-11-09T11:29:11.105Z",
            "created_at": "2017-11-08T10:31:15.146Z"
        },
        {
            "id": 3,
            "title": "Funny Sketch",
            "is_owner": false,
            "is_editor": true,
            "updated_at": "2017-10-02T08:23:21.351Z",
            "created_at": "2017-12-04T09:39:55.277Z"
        }
    ]
}
```
| Response Field | Type   | Description                                          |
| -------------- | ------ | ---------------------------------------------------- |
| sketches       | array  | List of sketches the user has access to.             |
| id             | number | ID of the sketch.                                    |
| title          | string | Title of the sketch.                                 |
| is_creator     | bool   | True if current user created this sketch.            |
| is_owner       | bool   | True if current user has owner role on this sketch.  |
| is_editor      | bool   | True if current user has editor role on this sketch. |
| updated_at     | string | Datetime string of when the sketch was last updated. |
| created_at     | string | Datetime string of when the sketch was created.      |



## Create Sketch
Creates a new sketch and assigns the current user as its owner.

### Authentication
User must be logged in.

### URL
`POST /unisketch4/api/sketch`

### Required Body
| Name  | Type   | Description              |
| ----- | ------ | ------------------------ |
| title | string | Title of the new sketch. |

### Example Response
```json
{
    "success": true,
    "sketch_id": 54
}
```
| Response Field | Type   | Description                     |
| -------------- | ------ | ------------------------------- |
| sketch_id      | number | ID of the newly created sketch. |



## Update Sketch Metadata
Updates the title of a sketch.

### Authentication
* User must be logged in.
* User must have at least editor role on this sketch.

### URL
`POST /unisketch4/api/sketch/meta`

### Required Body
| Name      | Type   | Description                 |
| --------- | ------ | --------------------------- |
| sketch_id | number | ID of the sketch to update. |
| title     | string | New title of the sketch.    |



## Get Sketch Preview
Returns the sketch preview as an image/png image.

### Authentication
* User must be logged in.
* User must have at least viewer role on this sketch.

### URL
`GET /unisketch4/api/sketch/preview/:sketch_id`

### Required URL Parameter
| Name      | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| sketch_id | number | ID of the sketch preview to request. |

### Possible Errors
| Error Code       | Description                                        |
| ---------------- | -------------------------------------------------- |
| sketch_not_found | Sketch with the given id could not be found.       |
| no_permission    | User does not have permission to view this sketch. |



## Update Sketch Preview
Updates the preview for a sketch.

### Authentication
* User must be logged in.
* User must have at least editor role on this sketch.

### URL
`POST /unisketch4/api/sketch/preview/:sketch_id`

### Required URL Parameter
| Name      | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| sketch_id | number | ID of the sketch to update the preview for. |

### Required Body
| Name    | Type | Description                               |
| ------- | ---- | ----------------------------------------- |
| preview | file | Preview image file of mimetype image/png. |

### Possible Errors
| Error Code       | Description                                          |
| ---------------- | ---------------------------------------------------- |
| sketch_not_found | Sketch with the given id could not be found.         |
| no_permission    | User does not have permission to update this sketch. |



## Delete Sketch
Deletes a sketch with a given id. This will delete the sketch completely, from everyone's view.

### Authentication
* User must be logged in.
* User must have at least owner role on this sketch.

### URL
`POST /unisketch4/api/sketch/delete/:sketch_id`

### Required URL Parameter
| Name      | Type   | Description                 |
| --------- | ------ | --------------------------- |
| sketch_id | number | ID of the sketch to delete. |

### Possible Errors
| Error Code       | Description                                          |
| ---------------- | ---------------------------------------------------- |
| sketch_not_found | Sketch with the given id could not be found.         |
| no_permission    | User does not have permission to delete this sketch. |



## List Rights
Lists all users with rights to the sketch with the given id.

### Authentication
* User must be logged in.
* User must have at least viewer role on this sketch.
* Email addresses in response will only be included if user has at least owner role on this sketch.

### URL
`GET /unisketch4/api/rights/:sketch_id`

### Example Response
```json
{
    "success": true,
    "user_roles": [
        {
            "user_id": 1,
            "name": "s0551417",
            "email_address": "s0551417@htw-berlin.de",
            "role": 3
        },
        {
            "user_id": 2,
            "name": "s012345",
            "email_address": "s012345@htw-berlin.de",
            "role": 2
        }
    ]
}
```
| Response Field | Type   | Description                                                              |
| -------------- | ------ | ------------------------------------------------------------------------ |
| user_roles     | array  | List of the participants of this sketch.                                 |
| user_id        | number | ID of the participant user.                                              |
| name           | string | Username of the participant user.                                        |
| email_address  | string | Email address of the participant user. Only included if caller is owner. |
| role           | number | Role ID the participant user was granted for this sketch.                |

### Possible Errors
| Error Code    | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| no_permission | User does not have permission to view participants of this sketch. |



## Grant Right
Grants a user a role on the sketch with the given id.

### Authentication
* User must be logged in.
* User must have at least owner role on this sketch.

### URL
`POST /unisketch4/api/right`

### Required Body
| Name          | Type   | Description                                   |
| ------------- | ------ | --------------------------------------------- |
| sketch_id     | number | ID of the sketch to grant a role for.         |
| email_address | string | Email address of the user to grant a role to. |
| role_id       | number | Role ID to grant to the user for this sketch. |

### Possible Errors
| Error Code        | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| no_permission     | User does not have permission to invite participants to this sketch. |
| user_not_found    | User with that email address could not be found.                     |
| sketch_not_found  | Sketch with that id could not be found.                              |
| cannot_grant_self | You cannot change your own role.                                     |



## Revoke Right
Revokes a right from a user to a given sketch.
When a user revokes their own rights and is an owner, this will only be successful if there is at least one other owner left. If there are other owners, this can be used to remove a sketch from one's library.

### Authentication
* User must be logged in.
* User must have at least owner role on this sketch.

### URL
`POST /unisketch4/api/right/delete`

### Required Body
| Name          | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| sketch_id     | number | ID of the sketch to revoke a role for. |
| user_id       | number | ID of the user to revoke a role from.  |

### Possible Errors
| Error Code        | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| no_permission     | User does not have permission to manage participants to this sketch. |
| user_not_found    | User with that ID could not be found.                                |
| last_owner_left   | There must always be at least one owner left.                        |