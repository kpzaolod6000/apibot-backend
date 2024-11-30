require("dotenv").config();
const parseString = require("xml2js").parseString;
const fetch = require("node-fetch");
const cache = require("memory-cache");

const phobsEndpoint =
  "https://secure.phobs.net/webservice/pconnect/service.php";

const properties = {
  "Premium Camping Zadar - Mobilehomes": "c4328c3ed6c2aa188441ca603c9ba45e",
  "Premium Camping Zadar - Parzellen": "d46b7ad4423516e339a982444a471ee3",
  "Falkensteiner Residences Jesolo": "994722fa66721ca9b102399569a58d08",
  "Luxury Villas Punta Skala": "ab15b29c1392294846d1d710aa8c931e",
  "Camping Hafnersee": "3224d72135ef09db35bc26c3fd012a1a",
  "Falkensteiner Camping Lake Blagus - Pitches":
    "180c89e97ca191aca602475f81ecafcb",
  "Falkensteiner Camping Lake Blagus - Mobile Homes":
    "acd8d7020b30e84e09f6a62df7bb1211",
};

const units = {
  "Pitch Sky Blue": "34486",
  "Pitch Blue": "4071",
  "Pitch Diamond": "22857",
  "Pitch Diamond Premium": "29728",
  "Pitch Gold": "4073",
  "Pitch Gold Premium": "29727",

  "Camping Cozy Home 30m2": "23591",
  "Camping Family Home 40m2": "23592",
  "Glamping Premium Home 50m2": "23603",
  "Camping Family Home Plus 40m2": "23593",

  "Apartment Sandolino": "34218",
  "Apartment Sandolo": "34219",
  "Apartment Gondola Deluxe": "34220",
  "Apartment Bateo": "34221",

  "Villa Donata": "35070",
  "Villa Anastacia": "35068",

  "Pitch Bronze": "36847",
  "Pitch Silver": "36848",
  "Pitch Gold (Lakeshore Hafnersee)": "36849",
  "Pitch Max (Hafnersee)": "36850",

  "Pitch Standard": "36950",
  "Pitch Max (Blagus)": "36951",
  "Pitch Max with Wooden Tent": "36952",

  "Lake House - Top Row": "36936",
  "Lake House - Middle Row": "36934",
  "Lake House - Shore Row": "36932",
  "Lake House with Wooden Tent - Top Row": "36937",
  "Lake House with Wooden Tent  - Middle Row": "36935",
  "Lake House with Wooden Tent  - Shore Row": "36933",
  "Comfort House Family": "36938",
  "Comfort House Family Max": "36939",
};

const ratePlans = {
  "Best available rate - Zadar Parzellen": "RATE391327",
  "Early bird - Zadar Parzellen":"RATE391328",
  "Black friday special - Zadar Parzellen":"RATE420585",
  "Exclusive free upgrade - Zadar Parzellen":"RATE427583",
  "Room Only - Zadar Mobilehomes":"RATE383754",
  "Early bird - Zadar Mobilehomes":"RATE391287",
  "with Breakfast - Zadar Mobilehomes":"RATE391291",
  "Black friday special - Zadar Mobilehomes":"RATE420571",
  "Valentines month special - Zadar Mobilehomes":"RATE425973",
  "Exclusive free upgrade - Zadar Mobilehomes":"RATE427582",
  "Granfondo 2024 - Zadar Mobilehomes":"RATE429977",
  "Tennis holidays - Zadar Mobilehomes":"RATE430547",
  "Funtastic weekends - Zadar Mobilehomes":"RATE430677",

  "Best available rate - Jesolo":"RATE389325",
  "Early bird - Jesolo":"RATE389326",
  "with Breakfast - Skala":"RATE391828",
  "with half board - Skala":"RATE400991",

  "Best rate - Hafnersee":"RATE424730",
  "Best rate - Blagus Pitches":"RATE424733",
  "Opening Special - Blagus Pitches":"RATE437102",
  "Best rate - Blagus Mobilehomes":"RATE428620",
  "Opening Special - Blagus Mobilehomes":"RATE437087",
};

const calendar = async (
  property,
  date,
  unit,
) => {
  if (properties.hasOwnProperty(property)) {
    const propertyId = properties[property];
    const unitId = units[unit];
    const dateCheck = new Date(date);
    console.time(unitId);

    // Restar 10 días
    var fechaAntes = new Date(dateCheck);
    fechaAntes.setDate(fechaAntes.getDate() - 10);

    // Sumar 10 días
    var fechaDespues = new Date(dateCheck);
    fechaDespues.setDate(fechaDespues.getDate() + 10);

    // Formatear las fechas
    var fechaAntesFormateada = fechaAntes.toISOString().split("T")[0];
    var fechaActualFormateada = dateCheck.toISOString().split("T")[0];
    var fechaDespuesFormateada = fechaDespues.toISOString().split("T")[0];

    console.log("Fecha 10 días antes:", fechaAntesFormateada);
    console.log("Fecha actual:", fechaActualFormateada);
    console.log("Fecha 10 días después:", fechaDespuesFormateada);

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PCAvailabilityCalendarRQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <PropertyId>${propertyId}</PropertyId>
      <Period Start="${fechaAntesFormateada}" End="${fechaDespuesFormateada}" />
      <UnitId>${unitId}</UnitId>
    </PCAvailabilityCalendarRQ>`;
    try {
      const response = await fetch(phobsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: xml,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      console.log(xml);
      console.log(result);
      console.timeEnd(unitId);
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

const availability = async (
  property,
  nights,
  date,
  unit,
  ratePlan,
  adults,
  childrenAges,
) => {
  if (properties.hasOwnProperty(property)) {
    const propertyId = properties[property];
    const unitId = units[unit];
    const ratePlanId = ratePlans[ratePlan];
    let children = "";

    if (childrenAges.length > 0) {
      children = `<Children>${
        childrenAges
          .map((age) => `<ChildAge>${age}</ChildAge>`)
          .join("")
      }</Children>`;
    }
    console.time(unitId);
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PCPropertyAvailabilityRQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <PropertyId>${propertyId}</PropertyId>
      <UnitFilter>
        <Date>${date}</Date>
        <Nights>${nights}</Nights>
        <RateId>${ratePlanId}</RateId>
        <UnitId>${unitId}</UnitId>
        <UnitItem>
          <Item>
            <Adults>${adults}</Adults>
              ${children}
          </Item>
        </UnitItem>
      </UnitFilter>
    </PCPropertyAvailabilityRQ>`;
    try {
      const response = await fetch(
        phobsEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xml,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      console.log(xml);
      console.log(result);
      const bookData = await new Promise((resolve, reject) => {
        parseString(result, function (err, result) {
          if (result.PCPropertyAvailabilityRS.ResponseType[0].Errors) {
            const errorMessage = {
              error: "The property is not available for that date",
            };
            resolve({ error: errorMessage });
            //console.log(result.PCPropertyAvailabilityRS.ResponseType[0].Errors);
            //console.log("The property is not available for that date");
            return JSON.stringify(errorMessage, null, 2);
          } else {
            const book =
              result.PCPropertyAvailabilityRS.AvailabilityList[0].RatePlans[0]
                .RatePlan[0];
            const rate = book.Units[0].Unit[0].Rate[0];
            console.log(rate);
            const bookData = {
              RatePlanName: book.Name[0],
              UnitName: book.Units[0].Unit[0].Name[0],
              bookUrl: book.Units[0].Unit[0].BookUrl[0],
              priceNight: rate.Price[0]._ + rate.Price[0]["$"]["Currency"] +
                rate.Price[0]["$"]["PriceType"],
              priceTotal: rate.StayTotal[0].Price[0] +
                rate.StayTotal[0].Currency[0] + rate.StayTotal[0].PriceType[0],
            };
            resolve(bookData);
          }
        });
      });
      console.timeEnd(unitId);
      return JSON.stringify(bookData, null, 2);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

const descript = async (prop, request, type) => {
  if (
    properties.hasOwnProperty(prop) || units.hasOwnProperty(prop) ||
    ratePlans.hasOwnProperty(prop)
  ) {
    const propId = request === "DescProperty"
      ? properties[prop]
      : request === "DescUnit"
      ? units[prop]
      : request === "DescRatePlan"
      ? ratePlans[prop]
      : null;
    console.time(propId);
    const cachedResult = cache.get(propId);
    if (cachedResult) {
      console.log("Result from cache");
      return cachedResult;
    }
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PC${request}RQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <${type}>${propId}</${type}>
    </PC${request}RQ>`;
    try {
      const response = await fetch(
        phobsEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xml,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      cache.put(propId, result, 24 * 60 * 60 * 1000);
      console.log(result);
      console.timeEnd(propId);
      return result;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

const list = async (requestName) => {
  console.time("list");
  /*const cachedResult = cache.get(requestName);
  if (cachedResult) {
    console.log("Result from cache");
    return cachedResult;
  }*/

  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PC${requestName}RQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
    </PC${requestName}RQ>`;
  console.log(xml);
  try {
    const response = await fetch(
      phobsEndpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: xml,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.text();

    cache.put(requestName, result, 24 * 60 * 60 * 1000);
    console.timeEnd("list");

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    console.timeEnd("list");
  }
};

const listUnits = async (property) => {
  console.log(property)
  if (properties.hasOwnProperty(property)) {
    const propertyId = properties[property];
    console.time(propertyId);
    const cachedResult = cache.get(propertyId);
    if (cachedResult) {
      console.log("Result from cache");
      return cachedResult;
    }
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PCListUnitRQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <PropertyId>${propertyId}</PropertyId>
    </PCListUnitRQ>`;
    try {
      const response = await fetch(
        phobsEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xml,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      cache.put(propertyId, result, 24 * 60 * 60 * 1000);
      console.log(xml);
      const unitsData = await new Promise((resolve, reject) => {
        parseString(result, function (err, result) {
          if (err) {
            reject(err);
          } else {
            console.log(
              result.PCListUnitRS.Units[0].Unit,
            );
            const units = result.PCListUnitRS.Units[0].Unit;
            const unitsData = units.map((unit) => ({
              Name: unit.Name[0],
              OccupancyMax: unit["$"]["OccupancyMax"],
            }));
            resolve(unitsData);
          }
        });
      });
      console.timeEnd(propertyId);
      return JSON.stringify(unitsData, null, 2);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

const listAmenities = async (property) => {
  if (properties.hasOwnProperty(property)) {
    const propertyId = properties[property];
    console.time(propertyId);
    const cachedResult = cache.get(propertyId);
    if (cachedResult) {
      console.log("Result from cache");
      return cachedResult;
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PCListPropertyAmenitiesRQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <PropertyId>${propertyId}</PropertyId>
    </PCListPropertyAmenitiesRQ>`;
    try {
      const response = await fetch(
        phobsEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xml,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      console.log(xml);
      const amenityNames = await new Promise((resolve, reject) => {
        parseString(result, function (err, result) {
          if (err) {
            reject(err);
          } else {
            const amenities =
              result.PCListPropertyAmenitiesRS.PropertyAmenities[0].Amenitie;
            const amenityNames = amenities.map((amenity) => amenity._);
            resolve(amenityNames);
          }
        });
      });

      cache.put(propertyId, amenityNames, 24 * 60 * 60 * 1000);
      console.timeEnd(propertyId);
      return amenityNames;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

const listRatePlans = async (property, year) => {
  if (properties.hasOwnProperty(property)) {
    const propertyId = properties[property];
    console.time(propertyId);
    /*const cachedResult = cache.get(propertyId);
    if (cachedResult) {
      console.log("Result from cache");
      return cachedResult;
    }*/

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <PCListRatePlansRQ>
      <Auth>
        <Username>${process.env.PHOBS_USERNAME}</Username>
        <Password>${process.env.PHOBS_PASSWORD}</Password>
        <SiteId>${process.env.PHOBS_SITE_ID}</SiteId>
      </Auth>
      <PropertyId>${propertyId}</PropertyId>
      <Year>2024</Year>
    </PCListRatePlansRQ>`;
    try {
      const response = await fetch(
        phobsEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/xml",
          },
          body: xml,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.text();
      console.log(xml);
      const ratePlansNames = await new Promise((resolve, reject) => {
        parseString(result, function (err, result) {
          if (err) {
            reject(err);
          } else {
            console.log(result.PCListRatePlansRS.RatePlans[0].RatePlan);
            const ratePlans = result.PCListRatePlansRS.RatePlans[0].RatePlan;
            const ratePlansNames = ratePlans.map((ratePlan) =>
              ratePlan.Name[0]
            );
            resolve(ratePlansNames);
          }
        });
      });
      cache.put(propertyId, ratePlansNames, 24 * 60 * 60 * 1000);
      console.timeEnd(propertyId);
      return ratePlansNames;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  } else {
    const result = "Not property found, ask for property";
    return result;
  }
};

module.exports = {
  list,
  listUnits,
  listAmenities,
  listRatePlans,
  descript,
  availability,
  calendar,
};
