sap.ui.define([
    "sap/ui/core/UIComponent",
    "trackingapp/model/models",
    "trackingapp/util/themeHelper",
    "sap/ui/core/Theming"
], (UIComponent, models, themeHelper, Theming) => {
    "use strict";

    sap.ui.getCore().attachThemeChanged(function(oEvent){
        var sTheme = sap.ushell.Container.getService("UserInfo").getUser().getTheme();
        if (oEvent.mParameters.theme != null){
            sTheme = oEvent.mParameters.theme;
        }
        themeHelper.setTheme(sTheme);
    });

    return UIComponent.extend("trackingapp.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
            
        }        
    });
});