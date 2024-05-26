import moment from 'moment';

const DEMO_DATES = [
  moment().subtract(3, 'days').format('YYYY-MM-DD'),
  moment().format('YYYY-MM-DD'),
  moment().add(3, 'days').format('YYYY-MM-DD')
];

export const TENANT_ENTITY = {
  "entityType": "TENANT",
  "entityTypeId": "TENANT#CHALLENGEAPP",
  "config": {
    "areas": {
      "allAreasLabel": "All Streets",
      "breadCrumbLabel": "Street",
      "expandableLocations": [
        "town"
      ],
      "locationTypeConfig": "details"
    },
    "defaultHourlyDailyDataThreshold": "72",
    "details": {
      "breadCrumbLabel": "",
      "chartLineType": "linear",
      "childPath": "/details",
      "detailsView": "measureimage",
      "enableColourPalette": true,
      "icon": "area-breadcrumb-icon.svg",
      "isAreaContainer": true,
      "label": "Street",
      "rangeLabel": "Streets",
      "resPerPage": 50,
      "rollingTrendlinePeriod": true,
      "searchResultLabel": "Street",
      "showAlertDuration": true,
      "showLatestAlertOnly": true,
      "tileBackground": "area-icon.svg",
      "trendlinePeriod": "72"
    },
    "enableHeatmap": true,
    "header": {
      "areas": {
        "activeIcon": "area-header-active-icon.svg",
        "defaultIcon": "area-header-icon.svg",
        "label": "Street View"
      },
      "installation": {
        "activeIcon": "location-header-active-icon.svg",
        "defaultIcon": "location-header-icon.svg",
        "label": "Town View"
      }
    },
    "locations": {
      "details": {
        "rangeLabel": "",
        "searchResultLabel": "Street"
      },
      "neighbourhood": {
        "allAreasLabel": "",
        "breadCrumbLabel": "{name}",
        "icon": "location-breadcrumb-icon.svg",
        "isAreaContainer": true,
        "label": "Neighbourhood",
        "rangeLabel": "Streets",
        "resPerPage": 50,
        "searchResultLabel": "",
        "tileBackground": "location-icon.svg",
      },
      "root_location": {
        "searchResultLabel": ""
      },
      "town": {
        "allAreasLabel": "",
        "breadCrumbLabel": "{name}",
        "icon": "location-breadcrumb-icon.svg",
        "isAreaContainer": false,
        "label": "Town",
        "rangeLabel": "Towns",
        "resPerPage": 24,
        "searchResultLabel": "",
        "tileBackground": "location-icon.svg",
      },
      "top_nav_location": {
        "searchResultLabel": "",
      }
    },
    "measurements": {
      "SUPPLY": {
        "buttonIcon": "supply-measurement",
        "defaultExpanded": false,
        "description": "The percentage of electricity supply available for charging in an area.",
        "displayOnView": "both",
        "enabled": true,
        "impact": "",
        "label": "Supply",
        "order": 1,
        "showTooltip": true
      },
      "DEMAND": {
        "buttonIcon": "demand-measurement",
        "defaultExpanded": false,
        "description": "The percentage of electricity required for charging in an area.",
        "displayOnView": "both",
        "enabled": true,
        "impact": "",
        "label": "Demand",
        "order": 2,
        "showTooltip": true
      }
    },
    "resources": "devto",
    "useAreasView": true
  },
  "createdAt": "2023-01-12T17:32:49.48Z",
  "email": "tech@gardin.co.uk",
  "name": "ChargeNG",
  "tenantId": "CHALLENGEAPP"
};

export const LOCATION_ENTITIES = [
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "defaultLocation": true,
    "entityType": "LOCATION",
    "deletedAt": null,
    "entityTypeId": "LOCATION#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "gsi2Pk": "TYPE#ROOT_LOCATION",
    "locationHeaderKey": null,
    "name": "ChargeNG",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "timeZoneId": null
  },
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "defaultLocation": false,
    "entityType": "LOCATION",
    "deletedAt": null,
    "entityTypeId": "LOCATION#01HT2KHCEGY77YT43SW7TNQE8R",
    "gsi2Pk": "TYPE#TOP_NAV_LOCATION",
    "locationHeaderKey": null,
    "name": "United Kingdom",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R",
    "timeZoneId": null
  },
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "defaultLocation": false,
    "entityType": "LOCATION",
    "deletedAt": null,
    "entityTypeId": "LOCATION#01HYD4FY2RG53YAGJABYY5H1PN",
    "gsi2Pk": "TYPE#TOWN",
    "locationHeaderKey": null,
    "name": "Basingstoke",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN",
    "timeZoneId": ""
  },
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "defaultLocation": false,
    "entityType": "LOCATION",
    "deletedAt": null,
    "entityTypeId": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi2Pk": "TYPE#NEIGHBOURHOOD",
    "locationHeaderKey": null,
    "name": "South View",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31",
    "timeZoneId": ""
  },
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "defaultLocation": false,
    "entityType": "LOCATION",
    "deletedAt": null,
    "entityTypeId": "LOCATION#01HYEEVJMRK4SM9X492BBTNAPS",
    "gsi2Pk": "TYPE#NEIGHBOURHOOD",
    "locationHeaderKey": null,
    "name": "South Ham",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01HYEEVJMRK4SM9X492BBTNAPS",
    "timeZoneId": ""
  }
];

export const AREA_ENTITIES = [
  {
    "createdAt": "2023-03-28T16:18:08.150Z",
    "deletedAt": null,
    "entityType": "AREA",
    "entityTypeId": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "name": "Pemerton Road",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
  },
  {
    "createdAt": "2023-03-28T16:18:08.150Z",
    "deletedAt": null,
    "entityType": "AREA",
    "entityTypeId": "AREA#01HYTKED4KPN8Z5PT98ZKJC0ZR",
    "name": "Western Way",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01HYEEVJMRK4SM9X492BBTNAPS#01HYTKED4KPN8Z5PT98ZKJC0ZR"
  }

];

export const SCHEDULE_ENTITIES = [
  {
    "cycleCompletedAt": null,
    "createdAt": "2023-03-29T08:31:17.844Z",
    "cycleCompletingAt": DEMO_DATES[2] + "T23:59:59.000Z",
    "cycleStartedAt": DEMO_DATES[0] + "T00:00:00.000Z",
    "deletedAt": null,
    "entityType": "SCHEDULE",
    "entityTypeId": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "name": "Monitoring Period One - Pemerton Road",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "provider": "Dev Community Amplify Challenge",
    "period": "Six Months"
  },
  {
    "cycleCompletedAt": null,
    "createdAt": "2023-03-29T08:31:17.844Z",
    "cycleCompletingAt": DEMO_DATES[2] + "T23:59:59.000Z",
    "cycleStartedAt": DEMO_DATES[0] + "T00:00:00.000Z",
    "deletedAt": null,
    "entityType": "SCHEDULE",
    "entityTypeId": "SCHEDULE#01HYTTJMVX73RW16XKS7MZZSQH",
    "gsi2Pk": "LOCATION#01HYEEVJMRK4SM9X492BBTNAPS",
    "gsi3Pk": "AREA#01HYTKED4KPN8Z5PT98ZKJC0ZR",
    "name": "Monitoring Period One - Western Way",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01HYEEVJMRK4SM9X492BBTNAPS#01HYTKED4KPN8Z5PT98ZKJC0ZR",
    "provider": "Dev Community Amplify Challenge",
    "period": "Six Months"
  }
];

export const MEASUREMENTS_ENTITIES = [
  {
    "createdAt": DEMO_DATES[0] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HKQBVV3F3JG8E3E38XZAPM5P",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "gsi5Pk": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[0] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 70,
    "measurementMap": "{\"10\":\"68\",\"11\":\"72\",\"12\":\"75\",\"13\":\"72\",\"14\":\"68\",\"15\":\"72\",\"16\":\"69\",\"17\":\"65\",\"07\":\"72\",\"08\":\"68\",\"09\":\"64\"}",
    "measurementLatest": 71
  },
  {
    "createdAt": DEMO_DATES[0] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HYD5C1GTV8B1HC0HW17ET3YG",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "gsi5Pk": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[0] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 60,
    "measurementMap": "{\"10\":\"48\",\"11\":\"52\",\"12\":\"55\",\"13\":\"52\",\"14\":\"48\",\"15\":\"52\",\"16\":\"49\",\"17\":\"45\",\"07\":\"52\",\"08\":\"48\",\"09\":\"44\"}",
    "measurementLatest": 60
  },
  {
    "createdAt": DEMO_DATES[1] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HKQBV7D7Q61R5B9705SY6035",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "gsi5Pk": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[1] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 70,
    "measurementMap": "{\"10\":\"68\",\"11\":\"72\",\"12\":\"75\",\"13\":\"72\",\"14\":\"68\",\"15\":\"72\",\"16\":\"69\",\"17\":\"65\",\"07\":\"72\",\"08\":\"68\",\"09\":\"64\"}",
    "measurementLatest": 71
  },
  {
    "createdAt": DEMO_DATES[1] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HYD5BD4WNJ41573XX2KDQM0X",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "gsi5Pk": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[1] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 60,
    "measurementMap": "{\"10\":\"48\",\"11\":\"52\",\"12\":\"55\",\"13\":\"52\",\"14\":\"48\",\"15\":\"52\",\"16\":\"49\",\"17\":\"45\",\"07\":\"52\",\"08\":\"48\",\"09\":\"44\"}",
    "measurementLatest": 60
  },
  {
    "createdAt": DEMO_DATES[2] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HKQBRJ963JBF0VGZ177W2AXR",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GC6NGSW1JPHXE8CW271R9TNA",
    "gsi5Pk": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[2] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 70,
    "measurementMap": "{\"10\":\"68\",\"11\":\"72\",\"12\":\"75\",\"13\":\"72\",\"14\":\"68\",\"15\":\"72\",\"16\":\"69\",\"17\":\"65\",\"07\":\"72\",\"08\":\"68\",\"09\":\"64\"}",
    "measurementLatest": 71
  },
  {
    "createdAt": DEMO_DATES[2] + "T00:58:00.00Z",
    "deletedAt": null,
    "entityType": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "entityTypeId": "MEASUREMENT#01HYD5B5HMDV6750GFQG2M5ETK",
    "gsi2Pk": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi3Pk": "SCHEDULE#01GC6NGSW1JPHXE8CW271R9TNA",
    "gsi5Pk": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "gsi5Sk": DEMO_DATES[2] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "measurementAvg": 60,
    "measurementMap": "{\"10\":\"48\",\"11\":\"52\",\"12\":\"55\",\"13\":\"52\",\"14\":\"48\",\"15\":\"52\",\"16\":\"49\",\"17\":\"45\",\"07\":\"52\",\"08\":\"48\",\"09\":\"44\"}",
    "measurementLatest": 60
  }
];

export const ZONE_ENTITIES = [
  {
    "createdAt": "2022-09-01T18:59:50.29Z",
    "entityType": "ZONE",
    "entityTypeId": "ZONE#01GBX8TS89KSV3J42PKEZZHFY3",
    "deletedAt": null,
    "name": "Default",
    "path": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "zoneDimensions": [
      0,
      0
    ]
  }
];