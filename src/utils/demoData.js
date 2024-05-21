import moment from 'moment';

const DEMO_DATES = [
  moment().subtract(1, 'days').format('YYYY-MM-DD'),
  moment().format('YYYY-MM-DD'),
  moment().add(1, 'days').format('YYYY-MM-DD')
];

export const TENANT_ENTITY = {
  "ENTITY_TYPE": "TENANT",
  "ENTITY_TYPE_ID": "TENANT#CHALLENGEAPP",
  "CONFIG": {
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
      "detailsView": "indeximage",
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
      "trendlinePeriod": "1"
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
        "breadCrumbLabel": "Neighbourhoods",
        "icon": "sublocation-breadcrumb-icon-v2.svg",
        "isAreaContainer": true,
        "label": "Neighbourhood",
        "rangeLabel": "Streets",
        "resPerPage": 50,
        "searchResultLabel": "",
        "tileBackground": "sublocation-icon.svg",
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
  "CREATED_AT": "2023-01-12T17:32:49.48Z",
  "EMAIL": "tech@gardin.co.uk",
  "NAME": "ChargeNG",
  "TENANT_ID": "CHALLENGEAPP",
  "LAT_LNG": "0_0"
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
    "NAME": "ChargeNG",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT",
    "TIMEZONE_ID": null,
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HT2KHCEGY77YT43SW7TNQE8R",
    "GSI2_PK": "TYPE#TOP_NAV_LOCATION",
    "LOCATION_HEADER_KEY": null,
    "NAME": "United Kingdom",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R",
    "TIMEZONE_ID": null,
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HYD4FY2RG53YAGJABYY5H1PN",
    "GSI2_PK": "TYPE#TOWN",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "Basingstoke",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN",
    "TIMEZONE_ID": "",
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HYD4QZ6B0R5T14NWGTA611GT",
    "GSI2_PK": "TYPE#TOWN",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "Winchester",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4QZ6B0R5T14NWGTA611GT",
    "TIMEZONE_ID": "",
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HYD4RDJB0R4GN0D165XB77AN",
    "GSI2_PK": "TYPE#TOWN",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "Southampton",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4RDJB0R4GN0D165XB77AN",
    "TIMEZONE_ID": "",
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI2_PK": "TYPE#NEIGHBOURHOOD",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "South View",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31",
    "TIMEZONE_ID": "Europe/London",
    "TOTAL_CONTROL_AREAS": 1
  },
  {
    "CREATED_AT": "2022-09-01T18:59:50.29Z",
    "DEFAULT_LOCATION": false,
    "ENTITY_TYPE": "LOCATION",
    "DELETED_AT": null,
    "ENTITY_TYPE_ID": "LOCATION#01HYEEVJMRK4SM9X492BBTNAPS",
    "GSI2_PK": "TYPE#NEIGHBOURHOOD",
    "LOCATION_HEADER_KEY": null,
    "MAX_COL": 7,
    "MAX_ROW": 1,
    "NAME": "South Ham",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01HYEEVJMRK4SM9X492BBTNAPS",
    "TIMEZONE_ID": "Europe/London",
    "TOTAL_CONTROL_AREAS": 1
  }
];

export const AREA_ENTITIES = [
  {
    "CA_DIMENSIONS": [
      0,
      0
    ],
    "CREATED_AT": "2023-03-28T16:18:08.150Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "AREA",
    "ENTITY_TYPE_ID": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "NAME": "Pemerton Road",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y"
  },
  {
    "CA_DIMENSIONS": [
      0,
      1
    ],
    "CREATED_AT": "2023-03-28T16:18:08.150Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "AREA",
    "ENTITY_TYPE_ID": "AREA#01HYD4YE382CFHEYGD6JJ5E6T5",
    "NAME": "Vivian Road",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31#01HYD4YE382CFHEYGD6JJ5E6T5"
  }
];

export const SCHEDULE_ENTITIES = [
  {
    "CYCLE_COMPLETED_AT": null,
    "CREATED_AT": "2023-03-29T08:31:17.844Z",
    "CYCLE_COMPLETING_AT": DEMO_DATES[2] + "T23:59:59.000Z",
    "CYCLE_STARTED_AT": DEMO_DATES[0] + "T00:00:00.000Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "SCHEDULE",
    "ENTITY_TYPE_ID": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "AREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "NAME": "Monitoring Period One",
    "PATH": "PATH#01GBX6RZBVNXZWK8RAS1Y9YHHT#01HT2KHCEGY77YT43SW7TNQE8R#01HYD4FY2RG53YAGJABYY5H1PN#01GBX6RZBWRWY3Q37QST99KB31#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "PROVIDER": "Dev Community Amplify Challenge",
    "CONTRACT": "Six Months"
  }
];

export const MEASUREMENTS_ENTITIES = [
  {
    "CREATED_AT": DEMO_DATES[0] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HKQBVV3F3JG8E3E38XZAPM5P",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[0] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
  },
  {
    "CREATED_AT": DEMO_DATES[0] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HYD5C1GTV8B1HC0HW17ET3YG",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[0] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
  },
  {
    "CREATED_AT": DEMO_DATES[1] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HKQBV7D7Q61R5B9705SY6035",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[1] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
  },
  {
    "CREATED_AT": DEMO_DATES[1] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HYD5BD4WNJ41573XX2KDQM0X",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GWP7W9TKG2D7BFAJB8FMFDPQ",
    "GSI5_PK": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[1] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
  },
  {
    "CREATED_AT": DEMO_DATES[2] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HKQBRJ963JBF0VGZ177W2AXR",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GC6NGSW1JPHXE8CW271R9TNA",
    "GSI5_PK": "MEASUREMENTBYAREA#SUPPLY#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[2] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
  },
  {
    "CREATED_AT": DEMO_DATES[2] + "T00:58:00.00Z",
    "DELETED_AT": null,
    "ENTITY_TYPE": "MEASUREMENTBYAREA#01GWMG6CM28MYG92WWMEQMTZ1Y",
    "ENTITY_TYPE_ID": "MEASUREMENT#01HYD5B5HMDV6750GFQG2M5ETK",
    "GSI2_PK": "LOCATION#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI3_PK": "SCHEDULE#01GC6NGSW1JPHXE8CW271R9TNA",
    "GSI5_PK": "MEASUREMENTBYAREA#DEMAND#LOC#01GBX6RZBWRWY3Q37QST99KB31",
    "GSI5_SK": DEMO_DATES[2] + "#01GBX6RZBWRWY3Q37QST99KB31",
    "INDEX_AVG": 0.35,
    "INDEX_HISTORY": "{\"10\":\"0.4\",\"11\":\"0.5\",\"12\":\"0.6\",\"13\":\"0.7\",\"14\":\"0.4\",\"15\":\"0.3\",\"16\":\"0.4\",\"17\":\"0.35\",\"07\":\"0.1\",\"08\":\"0.2\",\"09\":\"0.3\"}",
    "INDEX_LATEST": 0.35
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