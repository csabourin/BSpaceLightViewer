# Open Content Viewer

Open Content Viewer is a Node.js Express application for uploading, viewing, and managing Brightspace content packages in zip format.

## Author

Christian Sabourin

## Installation

1. Clone the repository
2. Navigate to the project directory and run `npm install`

## Running the Application

In the root directory of the project, use the following command to start the application:

```bash
node server.js
```

or if you're using nodemon:

```bash
nodemon server.js
```

By default, the application runs on port 3000. You can access it at http://localhost:3000.

## Usage

- Open Content Viewer provides a simple web interface for viewing Brightspace package content.
- Navigate to `/` to see a list of uploaded packages.
- Navigate to `/adminconsole` to upload new packages and rename existing ones.

## Features

- File upload: Accepts .zip files up to 60MB in size.
- Uploaded packages are stored in the `./packages` directory.
- Packages are unzipped and their contents are read and displayed.
- Rate limiting is implemented to restrict each IP to 1000 requests every 15 minutes.
- File management: Provides an option to rename the files.
- Rate limiting: To prevent abuse, the number of requests is limited.
- Content viewing: Unzips the packages and provides an interface to view their content.

## Environment Variables

You can set the following environment variables:

- `SECRET`: The secret used by express-session for signing the session ID cookie.
- `PORT`: The port on which the application runs.

## Dependencies

- [Express](https://expressjs.com/) - Web framework for Node.js.
- [express-session](https://www.npmjs.com/package/express-session) - Simple session middleware for Express.
- [fs-extra](https://www.npmjs.com/package/fs-extra) - Module that extends the Node.js file system module with extra methods.
- [uuid](https://www.npmjs.com/package/uuid) - For the creation of RFC4122 UUIDs.
- [xml2js](https://www.npmjs.com/package/xml2js) - For parsing XML to JavaScript objects.
- [ejs](https://www.npmjs.com/package/ejs) - Templating engine.
- [Adm-Zip](https://www.npmjs.com/package/adm-zip) - ZIP archive utility.
- [multer](https://www.npmjs.com/package/multer) - Middleware for handling `multipart/form-data`, which is primarily used for uploading files.
- [mime-types](https://www.npmjs.com/package/mime-types) - Provides the ability to derive a MIME type from a filename or from a file's content.
- [body-parser](https://www.npmjs.com/package/body-parser) - Body parsing middleware.
- [sanitize-filename](https://www.npmjs.com/package/sanitize-filename) - Sanitize string for use as a filename.
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Middleware for rate limiting requests.

## License

Open Content Viewer is licensed under the Creative Commons Attribution (CC-BY) license.
