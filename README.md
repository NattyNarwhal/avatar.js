## About

This (should) be a Gravatar compatible API. It is written in JavaScript.

## Dependencies

npm:
* express
* gm
* body-parser
* redis
* bcrypt
* multer

other:
* redis

## API endpoints

The accountless API is the same as [Gravatar's](https://en.gravatar.com/site/implement), except without profiles. On the account API, there are the following methods:

### * `/api/register`

POST, URL encoded. Takes email and password.

### `/api/delete`

POST, URL encoded. Takes email and password.

### `/api/upload`

POST, multipart. Takes email and password, as well as image as a JPEG file.

## TODO

* support other than JPG files (bug in `gm`? even with inference of filetype it still won't go)

* validate email
