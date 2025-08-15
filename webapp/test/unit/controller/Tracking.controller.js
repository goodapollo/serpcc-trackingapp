/*global QUnit*/

sap.ui.define([
	"trackingapp/controller/Tracking.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Tracking Controller");

	QUnit.test("I should test the Tracking controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
