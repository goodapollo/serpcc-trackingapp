sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, Controller, DateFormat, JSONModel) {
	"use strict";
	return Controller.extend("trackingapp.controller.Details", {
		
		onInit() {
			var oRouter = UIComponent.getRouterFor(this);

			oRouter.getRoute("details").attachPatternMatched(this.onPatternMatched, this);
			oRouter.getRoute("detailsNoList").attachPatternMatched(this.onPatternMatched, this);
			this.oActiveContext = null;

		},
		onPatternMatched: function (oEvent) {

			var sSource = jQuery.sap.getUriParameters().get("source");

			var //oContext,
				sPath = "/Header('" + sSource + "')/Set" + oEvent.getParameter("arguments").key,
				oView = this.getView();

			// oView.bindElement({
			//     path: sPath
			// });

			// oContext = oView.getBindingContext();

			// oContext = oView.getModel().getKeepAliveContext(sPath, false,
			// 	{$$patchWithoutSideEffects : true});

			// oView.setBindingContext(oContext);

			// this.setShowList(!oEvent.getParameter("config").pattern.endsWith("?noList"));

			// var oModel = this.getView().getModel();
			// this._initGeoMap(oBindingContext,sPath,oView);

			var oContextBinding = oView.getModel().bindContext(sPath, null, {
				$expand: "_details",
				$$patchWithoutSideEffects: true
			});

			this.setShowList(!oEvent.getParameter("config").pattern.endsWith("?noList"));

			this._initGeoMap(oContextBinding, oView);
			// var oTimeline = oView.byId("trackHistory"); 
			// oTimeline.setGrowingThreshold("0");
		},

		getKeyPredicate: function (oContext) {
			var sPath = oContext.getPath();

			return sPath.slice(sPath.indexOf("(", sPath.lastIndexOf("/")));
		},

		navTo: function (oContext, bShowList) {
			if (bShowList === undefined) {
				bShowList = this.getView().getModel("ui").getProperty("/bShowList");
			}

			UIComponent.getRouterFor(this)
				.navTo(bShowList ? "details" : "detailsNoList",
					{ key: this.getKeyPredicate(oContext) }, true);
		},

		onShowList: function () {
			this.navTo(this.getView().getBindingContext(),
				!this.getView().getModel("ui").getProperty("/bShowList"));
		},

		setShowList: function (bShowList) {
			var oModel = this.getView().getModel("ui");

			oModel.setProperty("/bShowList", bShowList);
			oModel.setProperty("/sShowListIcon",
				bShowList ? "sap-icon://close-command-field" : "sap-icon://open-command-field");
			oModel.setProperty("/sShowListTooltip", bShowList ? "Hide HU" : "Show HU");
		},
		formatDateTime: function (dateTime) {
			var dt = DateFormat.getDateTimeInstance({ pattern: "EEEE, MM/dd/yyyy 'at' HH:mm:ss" });
			var jsDateObject = dt.parse(dateTime);
			return dt.format(jsDateObject)
		},
		_initGeoMap: function (oContextBinding, oView) {

			var oGeoMap = this.getView().byId("GeoMap");
			oGeoMap.setBusy(true);

			const mapWidth = "800";
			const mapHeight = parseInt(oGeoMap.getHeight());

			var oModel = this.getView().getModel();
			var oController = this;
			var sDataKey;
			var iIndex = 0;
			var oSeen = {};
			var aCityRegion = [];
			var aDetails = [[]];
			var aGeo = { Spots: aCityRegion };

			var aCoordPromises = []; // Store promises here

			// var oContext = oView.getModel().bindContext(sPath,null,{
			//     $expand : "_details",
			//     $$patchWithoutSideEffects: true
			// }
			// );

			oContextBinding.requestObject().then(function (oData) {
				aDetails = oData._details;

				var oTimelineModel = new sap.ui.model.json.JSONModel(aDetails);

				if (aDetails.length > 0) {
					oView.getModel("ui").setProperty("/latestStatus", aDetails[0]);
				}

				aDetails.slice().reverse().forEach(function (oItem) {
					var sCity = oItem.city ? oItem.city.trim() : "";
					var sRegion = oItem.region ? oItem.region.trim() : "";
					var sCtry = oItem.country ? oItem.country.trim() : "";
					var sZip = oItem.postalcode ? oItem.postalcode.trim() : "";

					// Skip if either city or region is empty
					if (!sCity || !sRegion) { return; }

					// Normalize to lowercase for deduplication
					sDataKey = sCity.toLowerCase() + "|" + sRegion.toLowerCase();

					if (!oSeen[sDataKey]) {
						oSeen[sDataKey] = true;
						iIndex++;
						var p = oController._get_coordinates(sCity, sRegion, sCtry, sZip, iIndex).then((oCoords) => {
							if (oCoords && oCoords.lat && oCoords.lon) {
								aCityRegion.push({
									city: sCity,
									region: sRegion,
									lon: oCoords.lon,
									lat: oCoords.lat,
									pos: oCoords.pos,
									type: "Default",
									text: oCoords.seq,
									tooltip: sCity + ", " + sRegion,
									icon: "shipping-status"
								});
							}
						});
						aCoordPromises.push(p);
					}
				});


				var oMapConfig = {
					"MapProvider": [{
						"name": "OSM",
						"type": "XYZ",
						"description": "",
						"tileX": "256",
						"tileY": "256",
						"minLOD": "3",
						"maxLOD": "18",
						"copyright": "Tiles Courtesy of OpenStreetMap",
						"Source": [{
							"id": "s1",
							"url": "https://a.tile.openstreetmap.org/{LOD}/{X}/{Y}.png"
						}]
					}],
					"MapLayerStacks": [{
						"name": "DEFAULT",
						"MapLayer": [{
							"name": "DEFAULT",
							"refMapProvider": "OSM",
							"opacity": "1.0",
							"colBkgnd": "RGB(255,255,255)"
						}]
					}]
				};

				oGeoMap.setMapConfiguration(oMapConfig);
				oGeoMap.setRefMapLayerStack("DEFAULT");

				// Wait until all coordinates are fetched
				Promise.all(aCoordPromises).then(function () {
					aCityRegion.sort(function (a, b) {
						return a.text - b.text;
					});
					var aRoutes = [];

					for (var i = 0; i < aCityRegion.length - 1; i++) {
						var from = aCityRegion[i];
						var to = aCityRegion[i + 1];

						aRoutes.push({
							pos: from.pos + ";" + to.pos
						});
					}
					aGeo = {
						Spots: aCityRegion,
						Routes: aRoutes
					};

					var oGeoModel = new sap.ui.model.json.JSONModel(aGeo);

					var aData = oGeoModel.getProperty("/Spots")
					aData[0].type = "Success";
					aData[0].icon = "factory";
					aData[aData.length - 1].type = "Error";
					aData[aData.length - 1].icon = "factory";
					oGeoModel.setProperty("/Spots", aData);

					oController.getView().setModel(oGeoModel, "geo");
					oGeoMap.getBinding("Spots")?.refresh(true);
					oGeoMap.getBinding("Routes")?.refresh(true);

					var aLongitudes = [];
					var aLatitudes = [];

					aData.forEach(spot => {
						if (spot.lon && spot.lat) {
							aLongitudes.push(spot.lon);
							aLatitudes.push(spot.lat);
						}
					});

					if (aLongitudes.length && aLatitudes.length) {
						oGeoMap.zoomToGeoPosition(aLongitudes, aLatitudes, 0);
					}

					oGeoMap.setBusy(false);

					oController.getView().setModel(oTimelineModel, "timeline"); //need to delay this until after the geomap is rendered, else the timeline growing will not work

					var oContext = oContextBinding.getBoundContext();
					oView.setBindingContext(oContext);
				});

			});


		},		
		onClickSpot: function (evt) {
			evt.getSource().openDetailWindow("My Detail Window", "0", "0");
		},
		onContextMenuSpot: function (evt) {
		},
		_get_coordinates: (city, region, country, zipcode, index) => {
			const fetchCoordinates = (url, label) => {
				return new Promise((resolve, reject) => {
					const oModel = new sap.ui.model.json.JSONModel();
					let failed = false;

					const onCompleted = function () {
						oModel.detachRequestCompleted(onCompleted);
						oModel.detachRequestFailed(onFailed);

						if (failed) {
							reject(`Request failed: ${label}`);
							return;
						}

						const aResults = oModel.getData();
						if (Array.isArray(aResults) && aResults.length > 0) {
							const oFirstResult = aResults[0];
							console.log(`Success: ${label}`);
							resolve({
								lat: oFirstResult.lat,
								lon: oFirstResult.lon,
								pos: oFirstResult.lon + ";" + oFirstResult.lat + ";0",
								seq: index
							});
						} else {
							resolve(null);
						}
					};

					const onFailed = function () {
						failed = true;
					};

					oModel.attachRequestCompleted(onCompleted);
					oModel.attachRequestFailed(onFailed);
					oModel.loadData(url);
				});
			};

			// Step 1: city + region
			const firstUrl = `https://nominatim.openstreetmap.org/search.php?city=${encodeURIComponent(city)}&state=${encodeURIComponent(region)}&format=jsonv2`;

			// Step 2: fallback to q= query string
			const qString = `${city}, ${region}, ${country} ${zipcode}`;
			const fallbackUrl = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(qString)}&format=jsonv2`;

			return fetchCoordinates(firstUrl, "city + region")
				.then(result => {
					if (result) return result;
					return fetchCoordinates(fallbackUrl, "q=city,region,country+zipcode");
				})
				.catch(error => {
					console.error("All lookups failed:", error);
					return null;
				});
		},
		formatCarrierLogo: function (sCarrier) {
			if (!sCarrier) return "";

			const sLowerCarrier = sCarrier.toLowerCase();

			switch (true) {
				case sLowerCarrier.includes("fedex"):
					return sap.ui.require.toUrl("trackingapp/images/FedEx.png");
				case sLowerCarrier.includes("ups"):
					return sap.ui.require.toUrl("trackingapp/images/UPS.png");
				case sLowerCarrier.includes("dhl"):
					return sap.ui.require.toUrl("trackingapp/images/DHL.png");
				default:
					return sap.ui.require.toUrl("trackingapp/images/default.png");
			}
		},
		formatStatusIcon: function (sStatusDesc) {
			if (!sStatusDesc) return "";

			const lowerStatus = sStatusDesc.toLowerCase();

			switch (true) {
				case lowerStatus.includes("delivered"):
					return "sap-icon://sys-enter-2";
				case lowerStatus.includes("delay") || lowerStatus.includes("late"):
					return "sap-icon://alert";
				case lowerStatus.includes("exception"):
					return "sap-icon://error";
				default:
					return "";
			}

		},

		formatStatusState: function (sStatusDesc) {
			if (!sStatusDesc) return "None";

			const lowerStatus = sStatusDesc.toLowerCase();

			switch (true) {
				case lowerStatus.includes("delivered"):
					return "Success";
				case lowerStatus.includes("delay") || lowerStatus.includes("late"):
					return "Warning";
				case lowerStatus.includes("exception"):
					return "Error";
				default:
					return "None";
			}

		},
		


	});
});