const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GKM Admin API",
      version: "2.0.0",
      description: "API documentation for GKM Admin 2.0",
      license: {
        name: "Private",
        url: "https://yourcompany.com",
      },
      contact: {
        name: "API Support",
        url: "https://yourcompany.com/support",
        email: "support@yourcompany.com",
      },
    },
    servers: [
      {
        url: "/",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Path to the API routes files
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "GKM Admin 2.0 API Documentation",
  }),
  specs,
};
