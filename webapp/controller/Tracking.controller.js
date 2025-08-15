sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/UIComponent",
    "sap/f/library"
], function (Controller, Filter, FilterOperator, UIComponent, fioriLibrary) {
    "use strict";
    
    return Controller.extend("trackingapp.controller.Tracking", {
        
        onInit() { 
			var oRouter = UIComponent.getRouterFor(this);           
            var sDelivery = jQuery.sap.getUriParameters().get("delivery");
            var sSource = jQuery.sap.getUriParameters().get("source");
            var sPadDeliv = this.addLeadingZeros(sDelivery, 10);
			var oFilter = new Filter("delivery", FilterOperator.EQ, sPadDeliv);
            var oTable = this.getView().byId("HandlingUnits");
            var oTemplate = new sap.m.ColumnListItem(
                {cells: [ 
                        new sap.m.Text({text : "{handlingunit}"}),
                        new sap.m.Text({text : "{carrier}"}),
                        new sap.m.Text({text : "{service}"}),
                        new sap.m.Text({text : "{tracknum}"}),
                        new sap.m.Text({text : "{shipdate}"})
                        ],
                 type: "Navigation"
                }); 

            oTable.bindItems({path: "/Header('"+ sSource +"')/Set",
                filters: oFilter,
                template: oTemplate
            });

			oRouter.getRoute("details").attachPatternMatched(this.onPatternMatched, this);
			oRouter.getRoute("detailsNoList").attachPatternMatched(this.onPatternMatched, this);

        },
        addLeadingZeros(number, targetLength) {
            return String(number).padStart(targetLength, '0');
        },
		onPatternMatched : function (oEvent) {
			var sPath = oEvent.getParameter("arguments").key,
				oTable = this.byId("HandlingUnits"),
				oSelectedItem = oTable.getItems().find(function (oItem) {
					return oItem.getBindingContext().getPath() === sPath;
				});

			if (oSelectedItem) {
				oTable.setSelectedItem(oSelectedItem);
			}
		},
        onSelectionChange : function (oEvent) {
			var oContext = oEvent.getParameters().listItem.getBindingContext(),
				sPath = oContext.getPath(),
				sKey = sPath.slice(sPath.lastIndexOf("("));
                
			UIComponent.getRouterFor(this).navTo("details", { key: sKey });
		}
        
    });
});