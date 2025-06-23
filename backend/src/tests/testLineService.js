require("dotenv").config();
const lineService = require("../services/line");
const logger = require("../utils/logger");

async function testAddFullLine() {
  try {
    logger.info("Starting line service test");

    const testLineData = {
      name: "Test Metro Line",
      lineTypeId: 1,

      route: {
        isCircular: false,
        isNight: false,
      },

      fullRoutes: [
        {
          fullRoute: [
            {
              stopId: 1,
              stopType: {
                isFirst: true,
                isLast: false,
                isOptional: false,
              },
              travelTime: 0,
              isOnRequest: false,
              stopNumber: 1,
            },
            {
              stopId: 2,
              stopType: {
                isFirst: false,
                isLast: false,
                isOptional: false,
              },
              travelTime: 180,
              isOnRequest: false,
              stopNumber: 2,
            },
            {
              stopId: 3,
              stopType: {
                isFirst: false,
                isLast: true,
                isOptional: false,
              },
              travelTime: 240,
              isOnRequest: false,
              stopNumber: 3,
            },
          ],

          departureRoutes: [
            {
              signature: "TEST-OUT",
              color: "#FF0000",
            },
          ],

          additionalStops: [{ stopNumber: 2 }],

          departures: [
            { departureTime: "08:00:00" },
            { departureTime: "08:30:00" },
            { departureTime: "09:00:00" },
          ],
        },

        {
          fullRoute: [
            {
              stopId: 3,
              stopType: {
                isFirst: true,
                isLast: false,
                isOptional: false,
              },
              travelTime: 0,
              isOnRequest: false,
              stopNumber: 1,
            },
            {
              stopId: 2,
              stopType: {
                isFirst: false,
                isLast: false,
                isOptional: false,
              },
              travelTime: 200,
              isOnRequest: false,
              stopNumber: 2,
            },
            {
              stopId: 1,
              stopType: {
                isFirst: false,
                isLast: true,
                isOptional: false,
              },
              travelTime: 190,
              isOnRequest: false,
              stopNumber: 3,
            },
          ],

          departureRoutes: [
            {
              signature: "TEST-IN",
              color: "#0000FF",
            },
          ],

          additionalStops: [{ stopNumber: 2 }],

          departures: [
            { departureTime: "08:15:00" },
            { departureTime: "08:45:00" },
            { departureTime: "09:15:00" },
          ],
        },
      ],
    };

    logger.info("Calling addFullLine...");
    const result = await lineService.addFullLine(testLineData);

    logger.info("Line created successfully:", {
      lineId: result.line.id,
      routeId: result.route.id,
    });

    logger.info("Results structure:", JSON.stringify(result, null, 2));

    if (!result.results || !result.results.length) {
      logger.info("No routes were processed");
    } else {
      logger.info("Number of full routes processed:", result.results.length);

      result.results.forEach((routeResult, index) => {
        logger.info(`Route ${index + 1} details:`, {
          fullRoute: routeResult.fullRoute
            ? routeResult.fullRoute.length
            : "missing",
          departureRoutes: routeResult.departureRoutes
            ? routeResult.departureRoutes.length
            : "missing",
          additionalStops: routeResult.additionalStops
            ? routeResult.additionalStops.length
            : "missing",
          departures: routeResult.departures
            ? routeResult.departures.length
            : "missing",
        });
      });
    }

    logger.info("Test completed successfully");
    return result;
  } catch (error) {
    logger.error("Test failed:", error);
    throw error;
  }
}

(async () => {
  try {
    const result = await testAddFullLine();
    console.log(
      "Test completed successfully:",
      JSON.stringify(result, null, 2)
    );
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit();
  }
})();
