sap.ui.define([
	"sap/ui/core/UIComponent",
  "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, BaseController, JSONModel) {
  "use strict"; 

  return BaseController.extend("trackingapp.controller.App", {
      onInit() {

        var oUIModel,
          oComponent = this.getOwnerComponent(),
          that = this;
  
        this.oUIModel = oUIModel = new JSONModel({
          sError : "",
          iMessages : 0,
          oProductsTable : null,
          bShowList : true,
          sShowListIcon : "sap-icon://close-command-field",
          sShowListTooltip : "Hide HU"
        });
        oComponent.setModel(this.oUIModel, "ui");
  
      }
  });
});