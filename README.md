# L³ Swagger converter

Convert a [Swagger/OpenAPI schema](https://swagger.io/docs/specification/basic-structure) to a new [L³](https://github.com/lambda-lambda-lambda) application. :warning: Work In Progress :warning:

## How it works

This command-line script parses the supported schema definitions (e.g [API General Info](https://swagger.io/docs/specification/api-general-info), [Paths and Operations](https://swagger.io/docs/specification/paths-and-operations)) and scaffolds a new L³ application with predefined [route](https://github.com/lambda-lambda-lambda/manual/blob/master/ComplexRouting.md#route-handler)/[resource](https://github.com/lambda-lambda-lambda/manual/blob/master/ComplexRouting.md#resource-handler) handlers.

For example, the JSON schema definition below, when parsed..

```javascript
"/example/{resourceId}": {
  "put": {
    "description": "Example using `Route.create` handler alias.",
    "parameters": [
      {
        "in": "path",
        "name": "resourceId",
        "schema": {
          "type": "string"
        }
      }
    ],
    "responses": {
      "201": {
        "description": "Returns JSON response.",
        "headers": {
          "Content-Type": {
            "schema": {
              "type": "string",
              "example": "application/json"
            }
          }
        }
      }
    }
  }
}
```

would create a file in path `<AppName>/routes/Example.js` with the following:

```javascript
module.exports = {
  resource: ['create'],

  /**
   * @openapi
   *
   * /example/{resourceId}:
   *   get:
   *     description: Example using `Route.index` handler alias.
   *     responses:
   *       201:
   *         description: Returns JSON response.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 name:
   *                   type: string
   *         headers:
   *           Content-Type:
   *             schema:
   *               type: string
   *               example: application/json
   */
  index (req, res) {
    res.status(200).send(req.param());
  }
}
```

## Dependencies

- [Node.js](https://nodejs.org)

## Developers

### CLI options

Compile JavaScript sources from [TypeScript](https://www.typescriptlang.org) to a distribution:

    $ npm run compile

Compile and listen for changes (development mode):

    $ npm run watch

Run [ESLint](https://eslint.org/) on project sources:

    $ npm run lint

Run [Mocha](https://mochajs.org) integration tests:

    $ npm run test

## Author

[Marc S. Brooks](https://github.com/nuxy)
