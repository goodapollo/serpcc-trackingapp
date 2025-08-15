sap.ui.define([], function () {
    "use strict";
    return {
        getTheme: function () {
            return localStorage.getItem("theme");
        },

        setTheme: function (sTheme) {
            if (sTheme) {
                sap.ui.getCore().applyTheme(sTheme);
                localStorage.setItem("theme", sTheme)
            }
        },

        initTheme: function () {
        }
    };
});