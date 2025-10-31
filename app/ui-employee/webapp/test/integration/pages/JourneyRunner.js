sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"uiemployee/test/integration/pages/EmployeeSetList",
	"uiemployee/test/integration/pages/EmployeeSetObjectPage"
], function (JourneyRunner, EmployeeSetList, EmployeeSetObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('uiemployee') + '/test/flp.html#app-preview',
        pages: {
			onTheEmployeeSetList: EmployeeSetList,
			onTheEmployeeSetObjectPage: EmployeeSetObjectPage
        },
        async: true
    });

    return runner;
});

