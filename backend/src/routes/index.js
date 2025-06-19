const express = require("express");
const linesRouter = require("./lines");
const stopsRouter = require("./stops");
const authRouter = require("./auth");
const lineTypesRouter = require("./line_types");

module.exports = {
  auth: authRouter,
  lines: linesRouter,
  stops: stopsRouter,
  lineTypes: lineTypesRouter,
};
