require("dotenv").config(); // Load environment variables
const lineService = require("../services/line");
const logger = require("../utils/logger");

async function testAddFullLine() {
  try {
    logger.info("Starting line service test");

    // Sample test data
    const testLineData = {
      name: "Test Metro Line",
      lineTypeId: 1, // Make sure this ID exists in your line_type table

      route: {
        isCircular: false,
        isNight: false,
      },

      fullRoutes: [
        {
          // First full route (outbound direction)
          fullRoute: [
            {
              stopId: 1, // Make sure these IDs exist in your stops table
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
          // Second full route (inbound direction)
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

    // Call the service function
    logger.info("Calling addFullLine...");
    const result = await lineService.addFullLine(testLineData);

    // Log the result with better error handling
    logger.info("Line created successfully:", {
      lineId: result.line.id,
      routeId: result.route.id,
    });

    // Add more debugging to see what's in the results
    logger.info("Results structure:", JSON.stringify(result, null, 2));

    // Better error handling when logging route details
    if (!result.results || !result.results.length) {
      logger.info("No routes were processed");
    } else {
      logger.info("Number of full routes processed:", result.results.length);

      // Process each route result with error checking
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

// Execute the test
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
    // Close any open connections
    process.exit();
  }
})();
