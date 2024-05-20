import moment from 'moment';

const DEMO_DATES = [
  moment().subtract(1, 'days').format('YYYY-MM-DD'),
  moment().format('YYYY-MM-DD'),
  moment().add(1, 'days').format('YYYY-MM-DD')
];

export const TENANT_ENTITY = {
  "ENTITY_TYPE": "TENANT",
  "ENTITY_TYPE_ID": "TENANT#GTDEMOAPP",
  "CONFIG": {
    "alerts": {
      "alertImages": {
        "desktop": [
          "desktop-alert-location-icon.svg",
          "desktop-alert-sublocation-icon.svg",
          "desktop-alert-tray-icon.svg"
        ],
        "mobile": [
          "location-footer-active-icon.svg",
          "mobile-alert-sublocation-icon.svg",
          "tray-footer-active-icon.svg"
        ]
      },
      "alertsViewStates": [
        "active"
      ],
      "alertTypes": {
        "fv_fm": "Damaging",
        "qe": "Yield Impact",
        "qp": "Yield Impact"
      },
      "enableCTALeftAlertDismissal": false,
      "enableCTARightAlertDismissal": true,
      "locations": {
        "locationTwo": "area",
        "locationOne": "areaContainer"
      },
      "sort": [
        "severity",
        "duration"
      ],
      "sortOptions": {
        "duration": {
          "startOrder": "asc"
        },
        "severity": {
          "startOrder": "desc"
        }
      }
    },
    "contentWellImage": "contentwell-icon.svg",
    "areas": {
      "allAreasLabel": "All Areas",
      "breadCrumbLabel": "Areas",
      "expandableLocations": [
        "tent_wo_rack"
      ],
      "locationTypeConfig": "details"
    },
    "defaultHourlyDailyDataThreshold": "72",
    "defaultMinutesHoursDataThreshold": "1",
    "defaultSensitivity": "2",
    "details": {
      "breadCrumbLabel": "",
      "chartLineType": "monotone",
      "childPath": "/details",
      "detailsView": "indeximage",
      "enableColourPalette": true,
      "icon": "tray-breadcrumb-icon.svg",
      "isAreaContainer": true,
      "isTopLevelLocation": false,
      "label": "Area",
      "rangeLabel": "Areas",
      "resPerPage": 50,
      "rollingTrendlinePeriod": true,
      "searchResultInfo": [
        "id",
        "tents"
      ],
      "searchResultLabel": "Area",
      "severityLabels": [
        {
          "label": "impacted",
          "severity": "HIGH"
        },
        {
          "label": "Probable impact on",
          "severity": "MEDIUM"
        },
        {
          "label": "Possible impact on",
          "severity": "LOW"
        }
      ],
      "showAlertDuration": true,
      "showGrowthCycle": false,
      "showLatestAlertOnly": true,
      "tileBackground": "tray-icon.svg",
      "trendlinePeriod": "1"
    },
    "enableGridListToggle": true,
    "enableHeatmap": true,
    "footer": {
      "areas": {
        "activeIcon": "tray-footer-active-icon.svg",
        "defaultIcon": "tray-footer-icon.svg",
        "label": "Area View"
      },
      "installation": {
        "activeIcon": "location-footer-active-icon.svg",
        "defaultIcon": "location-footer-icon.svg",
        "label": "Tent View"
      }
    },
    "header": {
      "areas": {
        "activeIcon": "tray-header-active-icon.svg",
        "defaultIcon": "tray-header-icon.svg",
        "label": "Area View"
      },
      "installation": {
        "activeIcon": "location-header-active-icon.svg",
        "defaultIcon": "location-header-icon.svg",
        "label": "Tent View"
      },
      "minHeight": "2.9rem",
      "visibleHeight": "3rem"
    },
    "installationRoot": "/site",
    "locations": {
      "details": {
        "rangeLabel": "",
        "searchResultLabel": "Area"
      },
      "tent_wo_rack": {
        "allAreasLabel": "",
        "breadCrumbLabel": "GreenTech",
        "icon": "sublocation-breadcrumb-icon-v2.svg",
        "isAreaContainer": true,
        "isTopLevelLocation": false,
        "label": "Tent",
        "rangeLabel": "Areas",
        "resPerPage": 50,
        "searchResultInfo": [
          "tenant",
          "site"
        ],
        "searchResultLabel": "",
        "showAggregation": false,
        "tileBackground": "sublocation-icon.svg",
        "typeLabel": "Tent w/o rack"
      },
      "root_location": {
        "searchResultLabel": ""
      },
      "site": {
        "allAreasLabel": "",
        "breadCrumbLabel": "{name}",
        "icon": "location-breadcrumb-icon.svg",
        "isAreaContainer": false,
        "isTopLevelLocation": true,
        "label": "Tent",
        "rangeLabel": "Tents",
        "resPerPage": 24,
        "searchResultInfo": [
          "tenant",
          "site"
        ],
        "searchResultLabel": "",
        "showAggregation": false,
        "tileBackground": "location-icon.svg",
        "typeLabel": "Site"
      },
      "top_nav_location": {
        "searchResultLabel": "",
        "typeLabel": "Top Nav Location"
      }
    },
    "measurements": {
      "QE": {
        "buttonIcon": "quantumefficiency-index",
        "defaultExpanded": false,
        "description": "The ratio of light photons converted for photosynthesis, impacted by light intensity and plant stress.",
        "displayOnView": "both",
        "enabled": true,
        "impact": "",
        "label": "Efficiency",
        "order": 2,
        "showTooltip": true
      }
    },
    "resources": "gardin",
    "search": {
      "alertImages": [],
      "areaContainerLabel": "Tent",
      "areaLabel": "Area",
      "locationImages": {
        "desktop": [
          "desktop-alert-location-icon.svg",
          "desktop-alert-tray-icon.svg"
        ],
        "mobile": [
          "location-footer-active-icon.svg",
          "tray-footer-active-icon.svg"
        ]
      },
      "locations": [
        "tent_wo_rack"
      ]
    },
    "sensors": {
      "searchResultInfo": [
        "tent_wo_rack"
      ],
      "searchResultLabel": "Sensor"
    },
    "tenantLogo": "triplet.svg",
    "useAreasView": true
  },
  "CREATED_AT": "2023-01-12T17:32:49.48Z",
  "EMAIL": "tech@gardin.co.uk",
  "NAME": "Amsterdam RAI",
  "TENANT_ID": "GTDEMOAPP",
  "LAT_LNG": "52.3411938_4.8860407"
};

export const LOCATION_ENTITIES = [
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": true,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "GSI2_PK": "TYPE#ROOT_LOCATION",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": null,
    "MAX_ROW": null,
    "NAME": "Gardin",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "TIMEZONE_ID": null,
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": true,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HT2KHCEGY77YT43SW7TNQE8R",
    "GSI2_PK": "TYPE#SITE",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 14,
    "NAME": "Amsterdam RAI",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R",
    "TIMEZONE_ID": null,
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI2_PK": "TYPE#TENT_WO_RACK",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "GreenTech Demo",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31",
    "TIMEZONE_ID": "Europe/Brussels",
    "TOTAL_CONTROL_AREAS": 1
  }
];

export const AREA_ENTITY = {
  "CA_DIMENSIONS": [
    0,
    0
  ],
  "CREATED_AT": "2023-03-28T16:18:08.150Z",
  "DELETED_AT": null,
  "ENTITY_TYPE": "AREA",
  "ENTITY_TYPE_ID": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
  "NAME": "Demo",
  "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
};

export const SUNRISE_SUNSET_ENTITIES = [
  {
    "CREATED_AT": DEMO_DATES[0] + "T12:00:48.304Z",
    "ENTITY_TYPE": "SUNRISESUNSET#GTDEMOAPP",
    "ENTITY_TYPE_ID": "SUNRISESUNSET#01HSXA4TNG9YW7B09HDPX331WH",
    "NAME": DEMO_DATES[0],
    "SUNRISE_SUNSET": "{\"SUNSET\":\"" +
      DEMO_DATES[0] +
      "T20:02:59.000Z\",\"DAY_LENGTH\":\"" +
      DEMO_DATES[0] + 
      "T16:42:47.000Z\",\"LAST_LIGHT\":null,\"GOLDEN_HOUR\":\"" + 
      DEMO_DATES[0] + 
      "T19:07:39.000Z\",\"FIRST_LIGHT\":null,\"SOLAR_NOON\":\"" + 
      DEMO_DATES[0] + 
      "T11:41:35.000Z\",\"SUNRISE\":\"" + 
      DEMO_DATES[0] + 
      "T03:20:11.000Z\",\"DUSK\":\"" + 
      DEMO_DATES[0] + 
      "T20:52:03.000Z\",\"DAWN\":\"" + 
      DEMO_DATES[0] + 
      "T02:31:07.000Z\"}"
  },
  {
    "CREATED_AT": DEMO_DATES[1] + "T12:00:48.304Z",
    "ENTITY_TYPE": "SUNRISESUNSET#GTDEMOAPP",
    "ENTITY_TYPE_ID": "SUNRISESUNSET#01HSXA4TNG9YW7B09HDPX331WI",
    "NAME": DEMO_DATES[1],
    "SUNRISE_SUNSET": "{\"SUNSET\":\"" +
      DEMO_DATES[1] +
      "T20:03:40.000Z\",\"DAY_LENGTH\":\"" +
      DEMO_DATES[1] + 
      "T16:43:45.000Z\",\"LAST_LIGHT\":null,\"GOLDEN_HOUR\":\"" + 
      DEMO_DATES[1] + 
      "T19:08:14.000Z\",\"FIRST_LIGHT\":null,\"SOLAR_NOON\":\"" + 
      DEMO_DATES[1] + 
      "T11:41:47.000Z\",\"SUNRISE\":\"" + 
      DEMO_DATES[1] + 
      "T03:19:54.000Z\",\"DUSK\":\"" + 
      DEMO_DATES[1] + 
      "T20:52:52.000Z\",\"DAWN\":\"" + 
      DEMO_DATES[1] + 
      "T02:30:42.000Z\"}"
  },
  {
    "CREATED_AT": DEMO_DATES[2] + "T12:00:48.304Z",
    "ENTITY_TYPE": "SUNRISESUNSET#GTDEMOAPP",
    "ENTITY_TYPE_ID": "SUNRISESUNSET#01HSXA4TNG9YW7B09HDPX331WJ",
    "NAME": DEMO_DATES[2],
    "SUNRISE_SUNSET": "{\"SUNSET\":\"" +
      DEMO_DATES[2] +
      "T20:04:18.000Z\",\"DAY_LENGTH\":\"" +
      DEMO_DATES[2] + 
      "T16:44:37.000Z\",\"LAST_LIGHT\":null,\"GOLDEN_HOUR\":\"" + 
      DEMO_DATES[2] + 
      "T19:08:47.000Z\",\"FIRST_LIGHT\":null,\"SOLAR_NOON\":\"" + 
      DEMO_DATES[2] + 
      "T11:41:59.000Z\",\"SUNRISE\":\"" + 
      DEMO_DATES[2] + 
      "T03:19:40.000Z\",\"DUSK\":\"" + 
      DEMO_DATES[2] + 
      "T20:53:37.000Z\",\"DAWN\":\"" + 
      DEMO_DATES[2] + 
      "T02:30:21.000Z\"}"
  }
];

export const GROWTHJOB_ENTITIES = [
  {
    "ALERT_SENSITIVITY": 2,
    "ALERT_TRIGGER_TIMEOFDAY": null,
    "CYCLE_COMPLETED_AT": null,
    "CREATED_AT": "2023-03-29T08:31:17.844Z",
    "CYCLE_COMPLETING_AT": DEMO_DATES[2] + "T23:59:59.000Z",
    "CYCLE_STARTED_AT": DEMO_DATES[0] + "T00:00:00.000Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "GROWTHJOB",
    "ENTITY_TYPE_ID": "GROWTHJOB#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "IS_INCOMPLETE": null,
    "NAME": "GreenTechDemoJob_GOOD",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31",
    "PHOTOPERIOD": "12",
    "RECIPE": "Gardin GreenTech Demo",
    "SIZE": null,
    "SPECIES": "Strawberry",
    "VALUE": null
  }
];

export const INDICES_ENTITIES = [
  {
    "CREATED_AT": DEMO_DATES[0] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "INDEXBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "INDEX#01HKQBVV3F3JG8E3E38XZAPM5P",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "GROWTHJOB#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "INDEXBYAREA#QE#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[0] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35,
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
  },
  {
    "CREATED_AT": DEMO_DATES[1] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "INDEXBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "INDEX#01HKQBV7D7Q61R5B9705SY6035",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "GROWTHJOB#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "INDEXBYAREA#QE#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[1] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35,
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
  },
  {
    "CREATED_AT": DEMO_DATES[2] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "INDEXBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "INDEX#01HKQBRJ963JBF0VGZ177W2AXR",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "GROWTHJOB#01GC6NGSW1JPHXE8CW271R9TNA",
    "GSI5_PK": "INDEXBYAREA#QE#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[2] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35,
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
  }
];

export const ZONE_ENTITIES = [
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "ENTITY_TYPE": "ZONE",
    "ENTITY_TYPE_ID": "ZONE#01GBX8TS89KSV3J42PKEZZHFY3",
    "DELETED_AT": null,
    "IS_DEFAULT": true,
    "NAME": "Default",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "ZONE_DIMENSIONS": [
      0,
      0
    ]
  }
];